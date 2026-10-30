-- Forward-only LifeCity extension: escrowed building projects and revocable
-- city-only viewing. Never edits an existing balance or existing world record.
begin;

create table public.city_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_id text not null references public.catalog_items(id),
  target_price integer not null check (target_price between 1 and 1000000),
  funded integer not null default 0 check (funded between 0 and target_price),
  status text not null default 'saving' check (status in ('saving','completed','cancelled')),
  inventory_id uuid unique references public.inventory_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'completed' or funded = target_price),
  check (status <> 'cancelled' or funded = 0)
);
create unique index city_one_saving_project on public.city_projects(user_id) where status='saving';
create index city_projects_owner on public.city_projects(user_id,created_at);

create table public.city_shares (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  code_digest text unique,
  expires_at timestamptz,
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  check (not enabled or (code_digest is not null and expires_at is not null))
);
create table public.city_visit_reactions (
  owner_id uuid not null references public.city_shares(user_id) on delete cascade,
  revision integer not null check (revision > 0),
  visitor_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('like','greeting')),
  greeting text check (greeting in ('beautiful','keep_going','welcome')),
  created_at timestamptz not null default now(),
  primary key (owner_id,revision,visitor_id,kind),
  check ((kind='like' and greeting is null) or (kind='greeting' and greeting is not null)),
  check (owner_id <> visitor_id)
);
create index city_visit_reactions_share on public.city_visit_reactions(owner_id,revision,kind);

alter table public.city_projects enable row level security;
alter table public.city_shares enable row level security;
alter table public.city_visit_reactions enable row level security;
create policy projects_owner_read on public.city_projects for select using (user_id=auth.uid());
create policy city_shares_owner_read on public.city_shares for select using (user_id=auth.uid());
create policy city_reactions_owner_read on public.city_visit_reactions for select using (owner_id=auth.uid());
revoke all on public.city_projects,public.city_shares,public.city_visit_reactions from public,anon,authenticated;
grant select on public.city_projects to authenticated;
-- Digests are not a browser-facing profile or export field. Visitor identities
-- likewise never become readable to owners or anonymous city-link viewers.
grant select (user_id,enabled,expires_at,revision,updated_at) on public.city_shares to authenticated;
grant select (owner_id,revision,kind,greeting,created_at) on public.city_visit_reactions to authenticated;

-- Preserve all previously shipped module behavior. Only the new wrapper is
-- referenced by game_command; neither implementation is directly executable.
alter function public.city_partner_command(uuid,text,jsonb,uuid) rename to city_partner_command_before_projects;
revoke all on function public.city_partner_command_before_projects(uuid,text,jsonb,uuid) from public,anon,authenticated;

create function public.city_partner_command(p_uid uuid,p_action text,p_payload jsonb,p_key uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  c public.catalog_items%rowtype;
  p public.city_projects%rowtype;
  s public.city_shares%rowtype;
  v_id uuid; v_inventory uuid; v_amount integer; v_balance bigint; v_level integer;
  v_refund integer; v_code text; v_kind text; v_greeting text; v_inserted integer;
  v_now timestamptz:=clock_timestamp();
begin
  if p_uid is null or p_uid is distinct from auth.uid() then raise exception 'AUTH_REQUIRED'; end if;
  if p_key is null or jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'INVALID_PAYLOAD'; end if;

  if p_action='project_start' then
    if jsonb_typeof(p_payload->'catalog_id') is distinct from 'string' then raise exception 'INVALID_PAYLOAD'; end if;
    select * into c from public.catalog_items where id=p_payload->>'catalog_id';
    if not found then raise exception 'NOT_FOUND'; end if;
    if c.is_furniture or c.model not in ('house','villa','apartment','skyscraper','palace') then raise exception 'WRONG_ITEM_TYPE'; end if;
    select balance,floor(sqrt(city_xp/100.0))::integer+1 into v_balance,v_level
      from public.wallets where user_id=p_uid for update;
    if v_level<c.unlock_level then raise exception 'ITEM_LOCKED'; end if;
    if exists(select 1 from public.city_projects where user_id=p_uid and status='saving') then raise exception 'PROJECT_ACTIVE'; end if;
    insert into public.city_projects(user_id,catalog_id,target_price) values(p_uid,c.id,c.price) returning id into v_id;
    return jsonb_build_object('project_id',v_id,'target_price',c.price,'catalog_id',c.id);

  elsif p_action in ('project_contribute','project_cancel') then
    v_id:=public.city_payload_uuid(p_payload,'project_id');
    select * into p from public.city_projects where id=v_id and user_id=p_uid for update;
    if not found then raise exception 'NOT_FOUND'; end if;
    if p.status<>'saving' then raise exception 'PROJECT_NOT_ACTIVE'; end if;
    if p_action='project_cancel' then
      v_refund:=p.funded;
      if v_refund>0 then
        perform public.apply_coins(p_uid,v_refund,'project:refund','project:refund:'||p_key::text,p_uid,0);
      end if;
      update public.city_projects set status='cancelled',funded=0,updated_at=v_now where id=p.id;
      return jsonb_build_object('project_id',p.id,'refunded',v_refund,'status','cancelled');
    end if;
    v_amount:=public.city_payload_int(p_payload,'amount',1,1000000);
    if v_amount>p.target_price-p.funded then raise exception 'PROJECT_AMOUNT'; end if;
    select balance into v_balance from public.wallets where user_id=p_uid for update;
    if v_balance<v_amount then raise exception 'INSUFFICIENT_BALANCE'; end if;
    perform public.apply_coins(p_uid,-v_amount,'project:contribution','project:contribution:'||p_key::text,p_uid,0);
    if p.funded+v_amount=p.target_price then
      insert into public.inventory_items(user_id,catalog_id) values(p_uid,p.catalog_id) returning id into v_inventory;
      update public.city_projects set funded=target_price,status='completed',inventory_id=v_inventory,updated_at=v_now where id=p.id;
      return jsonb_build_object('project_id',p.id,'funded',p.target_price,'status','completed','inventory_id',v_inventory);
    end if;
    update public.city_projects set funded=funded+v_amount,updated_at=v_now where id=p.id;
    return jsonb_build_object('project_id',p.id,'funded',p.funded+v_amount,'status','saving');

  elsif p_action='share_enable' then
    -- Two independently generated UUIDs provide an unguessable bearer link.
    -- Only a SHA256 verifier is retained in the share record.
    v_code:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
    insert into public.city_shares(user_id,enabled,code_digest,expires_at,revision,updated_at)
      values(p_uid,true,encode(sha256(convert_to(v_code,'UTF8')),'hex'),v_now+interval '7 days',1,v_now)
      on conflict(user_id) do update set enabled=true,code_digest=excluded.code_digest,
        expires_at=excluded.expires_at,revision=public.city_shares.revision+1,updated_at=excluded.updated_at
      returning * into s;
    return jsonb_build_object('code',v_code,'expires_at',s.expires_at,'revision',s.revision);

  elsif p_action='share_disable' then
    update public.city_shares set enabled=false,code_digest=null,expires_at=null,updated_at=v_now where user_id=p_uid;
    return jsonb_build_object('enabled',false);

  elsif p_action='visit_react' then
    if jsonb_typeof(p_payload->'code') is distinct from 'string' then raise exception 'SHARE_UNAVAILABLE'; end if;
    v_code:=p_payload->>'code';
    if v_code !~ '^[0-9a-f]{64}$' then raise exception 'SHARE_UNAVAILABLE'; end if;
    -- Serialize with revocation/rotation; no target wallet or private profile is
    -- touched. A viewer cannot bypass consent by keeping a previously read view.
    select * into s from public.city_shares
      where code_digest=encode(sha256(convert_to(v_code,'UTF8')),'hex') for update;
    if not found or not s.enabled or s.expires_at<=clock_timestamp() then raise exception 'SHARE_UNAVAILABLE'; end if;
    if s.user_id=p_uid then raise exception 'SELF_VISIT'; end if;
    v_kind:=p_payload->>'kind';
    if v_kind is null or v_kind not in ('like','greeting') then raise exception 'INVALID_PAYLOAD'; end if;
    if v_kind='greeting' then
      v_greeting:=p_payload->>'message';
      if v_greeting is null or v_greeting not in ('beautiful','keep_going','welcome') then raise exception 'INVALID_PAYLOAD'; end if;
    end if;
    insert into public.city_visit_reactions(owner_id,revision,visitor_id,kind,greeting)
      values(s.user_id,s.revision,p_uid,v_kind,v_greeting) on conflict do nothing;
    get diagnostics v_inserted = row_count;
    return jsonb_build_object('kind',v_kind,'recorded',v_inserted=1);
  end if;

  return public.city_partner_command_before_projects(p_uid,p_action,p_payload,p_key);
end; $$;
revoke all on function public.city_partner_command(uuid,text,jsonb,uuid) from public,anon,authenticated;

alter function public.game_state_for(uuid) rename to game_state_for_before_projects;
revoke all on function public.game_state_for_before_projects(uuid) from public,anon,authenticated;
create function public.game_state_for(p_user uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_state jsonb;
begin
  v_state:=public.game_state_for_before_projects(p_user);
  return v_state||jsonb_build_object(
    'projects',coalesce((select jsonb_agg(to_jsonb(p)-'user_id'-'updated_at' order by p.created_at desc,p.id)
      from public.city_projects p where p.user_id=p_user),'[]'::jsonb),
    'city_share',(select jsonb_build_object('enabled',true,'expires_at',s.expires_at,'revision',s.revision)
      from public.city_shares s where s.user_id=p_user and s.enabled and s.expires_at>clock_timestamp())
  );
end; $$;
revoke all on function public.game_state_for(uuid) from public,anon,authenticated;

-- Explicit allowlist projection: no owner identity, inventory/placement IDs,
-- money, tasks, prayers, timestamps, partner notes or private room contents.
create function public.city_visit(p_code text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.city_shares%rowtype; v_size integer;
begin
  if p_code is null or p_code !~ '^[0-9a-f]{64}$' then raise exception 'SHARE_UNAVAILABLE'; end if;
  select * into s from public.city_shares where code_digest=encode(sha256(convert_to(p_code,'UTF8')),'hex');
  if not found or not s.enabled or s.expires_at<=clock_timestamp() then raise exception 'SHARE_UNAVAILABLE'; end if;
  select size into v_size from public.city_worlds where user_id=s.user_id;
  return jsonb_build_object(
    'title','LifeCity','size',v_size,'expires_at',s.expires_at,
    'placements',coalesce((select jsonb_agg(jsonb_build_object('catalog_id',p.catalog_id,'x',p.x,'y',p.y,'z',p.z,
      'rotation',p.rotation,'variant',p.variant) order by p.x,p.z,p.catalog_id)
      from public.city_placements p where p.user_id=s.user_id),'[]'::jsonb),
    'catalog',coalesce((select jsonb_agg(to_jsonb(c) order by c.price,c.id) from public.catalog_items c),'[]'::jsonb),
    'like_count',(select count(*) from public.city_visit_reactions r where r.owner_id=s.user_id and r.revision=s.revision and r.kind='like'),
    'greetings',(select jsonb_agg(jsonb_build_object('code',g.code,'count',(
      select count(*) from public.city_visit_reactions r where r.owner_id=s.user_id and r.revision=s.revision
        and r.kind='greeting' and r.greeting=g.code)) order by g.code)
      from unnest(array['beautiful','keep_going','welcome']) as g(code))
  );
end; $$;
revoke all on function public.city_visit(text) from public,anon,authenticated;
grant execute on function public.city_visit(text) to anon,authenticated;

commit;
