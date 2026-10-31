-- Additive V6 foundation. Existing main-wallet balances and history retain their
-- original nominal canonical value. No historic Yuyi grants are moved/replayed.
begin;
create schema if not exists lifecity_private;
revoke all on schema lifecity_private from public,anon,authenticated;
alter table public.wallets alter column balance type numeric(20,4);
alter table public.coin_transactions alter column delta type numeric(20,4);
alter table public.inventory_items add column retired_at timestamptz;
alter table public.profiles add column display_currency text not null default 'SAR'
  check(display_currency ~ '^[A-Z]{3}$');

create table public.yuyi_wallets(
 user_id uuid primary key references auth.users(id) on delete cascade,
 balance numeric(20,4) not null default 0 check(abs(balance)<=1000000000000),
 currency text not null default 'MAD' check(currency='MAD'),
 updated_at timestamptz not null default now()
);
create table public.yuyi_transactions(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 delta numeric(20,4) not null check(delta<>0), balance_before numeric(20,4) not null,
 balance_after numeric(20,4) not null, actor_id uuid references auth.users(id) on delete set null,
 source text not null check(source in('manual_yuyi_instruction','verified_partner','purchase','demolition','reversal')),
 note text not null default '' check(length(note)<=1000),
 reverses_id uuid unique references public.yuyi_transactions(id),
 idempotency_key text not null, created_at timestamptz not null default now(),
 unique(user_id,idempotency_key),check(balance_after=balance_before+delta)
);
create index yuyi_transactions_owner_time on public.yuyi_transactions(user_id,created_at desc);
create trigger yuyi_transactions_immutable before update or delete on public.yuyi_transactions
 for each row execute function public.ledger_immutable();
create table public.yuyi_worlds(
 id uuid primary key default gen_random_uuid(),user_id uuid not null unique references auth.users(id) on delete cascade,
 size integer not null default 16 check(size between 16 and 32),version integer not null default 1,
 city_xp bigint not null default 0 check(city_xp>=0)
);
create table public.yuyi_inventory(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 catalog_id text not null references public.catalog_items(id),created_at timestamptz not null default now(),
 first_placed_at timestamptz,retired_at timestamptz
);
create index yuyi_inventory_owner on public.yuyi_inventory(user_id);
create table public.yuyi_placements(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 world_id uuid not null references public.yuyi_worlds(id) on delete cascade,
 inventory_id uuid not null unique references public.yuyi_inventory(id),catalog_id text not null references public.catalog_items(id),
 x integer not null check(x between 0 and 31),y integer not null default 0 check(y=0),
 z integer not null check(z between 0 and 31),rotation integer not null check(rotation in(0,90,180,270)),
 version integer not null default 1 check(version>0)
);
create index yuyi_placements_owner on public.yuyi_placements(user_id);
create table public.fx_rate_snapshots(
 id uuid primary key default gen_random_uuid(),provider text not null check(provider='ExchangeRate-API'),
 source_url text not null check(source_url='https://www.exchangerate-api.com'),
 base_code text not null default 'SAR' check(base_code='SAR'),
 rate_time timestamptz not null unique,next_update timestamptz not null,
 rates jsonb not null check(jsonb_typeof(rates)='object'),fetched_at timestamptz not null default now()
);
create table public.yuyi_purchase_quotes(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 catalog_id text not null references public.catalog_items(id),canonical_cost numeric(20,4) not null check(canonical_cost>0),
 mad_cost numeric(20,2) not null check(mad_cost>0),fx_id uuid not null references public.fx_rate_snapshots(id),
 expires_at timestamptz not null,used_at timestamptz
);
create index yuyi_quotes_owner on public.yuyi_purchase_quotes(user_id,expires_at);
create table public.asset_paid_components(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 inventory_id uuid not null,realm text not null check(realm in('main','yuyi')),
 component text not null,paid_amount numeric(20,4) not null check(paid_amount>0 and paid_amount=round(paid_amount,2)),
 currency text not null check(currency in('SAR','MAD')),source_ledger_id uuid not null,
 fx_id uuid references public.fx_rate_snapshots(id),created_at timestamptz not null default now(),destroyed_at timestamptz,
 unique(realm,source_ledger_id,inventory_id,component),check((realm='main' and currency='SAR') or(realm='yuyi' and currency='MAD'))
);
create index asset_basis_owner_inventory on public.asset_paid_components(user_id,realm,inventory_id) where destroyed_at is null;
create table public.demolition_receipts(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 realm text not null check(realm in('main','yuyi')),placement_id uuid not null,
 paid_basis numeric(20,4) not null,refund numeric(20,4) not null,
 components jsonb not null,kept_inventory jsonb not null,
 command_key uuid not null,created_at timestamptz not null default now(),
 unique(user_id,command_key),unique(realm,placement_id),check(refund=paid_basis/2)
);
create index demolition_receipts_owner on public.demolition_receipts(user_id,created_at desc);
create trigger demolition_receipts_immutable before update or delete on public.demolition_receipts
 for each row execute function public.ledger_immutable();

do $$ declare t text; begin
 foreach t in array array['yuyi_wallets','yuyi_transactions','yuyi_worlds','yuyi_inventory','yuyi_placements','yuyi_purchase_quotes','asset_paid_components','demolition_receipts'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy owner_read on public.%I for select to authenticated using(user_id=(select auth.uid()))',t);
 end loop;
end $$;
alter table public.fx_rate_snapshots enable row level security;
revoke all on public.fx_rate_snapshots from public,anon,authenticated;

alter function public.ensure_player(uuid) rename to ensure_player_before_v6;
revoke all on function public.ensure_player_before_v6(uuid) from public,anon,authenticated;
create function public.ensure_player(p_user uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform public.ensure_player_before_v6(p_user);
 insert into public.yuyi_wallets(user_id) values(p_user) on conflict do nothing;
 insert into public.yuyi_worlds(user_id) values(p_user) on conflict do nothing;
end $$;
revoke all on function public.ensure_player(uuid) from public,anon,authenticated;
-- Existing identities receive ONLY an empty neighbor and zero independent wallet.
do $$ declare u uuid; begin for u in select id from public.profiles loop perform public.ensure_player(u); end loop; end $$;

create function public.fx_store_snapshot(p_data jsonb) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid; v_time timestamptz; r record; v_rates jsonb:='{}';
begin
 if p_data->>'result'<>'success' or p_data->>'base_code'<>'SAR' or p_data->>'provider'<>'https://www.exchangerate-api.com' then raise exception 'FX_INVALID'; end if;
 v_time:=to_timestamp((p_data->>'time_last_update_unix')::bigint);
 if v_time>clock_timestamp()+interval '5 minutes' or v_time<clock_timestamp()-interval '7 days' then raise exception 'FX_STALE'; end if;
 for r in select key,value from jsonb_each(p_data->'rates') loop
  if r.key !~ '^[A-Z]{3}$' or (r.value#>>'{}')::numeric not between 0.000000001 and 1000000000 then raise exception 'FX_INVALID'; end if;
  -- Cache only the supported game currencies; this is not a public rate-data API.
  if r.key=any(array['SAR','AED','KWD','QAR','BHD','OMR','YER','IQD','JOD','LBP','SYP','EGP','SDG','LYD','TND','DZD','MAD','MRU','SOS','DJF','KMF','ILS','USD','EUR']) then
   v_rates:=v_rates||jsonb_build_object(r.key,r.value#>>'{}');
  end if;
 end loop;
 if (v_rates->>'SAR')::numeric<>1 or not(v_rates?'MAD') then raise exception 'FX_INVALID'; end if;
 insert into public.fx_rate_snapshots(provider,source_url,rate_time,next_update,rates)
 values('ExchangeRate-API','https://www.exchangerate-api.com',v_time,to_timestamp((p_data->>'time_next_update_unix')::bigint),v_rates)
 on conflict(rate_time) do update set fetched_at=excluded.fetched_at returning id into v_id;
 return v_id;
end $$;
revoke all on function public.fx_store_snapshot(jsonb) from public,anon,authenticated;
grant execute on function public.fx_store_snapshot(jsonb) to service_role;

create function lifecity_private.yuyi_post(p_user uuid,p_delta numeric,p_source text,p_note text,p_actor uuid,p_key text,p_reverses uuid default null) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare b numeric; v_id uuid;
begin
 if p_delta=0 or abs(p_delta)>1000000000 or p_delta<>round(p_delta,4) then raise exception 'INVALID_AMOUNT'; end if;
 select balance into b from public.yuyi_wallets where user_id=p_user for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 insert into public.yuyi_transactions(user_id,delta,balance_before,balance_after,actor_id,source,note,idempotency_key,reverses_id)
 values(p_user,p_delta,b,b+p_delta,p_actor,p_source,p_note,p_key,p_reverses) returning id into v_id;
 update public.yuyi_wallets set balance=b+p_delta,updated_at=clock_timestamp() where user_id=p_user;
 return v_id;
end $$;
revoke all on function lifecity_private.yuyi_post(uuid,numeric,text,text,uuid,text,uuid) from public,anon,authenticated;

create function lifecity_private.main_refund(p_user uuid,p_amount numeric,p_key uuid) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;
begin
 insert into public.coin_transactions(user_id,delta,reason,idempotency_key,actor_id)
 values(p_user,p_amount,'demolition:refund','demolition:'||p_key::text,p_user) returning id into v_id;
 update public.wallets set balance=balance+p_amount,updated_at=clock_timestamp() where user_id=p_user;
 return v_id;
end $$;
revoke all on function lifecity_private.main_refund(uuid,numeric,uuid) from public,anon,authenticated;

-- Reconstruct verified legacy purchase basis ONLY through immutable receipt +
-- ledger + inventory identity. Unknown/gifted basis remains unknown, never guessed.
insert into public.asset_paid_components(user_id,inventory_id,realm,component,paid_amount,currency,source_ledger_id)
 select i.user_id,i.id,'main','purchase',-t.delta,'SAR',t.id
 from public.inventory_items i join public.command_receipts r on r.user_id=i.user_id and r.action='purchase'
 and r.response->'result'->>'inventory_id'=i.id::text
 join public.coin_transactions t on t.user_id=i.user_id and t.idempotency_key='purchase:'||r.key::text
 where t.delta<0 on conflict do nothing;

insert into public.asset_paid_components(user_id,inventory_id,realm,component,paid_amount,currency,source_ledger_id)
 select p.user_id,p.inventory_id,'main','project_contribution',-t.delta,'SAR',t.id
 from public.city_projects p join public.command_receipts cr on cr.user_id=p.user_id and cr.action='project_contribute' and cr.payload->>'project_id'=p.id::text
 join public.coin_transactions t on t.user_id=p.user_id and t.idempotency_key='project:contribution:'||cr.key::text
 where p.inventory_id is not null and t.delta<0 on conflict do nothing;

alter function public.city_partner_command(uuid,text,jsonb,uuid) rename to city_partner_command_before_v6;
revoke all on function public.city_partner_command_before_v6(uuid,text,jsonb,uuid) from public,anon,authenticated;
create function public.city_partner_command(p_uid uuid,p_action text,p_payload jsonb,p_key uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare
 r jsonb; c public.catalog_items%rowtype; a public.city_placements%rowtype; y public.yuyi_placements%rowtype;
 w public.yuyi_worlds%rowtype; q public.yuyi_purchase_quotes%rowtype; fx public.fx_rate_snapshots%rowtype;
 entry public.yuyi_transactions%rowtype; l public.partner_links%rowtype; pol public.partner_permissions%rowtype;
 v_id uuid; v_inv uuid; v_ledger uuid; v_owner uuid; v_amount numeric; v_total numeric; v_basis numeric; v_components jsonb;
 v_x int; v_z int; v_rot int; v_w int; v_d int; v_version int; v_count int; v_note text; v_currency text;
 v_ids uuid[]; v_keep jsonb; v_now timestamptz:=clock_timestamp(); v_day timestamptz;
begin
 if p_uid is null or p_uid is distinct from auth.uid() then raise exception 'AUTH_REQUIRED'; end if;
 if p_action='currency_set' then
  v_currency:=p_payload->>'currency';
  if not(v_currency=any(array['SAR','AED','KWD','QAR','BHD','OMR','YER','IQD','JOD','LBP','SYP','EGP','SDG','LYD','TND','DZD','MAD','MRU','SOS','DJF','KMF','ILS','USD','EUR'])) then raise exception 'FX_UNSUPPORTED'; end if;
  if v_currency<>'SAR' and not exists(select 1 from public.fx_rate_snapshots where rates?v_currency and rate_time>v_now-interval '48 hours') then raise exception 'FX_UNAVAILABLE'; end if;
  update public.profiles set display_currency=v_currency where id=p_uid;
  return jsonb_build_object('currency',v_currency);
 elsif p_action in('yuyi_adjust','yuyi_reverse') then
  if p_payload->'confirmed' is distinct from 'true'::jsonb then raise exception 'CONFIRMATION_REQUIRED'; end if;
  v_note:=btrim(coalesce(p_payload->>'note',''));
  if length(v_note)>1000 then raise exception 'INVALID_PAYLOAD'; end if;
  if p_action='yuyi_adjust' then
   if coalesce(p_payload->>'amount','') !~ '^-?[0-9]{1,9}(\.[0-9]{1,2})?$' then raise exception 'INVALID_AMOUNT'; end if;
   v_amount:=(p_payload->>'amount')::numeric;
   v_id:=lifecity_private.yuyi_post(p_uid,v_amount,'manual_yuyi_instruction',v_note,p_uid,p_key::text);
  else
   select * into entry from public.yuyi_transactions where id=public.payload_uuid(p_payload,'entry_id') and user_id=p_uid for update;
   if not found or entry.source not in('manual_yuyi_instruction','verified_partner') then raise exception 'NOT_FOUND'; end if;
   if exists(select 1 from public.yuyi_transactions where reverses_id=entry.id) then raise exception 'ALREADY_REVERSED'; end if;
   v_id:=lifecity_private.yuyi_post(p_uid,-entry.delta,'reversal',v_note,p_uid,p_key::text,entry.id);
  end if;
  return jsonb_build_object('entry_id',v_id,'wallet','YUYI_MAD');
 elsif p_action='partner_adjust' then
  v_owner:=public.city_payload_uuid(p_payload,'owner_id');
  if v_owner=p_uid then raise exception 'SELF_PARTNER'; end if;
  perform 1 from public.yuyi_wallets where user_id=v_owner for update;
  select * into l from public.partner_links where owner_id=v_owner and partner_id=p_uid and status='active' for update;
  if not found then raise exception 'FORBIDDEN'; end if;
  select * into pol from public.partner_permissions where link_id=l.id;
  v_amount:=public.city_payload_int(p_payload,'amount',-10000,10000);
  if v_amount=0 then raise exception 'INVALID_AMOUNT'; end if;
  if v_amount>0 and(not pol.can_award or v_amount>pol.max_award) or v_amount<0 and(not pol.can_deduct or -v_amount>pol.max_deduction) then raise exception 'PARTNER_LIMIT'; end if;
  if v_amount<0 and p_payload->'confirmed' is distinct from 'true'::jsonb then raise exception 'CONFIRMATION_REQUIRED'; end if;
  v_day:=(date_trunc('day',v_now at time zone(select timezone from public.profiles where id=v_owner))) at time zone(select timezone from public.profiles where id=v_owner);
  select coalesce(sum(abs(amount)),0) into v_total from public.partner_actions where owner_id=v_owner and created_at>=v_day and ((v_amount>0 and amount>0) or(v_amount<0 and amount<0));
  if v_total+abs(v_amount)>(case when v_amount>0 then pol.daily_award_limit else pol.daily_deduction_limit end) then raise exception 'PARTNER_DAILY_LIMIT'; end if;
  if(select count(*) from public.partner_actions where owner_id=v_owner and created_at>v_now-interval '1 minute')>=20 then raise exception 'RATE_LIMIT'; end if;
  if length(coalesce(p_payload->>'reason',''))>200 or length(coalesce(p_payload->>'note',''))>1000 then raise exception 'INVALID_PAYLOAD'; end if;
  insert into public.partner_actions(link_id,owner_id,partner_id,amount,reason,note,command_key) values(l.id,v_owner,p_uid,v_amount,coalesce(p_payload->>'reason',''),coalesce(p_payload->>'note',''),p_key) returning id into v_id;
  perform lifecity_private.yuyi_post(v_owner,v_amount,'verified_partner',coalesce(p_payload->>'note',''),p_uid,'partner:'||p_uid||':'||p_key);
  if v_amount>0 then insert into public.yuyi_memories(user_id,action_id,growth,note) values(v_owner,v_id,v_amount,coalesce(p_payload->>'note','')); end if;
  return jsonb_build_object('action_id',v_id,'owner_id',v_owner,'amount',v_amount,'wallet','YUYI_MAD');
 elsif p_action='yuyi_quote' then
  select * into c from public.catalog_items where id=p_payload->>'catalog_id' and not is_furniture;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into fx from public.fx_rate_snapshots order by rate_time desc limit 1;
  if not found or fx.rate_time<v_now-interval '48 hours' then raise exception 'FX_UNAVAILABLE'; end if;
  v_amount:=round(c.price*(fx.rates->>'MAD')::numeric,2);
  insert into public.yuyi_purchase_quotes(user_id,catalog_id,canonical_cost,mad_cost,fx_id,expires_at)
  values(p_uid,c.id,c.price,v_amount,fx.id,v_now+interval '2 minutes') returning * into q;
  return to_jsonb(q)-'user_id';
 elsif p_action='yuyi_purchase' then
  select * into q from public.yuyi_purchase_quotes where id=public.payload_uuid(p_payload,'quote_id') and user_id=p_uid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if q.used_at is not null then raise exception 'QUOTE_USED'; end if;
  if q.expires_at<v_now then raise exception 'QUOTE_EXPIRED'; end if;
  select * into c from public.catalog_items where id=q.catalog_id;
  if c.price<>q.canonical_cost then raise exception 'QUOTE_EXPIRED'; end if;
  select * into w from public.yuyi_worlds where user_id=p_uid for update;
  if floor(sqrt(w.city_xp/100.0))::int+1<c.unlock_level then raise exception 'ITEM_LOCKED'; end if;
  if(select balance from public.yuyi_wallets where user_id=p_uid)<q.mad_cost then raise exception 'INSUFFICIENT_BALANCE'; end if;
  v_ledger:=lifecity_private.yuyi_post(p_uid,-q.mad_cost,'purchase',c.id,p_uid,p_key::text);
  insert into public.yuyi_inventory(user_id,catalog_id) values(p_uid,c.id) returning id into v_inv;
  insert into public.asset_paid_components(user_id,inventory_id,realm,component,paid_amount,currency,source_ledger_id,fx_id)
  values(p_uid,v_inv,'yuyi','purchase',q.mad_cost,'MAD',v_ledger,q.fx_id);
  update public.yuyi_purchase_quotes set used_at=v_now where id=q.id;
  return jsonb_build_object('inventory_id',v_inv,'price',q.mad_cost::text,'currency','MAD');
 elsif p_action in('yuyi_place','yuyi_move','yuyi_remove') then
  select * into w from public.yuyi_worlds where user_id=p_uid for update;
  if p_action='yuyi_place' then
   v_inv:=public.payload_uuid(p_payload,'inventory_id');
   select catalog_id into v_note from public.yuyi_inventory where id=v_inv and user_id=p_uid and retired_at is null;
   if not found then raise exception 'NOT_OWNED'; end if;
   if exists(select 1 from public.yuyi_placements where inventory_id=v_inv) then raise exception 'ALREADY_PLACED'; end if;
  else
   select * into y from public.yuyi_placements where id=public.payload_uuid(p_payload,'placement_id') and user_id=p_uid for update;
   if not found then raise exception 'NOT_FOUND'; end if;
   if y.version<>public.payload_integer(p_payload,'expected_version',1,2147483647) then raise exception 'VERSION_CONFLICT'; end if;
   v_inv:=y.inventory_id;v_note:=y.catalog_id;
  end if;
  if p_action='yuyi_remove' then delete from public.yuyi_placements where id=y.id;
  else
   select * into c from public.catalog_items where id=v_note;
   v_x:=public.payload_integer(p_payload,'x',0,31);v_z:=public.payload_integer(p_payload,'z',0,31);v_rot:=public.payload_integer(p_payload,'rotation',0,270);
   if v_rot not in(0,90,180,270) then raise exception 'INVALID_ROTATION'; end if;
   v_w:=case when v_rot in(90,270) then c.footprint_z else c.footprint_x end;
   v_d:=case when v_rot in(90,270) then c.footprint_x else c.footprint_z end;
   if v_x+v_w>w.size or v_z+v_d>w.size then raise exception 'OUTSIDE_LAND'; end if;
   if exists(select 1 from public.yuyi_placements p join public.catalog_items i on i.id=p.catalog_id where p.user_id=p_uid and p.id is distinct from y.id
    and p.x<v_x+v_w and p.x+case when p.rotation in(90,270) then i.footprint_z else i.footprint_x end>v_x
    and p.z<v_z+v_d and p.z+case when p.rotation in(90,270) then i.footprint_x else i.footprint_z end>v_z) then raise exception 'COLLISION'; end if;
   if p_action='yuyi_place' then
    insert into public.yuyi_placements(user_id,world_id,inventory_id,catalog_id,x,z,rotation) values(p_uid,w.id,v_inv,c.id,v_x,v_z,v_rot) returning id into v_id;
    update public.yuyi_inventory set first_placed_at=v_now where id=v_inv and first_placed_at is null;
    if found then update public.yuyi_worlds set city_xp=city_xp+greatest(1,c.price/10) where id=w.id; end if;
   else update public.yuyi_placements set x=v_x,z=v_z,rotation=v_rot,version=version+1 where id=y.id;v_id:=y.id;end if;
  end if;
  update public.yuyi_worlds set version=version+1 where id=w.id;
  return jsonb_build_object('placement_id',v_id);
 elsif p_action in('demolition_quote','demolish') then
  v_note:=coalesce(p_payload->>'realm','main');
  if v_note not in('main','yuyi') then raise exception 'INVALID_PAYLOAD'; end if;
  v_id:=public.payload_uuid(p_payload,'placement_id');
  if v_note='main' then
   select * into a from public.city_placements where id=v_id and user_id=p_uid for update;
   if not found then raise exception 'NOT_FOUND'; end if;v_inv:=a.inventory_id;v_version:=a.version;
  else
   select * into y from public.yuyi_placements where id=v_id and user_id=p_uid for update;
   if not found then raise exception 'NOT_FOUND'; end if;v_inv:=y.inventory_id;v_version:=y.version;
  end if;
  if public.payload_integer(p_payload,'expected_version',1,2147483647)<>v_version then raise exception 'VERSION_CONFLICT'; end if;
  v_ids:=array[v_inv];v_keep:='[]';
  if v_note='main' then
   if p_payload?'destroy_furniture_ids' then
    select array_agg(value::uuid) into v_ids from jsonb_array_elements_text(p_payload->'destroy_furniture_ids');
    if coalesce(cardinality(v_ids),0)<>(select count(distinct inventory_id) from public.furniture_placements where house_id=a.id and user_id=p_uid and inventory_id=any(v_ids)) then raise exception 'NOT_OWNED'; end if;
    v_ids:=array[v_inv]||coalesce(v_ids,'{}'::uuid[]);
   end if;
   select coalesce(jsonb_agg(inventory_id),'[]') into v_keep from public.furniture_placements where house_id=a.id and user_id=p_uid and not(inventory_id=any(v_ids));
  end if;
  if exists(select 1 from unnest(v_ids) i(id) where not exists(select 1 from public.asset_paid_components b where b.user_id=p_uid and b.realm=v_note and b.inventory_id=i.id and b.destroyed_at is null)) then raise exception 'COST_BASIS_UNVERIFIED'; end if;
  select sum(paid_amount),jsonb_agg(jsonb_build_object('id',id,'inventory_id',inventory_id,'component',component,'paid',paid_amount::text,'currency',currency)) into v_basis,v_components from public.asset_paid_components where user_id=p_uid and realm=v_note and inventory_id=any(v_ids) and destroyed_at is null;
  if v_basis is null then raise exception 'COST_BASIS_UNVERIFIED'; end if;
  r:=jsonb_build_object('realm',v_note,'placement_id',v_id,'expected_version',v_version,'paid_basis',v_basis::text,'refund',(v_basis/2)::text,'rate','50%','components',v_components,'kept_inventory',v_keep,'land_retained',true);
  if p_action='demolition_quote' then return r;end if;
  if p_payload->'confirmed' is distinct from 'true'::jsonb then raise exception 'CONFIRMATION_REQUIRED'; end if;
  if p_payload->>'quoted_basis' is distinct from v_basis::text then raise exception 'QUOTE_EXPIRED'; end if;
  if v_note='main' then
   perform lifecity_private.main_refund(p_uid,v_basis/2,p_key);
   delete from public.furniture_placements where house_id=a.id;
   delete from public.city_placements where id=a.id;
   update public.inventory_items set retired_at=v_now where id=any(v_ids) and user_id=p_uid;
   update public.city_worlds set version=version+1 where user_id=p_uid;
  else
   perform lifecity_private.yuyi_post(p_uid,v_basis/2,'demolition','50% historical paid basis',p_uid,p_key::text);
   delete from public.yuyi_placements where id=y.id;
   update public.yuyi_inventory set retired_at=v_now where id=v_inv and user_id=p_uid;
   update public.yuyi_worlds set version=version+1 where user_id=p_uid;
  end if;
  update public.asset_paid_components set destroyed_at=v_now where user_id=p_uid and realm=v_note and inventory_id=any(v_ids) and destroyed_at is null;
  insert into public.demolition_receipts(user_id,realm,placement_id,paid_basis,refund,components,kept_inventory,command_key) values(p_uid,v_note,v_id,v_basis,v_basis/2,v_components,v_keep,p_key);
  return r;
 end if;
 -- Preserve the existing command implementation and its server validations.
 if p_action='purchase' then
  if (select display_currency from public.profiles where id=p_uid)<>'SAR' and not exists(select 1 from public.fx_rate_snapshots where rate_time>clock_timestamp()-interval '48 hours') then raise exception 'FX_UNAVAILABLE'; end if;
  if(select balance from public.wallets where user_id=p_uid)<(select price from public.catalog_items where id=p_payload->>'catalog_id') then raise exception 'INSUFFICIENT_BALANCE'; end if;
 elsif p_action='land_expand' and (select balance from public.wallets where user_id=p_uid)<1000 then raise exception 'INSUFFICIENT_BALANCE';
 elsif p_action in('place','interior_place') and exists(select 1 from public.inventory_items where id=public.payload_uuid(p_payload,'inventory_id') and user_id=p_uid and retired_at is not null) then raise exception 'NOT_OWNED';end if;
 r:=public.city_partner_command_before_v6(p_uid,p_action,p_payload,p_key);
 if p_action='partner_inspect' and r->'wallet' is distinct from 'null'::jsonb then
  r:=r||jsonb_build_object('wallet',(select jsonb_build_object('balance',balance,'currency','MAD','realm','YUYI_MAD') from public.yuyi_wallets where user_id=public.payload_uuid(p_payload,'owner_id')));
 elsif p_action='purchase' then
  v_inv:=(r->>'inventory_id')::uuid;
  insert into public.asset_paid_components(user_id,inventory_id,realm,component,paid_amount,currency,source_ledger_id)
   select p_uid,v_inv,'main','purchase',-delta,'SAR',id from public.coin_transactions where user_id=p_uid and idempotency_key='purchase:'||p_key::text;
 elsif p_action='project_contribute' and r?'inventory_id' then
  v_inv:=(r->>'inventory_id')::uuid;
  insert into public.asset_paid_components(user_id,inventory_id,realm,component,paid_amount,currency,source_ledger_id)
   select p_uid,v_inv,'main','project_contribution',-t.delta,'SAR',t.id from public.coin_transactions t join public.city_projects p on p.inventory_id=v_inv and p.user_id=p_uid
   where t.user_id=p_uid and t.delta<0 and (t.idempotency_key='project:contribution:'||p_key::text or exists(select 1 from public.command_receipts cr where cr.user_id=p_uid and cr.action='project_contribute' and cr.payload->>'project_id'=p.id::text and t.idempotency_key='project:contribution:'||cr.key::text));
 end if;
 return r;
end $$;
revoke all on function public.city_partner_command(uuid,text,jsonb,uuid) from public,anon,authenticated;

alter function public.game_state_for(uuid) rename to game_state_for_before_v6;
revoke all on function public.game_state_for_before_v6(uuid) from public,anon,authenticated;
create function public.game_state_for(p_user uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s jsonb;fx public.fx_rate_snapshots%rowtype;cur text;
begin
 s:=public.game_state_for_before_v6(p_user);
 select display_currency into cur from public.profiles where id=p_user;
 select * into fx from public.fx_rate_snapshots order by rate_time desc limit 1;
 return s||jsonb_build_object(
 'inventory',coalesce((select jsonb_agg(to_jsonb(i)) from public.inventory_items i where user_id=p_user and retired_at is null),'[]'),
 'v6',jsonb_build_object('version',1,'display_currency',cur,
 'yuyi_wallet',jsonb_build_object('currency','MAD','balance',(select balance::text from public.yuyi_wallets where user_id=p_user)),
 'yuyi_world',(select to_jsonb(w) from public.yuyi_worlds w where user_id=p_user),
 'yuyi_inventory',coalesce((select jsonb_agg(to_jsonb(i)) from public.yuyi_inventory i where user_id=p_user and retired_at is null),'[]'),
 'yuyi_placements',coalesce((select jsonb_agg(to_jsonb(i)) from public.yuyi_placements i where user_id=p_user),'[]'),
 'yuyi_ledger',coalesce((select jsonb_agg(to_jsonb(t)-'user_id') from(select * from public.yuyi_transactions where user_id=p_user order by created_at desc limit 100)t),'[]'),
 'demolitions',coalesce((select jsonb_agg(to_jsonb(t)-'user_id') from public.demolition_receipts t where user_id=p_user),'[]'),
 'fx',case when fx.id is null then null else jsonb_build_object('id',fx.id,'provider',fx.provider,'source_url',fx.source_url,'rate_time',fx.rate_time,'next_update',fx.next_update,'display_rate',fx.rates->>cur,'mad_rate',fx.rates->>'MAD','stale',fx.rate_time<clock_timestamp()-interval '48 hours') end));
end $$;
revoke all on function public.game_state_for(uuid) from public,anon,authenticated;
commit;
