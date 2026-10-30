-- LifeCity 3D: authoritative city commerce and consent-scoped Yuyi partners.
-- Apply after 001_core.sql and before seed.sql. All mutations enter game_command.
begin;

create table public.catalog_items (
  id text primary key,
  name_ar text not null, name_en text not null,
  description_ar text not null, description_en text not null,
  price integer not null check (price between 1 and 1000000),
  category text not null check (category in ('roads','nature','homes','landmarks','furniture','water','vehicles')),
  footprint_x integer not null check (footprint_x between 1 and 8),
  footprint_z integer not null check (footprint_z between 1 and 8),
  unlock_level integer not null default 1 check (unlock_level between 1 and 100),
  model text not null,
  is_furniture boolean not null default false,
  check (is_furniture = (category = 'furniture'))
);

create table public.city_rule_prices (
  action text primary key check (action='land_expand'),
  price integer not null check (price between 1 and 1000000)
);

create table public.city_land_tiles (
  world_id uuid not null references public.city_worlds(id) on delete cascade,
  x integer not null check (x between 0 and 31),
  z integer not null check (z between 0 and 31),
  primary key (world_id,x,z)
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_id text not null references public.catalog_items(id),
  created_at timestamptz not null default now(),
  first_placed_at timestamptz
);
create index inventory_owner_idx on public.inventory_items(user_id);

create table public.city_placements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null references public.city_worlds(id) on delete cascade,
  inventory_id uuid not null unique references public.inventory_items(id) on delete cascade,
  catalog_id text not null references public.catalog_items(id),
  x integer not null check (x between 0 and 31),
  y integer not null default 0 check (y = 0),
  z integer not null check (z between 0 and 31),
  rotation integer not null default 0 check (rotation in (0,90,180,270)),
  version integer not null default 1 check (version > 0),
  variant text not null default 'default',
  created_at timestamptz not null default now()
);
create index city_placements_world_idx on public.city_placements(world_id);

create table public.furniture_placements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  house_id uuid not null references public.city_placements(id) on delete cascade,
  inventory_id uuid not null unique references public.inventory_items(id) on delete cascade,
  catalog_id text not null references public.catalog_items(id),
  x integer not null check (x between 0 and 7),
  y integer not null default 0 check (y = 0),
  z integer not null check (z between 0 and 7),
  rotation integer not null default 0 check (rotation in (0,90,180,270)),
  version integer not null default 1 check (version > 0),
  variant text not null default 'default',
  created_at timestamptz not null default now()
);
create index furniture_house_idx on public.furniture_placements(house_id);

create table public.partner_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','active','revoked')),
  invite_digest text unique,
  invite_email text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  check (partner_id is null or partner_id <> owner_id),
  check (status <> 'active' or partner_id is not null)
);
create unique index one_active_partner_per_owner on public.partner_links(owner_id) where status = 'active';
create index partner_links_partner_idx on public.partner_links(partner_id);
create index partner_links_owner_idx on public.partner_links(owner_id,created_at);

create table public.partner_permissions (
  link_id uuid primary key references public.partner_links(id) on delete cascade,
  can_award boolean not null default false,
  can_deduct boolean not null default false,
  can_view_city boolean not null default false,
  can_view_tasks boolean not null default false,
  max_award integer not null default 100 check (max_award between 0 and 10000),
  max_deduction integer not null default 100 check (max_deduction between 0 and 10000),
  daily_award_limit integer not null default 500 check (daily_award_limit between 0 and 50000),
  daily_deduction_limit integer not null default 200 check (daily_deduction_limit between 0 and 50000)
);

create table public.partner_actions (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.partner_links(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0 and amount between -10000 and 10000),
  reason text not null default '' check (length(reason) <= 200),
  note text not null default '' check (length(note) <= 1000),
  created_at timestamptz not null default now(),
  command_key uuid not null,
  unique (owner_id,partner_id,command_key)
);
create index partner_actions_daily_idx on public.partner_actions(owner_id,created_at);

create table public.partner_messages (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.partner_links(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (length(btrim(message)) between 1 and 1000),
  created_at timestamptz not null default now(),
  command_key uuid not null,
  unique (sender_id,command_key)
);
create index partner_messages_owner_idx on public.partner_messages(owner_id,created_at);

create table public.partner_challenges (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.partner_links(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 200),
  reward integer not null check (reward between 1 and 10000),
  status text not null default 'open' check (status in ('open','completed','cancelled')),
  created_at timestamptz not null default now(),
  command_key uuid not null,
  unique (partner_id,command_key)
);
create index partner_challenges_owner_idx on public.partner_challenges(owner_id,created_at);

create table public.yuyi_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_id uuid unique references public.partner_actions(id) on delete set null,
  growth integer not null check (growth > 0),
  note text not null default '',
  created_at timestamptz not null default now()
);
create index yuyi_memories_owner_idx on public.yuyi_memories(user_id,created_at);

-- Visible records are owner-scoped, or the non-private shared partner history.
alter table public.catalog_items enable row level security;
alter table public.city_rule_prices enable row level security;
alter table public.city_land_tiles enable row level security;
alter table public.inventory_items enable row level security;
alter table public.city_placements enable row level security;
alter table public.furniture_placements enable row level security;
alter table public.partner_links enable row level security;
alter table public.partner_permissions enable row level security;
alter table public.partner_actions enable row level security;
alter table public.partner_messages enable row level security;
alter table public.partner_challenges enable row level security;
alter table public.yuyi_memories enable row level security;

create policy catalog_public_read on public.catalog_items for select using (true);
create policy city_rules_public_read on public.city_rule_prices for select using (true);
create policy land_owner_read on public.city_land_tiles for select using (
  exists(select 1 from public.city_worlds w where w.id = world_id and w.user_id = auth.uid())
);
create policy inventory_owner_read on public.inventory_items for select using (user_id = auth.uid());
create policy placements_owner_read on public.city_placements for select using (user_id = auth.uid());
create policy furniture_owner_read on public.furniture_placements for select using (user_id = auth.uid());
create policy links_participant_read on public.partner_links for select using (owner_id = auth.uid() or partner_id = auth.uid());
create policy permissions_participant_read on public.partner_permissions for select using (
  exists(select 1 from public.partner_links l where l.id = link_id and (l.owner_id = auth.uid() or l.partner_id = auth.uid()))
);
create policy actions_participant_read on public.partner_actions for select using (owner_id = auth.uid() or partner_id = auth.uid());
create policy messages_participant_read on public.partner_messages for select using (owner_id = auth.uid() or sender_id = auth.uid());
create policy challenges_participant_read on public.partner_challenges for select using (owner_id = auth.uid() or partner_id = auth.uid());
create policy memories_owner_read on public.yuyi_memories for select using (user_id = auth.uid());

revoke all on public.catalog_items,public.city_rule_prices,public.city_land_tiles,public.inventory_items,
  public.city_placements,public.furniture_placements,public.partner_links,
  public.partner_permissions,public.partner_actions,public.partner_messages,
  public.partner_challenges,public.yuyi_memories from public,anon,authenticated;
grant select on public.catalog_items,public.city_rule_prices to anon,authenticated;
grant select on public.city_land_tiles,public.inventory_items,public.city_placements,
  public.furniture_placements,public.partner_permissions,public.partner_actions,
  public.partner_messages,public.partner_challenges,public.yuyi_memories to authenticated;
-- Invite verifier and optional recipient email are deliberately absent from grants.
grant select (id,owner_id,partner_id,status,expires_at,created_at,accepted_at,revoked_at)
  on public.partner_links to authenticated;

create function public.city_payload_uuid(p_payload jsonb,p_name text) returns uuid
language plpgsql immutable set search_path=public,pg_temp as $$
begin
  if jsonb_typeof(p_payload->p_name) is distinct from 'string'
     or (p_payload->>p_name) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'INVALID_PAYLOAD';
  end if;
  return (p_payload->>p_name)::uuid;
end; $$;

create function public.city_payload_int(p_payload jsonb,p_name text,p_min integer,p_max integer) returns integer
language plpgsql immutable set search_path=public,pg_temp as $$
declare v numeric;
begin
  if jsonb_typeof(p_payload->p_name) is distinct from 'number'
     or (p_payload->>p_name) !~ '^-?[0-9]+$' then raise exception 'INVALID_PAYLOAD'; end if;
  v := (p_payload->>p_name)::numeric;
  if v < p_min or v > p_max then raise exception 'INVALID_PAYLOAD'; end if;
  return v::integer;
end; $$;

create function public.city_owned_land(p_user uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare w public.city_worlds%rowtype;
begin
  select * into w from public.city_worlds where user_id=p_user for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  insert into public.city_land_tiles(world_id,x,z)
  select w.id,x,z from generate_series(0,w.size-1) x cross join generate_series(0,w.size-1) z
  on conflict do nothing;
end; $$;

-- The caller holds the owner's wallet/world lock, serializing all footprint tests.
create function public.city_validate_placement(
  p_user uuid,p_inventory uuid,p_house uuid,p_x integer,p_z integer,p_rotation integer,p_exclude uuid default null
) returns public.catalog_items
language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.catalog_items%rowtype; w public.city_worlds%rowtype; v_width integer; v_depth integer; v_owned integer;
begin
  select c0.* into c from public.inventory_items i join public.catalog_items c0 on c0.id=i.catalog_id
    where i.id=p_inventory and i.user_id=p_user for update of i;
  if not found then raise exception 'NOT_OWNED'; end if;
  if p_rotation not in (0,90,180,270) then raise exception 'INVALID_ROTATION'; end if;
  v_width := case when p_rotation in (90,270) then c.footprint_z else c.footprint_x end;
  v_depth := case when p_rotation in (90,270) then c.footprint_x else c.footprint_z end;
  if p_house is null then
    if c.is_furniture then raise exception 'WRONG_ITEM_TYPE'; end if;
    select * into w from public.city_worlds where user_id=p_user for update;
    if p_x < 0 or p_z < 0 or p_x+v_width > w.size or p_z+v_depth > w.size then raise exception 'OUT_OF_BOUNDS'; end if;
    select count(*) into v_owned from public.city_land_tiles
      where world_id=w.id and x>=p_x and x<p_x+v_width and z>=p_z and z<p_z+v_depth;
    if v_owned <> v_width*v_depth then raise exception 'LAND_NOT_OWNED'; end if;
    if exists(select 1 from public.city_placements a join public.catalog_items b on b.id=a.catalog_id
      where a.world_id=w.id and a.id is distinct from p_exclude
      and a.x < p_x+v_width and a.x + case when a.rotation in (90,270) then b.footprint_z else b.footprint_x end > p_x
      and a.z < p_z+v_depth and a.z + case when a.rotation in (90,270) then b.footprint_x else b.footprint_z end > p_z)
      then raise exception 'COLLISION'; end if;
  else
    if not c.is_furniture then raise exception 'WRONG_ITEM_TYPE'; end if;
    perform 1 from public.city_placements a join public.catalog_items b on b.id=a.catalog_id
      where a.id=p_house and a.user_id=p_user and b.id in ('house','villa','palace');
    if not found then raise exception 'NOT_OWNED'; end if;
    if p_x < 0 or p_z < 0 or p_x+v_width > 8 or p_z+v_depth > 8 then raise exception 'OUT_OF_BOUNDS'; end if;
    if exists(select 1 from public.furniture_placements a join public.catalog_items b on b.id=a.catalog_id
      where a.house_id=p_house and a.id is distinct from p_exclude
      and a.x < p_x+v_width and a.x + case when a.rotation in (90,270) then b.footprint_z else b.footprint_x end > p_x
      and a.z < p_z+v_depth and a.z + case when a.rotation in (90,270) then b.footprint_x else b.footprint_z end > p_z)
      then raise exception 'COLLISION'; end if;
  end if;
  if exists(select 1 from public.city_placements where inventory_id=p_inventory and id is distinct from p_exclude)
    or exists(select 1 from public.furniture_placements where inventory_id=p_inventory and id is distinct from p_exclude)
    then raise exception 'ALREADY_PLACED'; end if;
  return c;
end; $$;

create function public.city_first_placement(p_user uuid,p_inventory uuid,p_price integer) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update public.inventory_items set first_placed_at=now() where id=p_inventory and user_id=p_user and first_placed_at is null;
  if found then update public.wallets set city_xp=city_xp+greatest(1,p_price/10) where user_id=p_user; end if;
end; $$;

create function public.city_partner_command(p_uid uuid,p_action text,p_payload jsonb,p_key uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  c public.catalog_items%rowtype; w public.city_worlds%rowtype;
  a public.city_placements%rowtype; f public.furniture_placements%rowtype;
  l public.partner_links%rowtype; pol public.partner_permissions%rowtype;
  v_id uuid; v_inventory uuid; v_house uuid; v_owner uuid; v_action_id uuid;
  v_x integer; v_z integer; v_rotation integer; v_version integer; v_amount integer;
  v_balance integer; v_level integer; v_total bigint; v_count integer; v_price integer;
  v_code text; v_email text; v_reason text; v_note text; v_day_start timestamptz; v_zone text;
  v_now timestamptz;
  v_result jsonb;
begin
  if p_uid is null or p_uid is distinct from auth.uid() then raise exception 'AUTH_REQUIRED'; end if;
  if p_key is null or jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'INVALID_PAYLOAD'; end if;

  if p_action='purchase' then
    select * into c from public.catalog_items where id=p_payload->>'catalog_id';
    if not found then raise exception 'NOT_FOUND'; end if;
    select balance, floor(sqrt(city_xp/100.0))::integer+1 into v_balance,v_level
      from public.wallets where user_id=p_uid for update;
    if v_level < c.unlock_level then raise exception 'ITEM_LOCKED'; end if;
    if v_balance < c.price then raise exception 'INSUFFICIENT_BALANCE'; end if;
    perform public.apply_coins(p_uid,-c.price,'purchase:'||c.id,'purchase:'||p_key::text,p_uid,0);
    insert into public.inventory_items(user_id,catalog_id) values(p_uid,c.id) returning id into v_id;
    return jsonb_build_object('inventory_id',v_id,'catalog_id',c.id,'price',c.price);

  elsif p_action in ('place','interior_place') then
    v_inventory:=public.city_payload_uuid(p_payload,'inventory_id');
    v_x:=public.city_payload_int(p_payload,'x',0,31); v_z:=public.city_payload_int(p_payload,'z',0,31);
    v_rotation:=public.city_payload_int(p_payload,'rotation',0,270);
    if p_action='interior_place' then v_house:=public.city_payload_uuid(p_payload,'house_id'); end if;
    perform public.city_owned_land(p_uid);
    c:=public.city_validate_placement(p_uid,v_inventory,v_house,v_x,v_z,v_rotation);
    if v_house is null then
      select * into w from public.city_worlds where user_id=p_uid;
      insert into public.city_placements(user_id,world_id,inventory_id,catalog_id,x,z,rotation)
        values(p_uid,w.id,v_inventory,c.id,v_x,v_z,v_rotation) returning id into v_id;
    else
      insert into public.furniture_placements(user_id,house_id,inventory_id,catalog_id,x,z,rotation)
        values(p_uid,v_house,v_inventory,c.id,v_x,v_z,v_rotation) returning id into v_id;
    end if;
    perform public.city_first_placement(p_uid,v_inventory,c.price);
    update public.city_worlds set version=version+1 where user_id=p_uid;
    return jsonb_build_object('placement_id',v_id,'version',1);

  elsif p_action in ('move','remove','interior_move','interior_remove') then
    v_id:=public.city_payload_uuid(p_payload,'placement_id');
    v_version:=public.city_payload_int(p_payload,'expected_version',1,2147483647);
    perform public.city_owned_land(p_uid);
    if p_action in ('move','remove') then
      select * into a from public.city_placements where id=v_id and user_id=p_uid for update;
      if not found then raise exception 'NOT_OWNED'; end if;
      if a.version <> v_version then raise exception 'VERSION_CONFLICT'; end if;
      if p_action='remove' then
        -- House removal recovers its furniture too; inventory rows are never deleted.
        delete from public.city_placements where id=v_id;
      else
        v_x:=public.city_payload_int(p_payload,'x',0,31); v_z:=public.city_payload_int(p_payload,'z',0,31);
        v_rotation:=public.city_payload_int(p_payload,'rotation',0,270);
        c:=public.city_validate_placement(p_uid,a.inventory_id,null,v_x,v_z,v_rotation,v_id);
        update public.city_placements set x=v_x,z=v_z,rotation=v_rotation,version=version+1 where id=v_id;
      end if;
    else
      select * into f from public.furniture_placements where id=v_id and user_id=p_uid for update;
      if not found then raise exception 'NOT_OWNED'; end if;
      if f.version <> v_version then raise exception 'VERSION_CONFLICT'; end if;
      if p_action='interior_remove' then delete from public.furniture_placements where id=v_id;
      else
        v_x:=public.city_payload_int(p_payload,'x',0,7); v_z:=public.city_payload_int(p_payload,'z',0,7);
        v_rotation:=public.city_payload_int(p_payload,'rotation',0,270);
        c:=public.city_validate_placement(p_uid,f.inventory_id,f.house_id,v_x,v_z,v_rotation,v_id);
        update public.furniture_placements set x=v_x,z=v_z,rotation=v_rotation,version=version+1 where id=v_id;
      end if;
    end if;
    update public.city_worlds set version=version+1 where user_id=p_uid;
    return jsonb_build_object('placement_id',v_id,'version',v_version+1,'removed',p_action in ('remove','interior_remove'));

  elsif p_action='land_expand' then
    select * into w from public.city_worlds where user_id=p_uid for update;
    if w.size>=32 then raise exception 'LAND_MAXIMUM'; end if;
    select price into v_price from public.city_rule_prices where action='land_expand';
    if not found then raise exception 'NOT_FOUND'; end if;
    select balance into v_balance from public.wallets where user_id=p_uid for update;
    if v_balance<v_price then raise exception 'INSUFFICIENT_BALANCE'; end if;
    perform public.apply_coins(p_uid,-v_price,'land_expand','land_expand:'||p_key::text,p_uid,0);
    update public.city_worlds set size=size+4,version=version+1 where id=w.id;
    perform public.city_owned_land(p_uid);
    update public.wallets set city_xp=city_xp+100 where user_id=p_uid;
    return jsonb_build_object('size',w.size+4,'price',v_price,'version',w.version+1);

  elsif p_action='partner_invite' then
    perform 1 from public.wallets where user_id=p_uid for update;
    if exists(select 1 from public.partner_links where owner_id=p_uid and status='active') then raise exception 'PARTNER_ALREADY_LINKED'; end if;
    select count(*) into v_count from public.partner_links where owner_id=p_uid and created_at>now()-interval '1 hour';
    if v_count>=5 then raise exception 'RATE_LIMIT'; end if;
    if p_payload ? 'email' then
      if jsonb_typeof(p_payload->'email')<>'string' then raise exception 'INVALID_PAYLOAD'; end if;
      v_email:=lower(btrim(p_payload->>'email'));
      if length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'INVALID_PAYLOAD'; end if;
      if exists(select 1 from auth.users where id=p_uid and lower(email)=v_email) then raise exception 'SELF_PARTNER'; end if;
    end if;
    update public.partner_links set status='revoked',invite_digest=null,revoked_at=now()
      where owner_id=p_uid and status='pending';
    v_code:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
    insert into public.partner_links(owner_id,invite_digest,invite_email)
      values(p_uid,md5(v_code),v_email) returning * into l;
    insert into public.partner_permissions(link_id) values(l.id);
    return jsonb_build_object('link_id',l.id,'code',v_code,'expires_at',l.expires_at);

  elsif p_action='partner_accept' then
    if jsonb_typeof(p_payload->'code') is distinct from 'string' then raise exception 'INVALID_PAYLOAD'; end if;
    v_code:=lower(btrim(p_payload->>'code'));
    if v_code !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_INVITATION'; end if;
    select owner_id into v_owner from public.partner_links where invite_digest=md5(v_code);
    if v_owner is null then raise exception 'INVALID_INVITATION'; end if;
    if v_owner=p_uid then raise exception 'SELF_PARTNER'; end if;
    perform 1 from public.wallets where user_id=v_owner for update;
    select * into l from public.partner_links where invite_digest=md5(v_code) for update;
    if not found or l.status<>'pending' or l.expires_at<=now() then raise exception 'INVALID_INVITATION'; end if;
    if l.invite_email is not null and not exists(select 1 from auth.users where id=p_uid and lower(email)=l.invite_email)
      then raise exception 'INVITATION_RECIPIENT'; end if;
    if exists(select 1 from public.partner_links where owner_id=l.owner_id and status='active') then raise exception 'PARTNER_ALREADY_LINKED'; end if;
    update public.partner_links set partner_id=p_uid,status='active',accepted_at=now(),invite_digest=null where id=l.id;
    return jsonb_build_object('link_id',l.id,'owner_id',l.owner_id);

  elsif p_action in ('partner_policy','partner_unlink') then
    v_id:=public.city_payload_uuid(p_payload,'link_id');
    select owner_id into v_owner from public.partner_links where id=v_id and
      (owner_id=p_uid or (p_action='partner_unlink' and partner_id=p_uid));
    if v_owner is null then raise exception 'FORBIDDEN'; end if;
    perform 1 from public.wallets where user_id=v_owner for update;
    select * into l from public.partner_links where id=v_id for update;
    if p_action='partner_unlink' then
      update public.partner_links set status='revoked',invite_digest=null,revoked_at=now() where id=l.id;
      return jsonb_build_object('link_id',l.id,'status','revoked');
    end if;
    if l.owner_id<>p_uid or l.status='revoked' then raise exception 'FORBIDDEN'; end if;
    if jsonb_typeof(p_payload->'can_award') is distinct from 'boolean'
      or jsonb_typeof(p_payload->'can_deduct') is distinct from 'boolean'
      or jsonb_typeof(p_payload->'can_view_city') is distinct from 'boolean'
      or jsonb_typeof(p_payload->'can_view_tasks') is distinct from 'boolean' then raise exception 'INVALID_PAYLOAD'; end if;
    update public.partner_permissions set
      can_award=(p_payload->>'can_award')::boolean,can_deduct=(p_payload->>'can_deduct')::boolean,
      can_view_city=(p_payload->>'can_view_city')::boolean,can_view_tasks=(p_payload->>'can_view_tasks')::boolean,
      max_award=public.city_payload_int(p_payload,'max_award',0,10000),
      max_deduction=public.city_payload_int(p_payload,'max_deduction',0,10000),
      daily_award_limit=public.city_payload_int(p_payload,'daily_award_limit',0,50000),
      daily_deduction_limit=public.city_payload_int(p_payload,'daily_deduction_limit',0,50000)
      where link_id=l.id;
    return jsonb_build_object('link_id',l.id,'updated',true);

  elsif p_action in ('partner_adjust','partner_message','partner_challenge','partner_inspect') then
    v_owner:=public.city_payload_uuid(p_payload,'owner_id');
    if v_owner=p_uid then raise exception 'SELF_PARTNER'; end if;
    -- Lock the affected wallet before its link, including non-financial partner writes.
    perform 1 from public.wallets where user_id=v_owner for update;
    select * into l from public.partner_links where owner_id=v_owner and partner_id=p_uid and status='active' for update;
    if not found then raise exception 'FORBIDDEN'; end if;
    v_now:=clock_timestamp();
    select * into pol from public.partner_permissions where link_id=l.id;
    if not found then raise exception 'FORBIDDEN'; end if;

    if p_action='partner_adjust' then
      v_amount:=public.city_payload_int(p_payload,'amount',-10000,10000);
      if v_amount=0 then raise exception 'INVALID_AMOUNT'; end if;
      if (p_payload ? 'reason' and jsonb_typeof(p_payload->'reason') is distinct from 'string')
        or (p_payload ? 'note' and jsonb_typeof(p_payload->'note') is distinct from 'string') then raise exception 'INVALID_PAYLOAD'; end if;
      v_reason:=btrim(coalesce(p_payload->>'reason','')); v_note:=btrim(coalesce(p_payload->>'note',''));
      if length(v_reason)>200 or length(v_note)>1000 then raise exception 'INVALID_PAYLOAD'; end if;
      if v_amount>0 and (not pol.can_award or v_amount>pol.max_award) then raise exception 'PARTNER_LIMIT'; end if;
      if v_amount<0 and (not pol.can_deduct or -v_amount>pol.max_deduction) then raise exception 'PARTNER_LIMIT'; end if;
      if v_amount<0 and p_payload->'confirmed' is distinct from 'true'::jsonb then raise exception 'CONFIRMATION_REQUIRED'; end if;
      select timezone into v_zone from public.profiles where id=v_owner;
      v_day_start:=date_trunc('day',v_now at time zone v_zone) at time zone v_zone;
      select coalesce(sum(abs(amount)),0) into v_total from public.partner_actions
        where owner_id=v_owner and created_at>=v_day_start and
          ((v_amount>0 and amount>0) or (v_amount<0 and amount<0));
      if v_total+abs(v_amount)>(case when v_amount>0 then pol.daily_award_limit else pol.daily_deduction_limit end) then raise exception 'PARTNER_DAILY_LIMIT'; end if;
      select count(*) into v_count from public.partner_actions where owner_id=v_owner and created_at>v_now-interval '1 minute';
      if v_count>=20 then raise exception 'RATE_LIMIT'; end if;
      insert into public.partner_actions(link_id,owner_id,partner_id,amount,reason,note,command_key,created_at)
        values(l.id,v_owner,p_uid,v_amount,v_reason,v_note,p_key,v_now) returning id into v_action_id;
      perform public.apply_coins(v_owner,v_amount,case when v_amount>0 then 'partner:award' else 'partner:deduction' end,
        'partner:'||p_uid::text||':'||p_key::text,p_uid,0);
      if v_amount>0 then
        insert into public.yuyi_memories(user_id,action_id,growth,note) values(v_owner,v_action_id,v_amount,v_note);
      end if;
      return jsonb_build_object('action_id',v_action_id,'owner_id',v_owner,'amount',v_amount);

    elsif p_action='partner_message' then
      if jsonb_typeof(p_payload->'message') is distinct from 'string' then raise exception 'INVALID_PAYLOAD'; end if;
      v_note:=btrim(p_payload->>'message');
      if length(v_note)<1 or length(v_note)>1000 then raise exception 'INVALID_PAYLOAD'; end if;
      select count(*) into v_count from public.partner_messages where sender_id=p_uid and created_at>now()-interval '1 hour';
      if v_count>=30 then raise exception 'RATE_LIMIT'; end if;
      insert into public.partner_messages(link_id,owner_id,sender_id,message,command_key)
        values(l.id,v_owner,p_uid,v_note,p_key) returning id into v_id;
      return jsonb_build_object('message_id',v_id);

    elsif p_action='partner_challenge' then
      if jsonb_typeof(p_payload->'title') is distinct from 'string' then raise exception 'INVALID_PAYLOAD'; end if;
      v_note:=btrim(p_payload->>'title');
      if length(v_note)<1 or length(v_note)>200 then raise exception 'INVALID_PAYLOAD'; end if;
      v_amount:=public.city_payload_int(p_payload,'reward',1,10000);
      if not pol.can_award or v_amount>pol.max_award then raise exception 'PARTNER_LIMIT'; end if;
      select count(*) into v_count from public.partner_challenges where partner_id=p_uid and created_at>now()-interval '1 hour';
      if v_count>=10 then raise exception 'RATE_LIMIT'; end if;
      insert into public.partner_challenges(link_id,owner_id,partner_id,title,reward,command_key)
        values(l.id,v_owner,p_uid,v_note,v_amount,p_key) returning id into v_id;
      return jsonb_build_object('challenge_id',v_id,'status','open');

    else
      select jsonb_build_object(
        'owner_id',v_owner,'display_name',p.display_name,'permissions',to_jsonb(pol),'wallet',null,
        'city',case when pol.can_view_city then jsonb_build_object(
          'world',(select to_jsonb(cw) from public.city_worlds cw where cw.user_id=v_owner),
          'placements',(select coalesce(jsonb_agg(to_jsonb(cp) order by cp.created_at),'[]'::jsonb) from public.city_placements cp where cp.user_id=v_owner),
          'furniture',(select coalesce(jsonb_agg(to_jsonb(fp) order by fp.created_at),'[]'::jsonb) from public.furniture_placements fp where fp.user_id=v_owner),
          'yuyi_memories',(select coalesce(jsonb_agg(jsonb_build_object('id',ym.id,'growth',ym.growth,'created_at',ym.created_at) order by ym.created_at),'[]'::jsonb) from public.yuyi_memories ym where ym.user_id=v_owner)
        ) else null end,
        'tasks',case when pol.can_view_tasks then (select coalesce(jsonb_agg(jsonb_build_object(
          'id',t.id,'title',t.title,'category',t.category,'daily_limit',t.daily_limit) order by t.id),'[]'::jsonb)
          from public.task_definitions t where t.user_id=v_owner and not t.archived) else null end
      ) into v_result from public.profiles p where p.id=v_owner;
      return v_result;
    end if;
  end if;
  raise exception 'UNKNOWN_ACTION';
end; $$;

-- PostgreSQL grants new functions to PUBLIC by default. Only the outer RPC owner
-- can invoke any helper, regardless of what p_uid a caller supplies.
revoke all on function public.city_payload_uuid(jsonb,text) from public,anon,authenticated;
revoke all on function public.city_payload_int(jsonb,text,integer,integer) from public,anon,authenticated;
revoke all on function public.city_owned_land(uuid) from public,anon,authenticated;
revoke all on function public.city_validate_placement(uuid,uuid,uuid,integer,integer,integer,uuid) from public,anon,authenticated;
revoke all on function public.city_first_placement(uuid,uuid,integer) from public,anon,authenticated;
revoke all on function public.city_partner_command(uuid,text,jsonb,uuid) from public,anon,authenticated;

commit;
