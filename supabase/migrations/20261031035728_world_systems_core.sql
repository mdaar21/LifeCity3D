-- Typed V6 entities and a restricted service settlement boundary. No old data is rewritten.
begin;
create table public.world_scenes(
 user_id uuid primary key references auth.users(id) on delete cascade,revision bigint not null default 0 check(revision>=0),
 initialized boolean not null default false,settings jsonb not null default '{"quality":"low","hour":null,"clock":"real","day_minutes":30,"weather":"clear","simulate_residents":false,"free_drive":false,"infrastructure":false,"muted":true,"reduced_motion":false,"photosensitive":true,"installments_enabled":false,"celebrations_enabled":true}',
 updated_at timestamptz not null default clock_timestamp()
);
create table public.world_entities(
 id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,
 realm text not null check(realm in('main','yuyi')),kind text not null check(kind in('parcel','terrain','building','node','edge','line','avatar','car','blueprint','surprise','decoration','furniture','district')),
 version integer not null check(version>0),status text not null check(status in('active','stored','retired')),
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=262144),created_at timestamptz not null,updated_at timestamptz not null default clock_timestamp(),
 check((data->>'id')::uuid=id and data->>'realm'=realm and data->>'kind'=kind and (data->>'version')::integer=version and data->>'status'=status)
);
create index world_entities_owner_kind on public.world_entities(user_id,realm,kind,status);
create unique index world_one_terrain on public.world_entities(user_id,realm) where kind='terrain' and status='active';
create unique index world_one_avatar on public.world_entities(user_id,realm) where kind='avatar' and status='active';
create table public.world_cost_components(
 id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,
 entity_id uuid not null references public.world_entities(id),part text not null check(length(part) between 1 and 160),
 wallet text not null check(wallet in('MAIN','YUYI_MAD')),paid numeric(20,4) not null check(paid>0 and paid<=1000000000 and paid=round(paid,2)),
 currency text not null check(currency in('SAR','MAD')),canonical numeric(20,4) not null check(canonical>0 and canonical<=1000000000),
 fx_id uuid references public.fx_rate_snapshots(id),main_ledger_id uuid references public.coin_transactions(id),mad_ledger_id uuid references public.yuyi_transactions(id),
 created_at timestamptz not null default clock_timestamp(),destroyed_at timestamptz,
 check((wallet='MAIN' and currency='SAR' and main_ledger_id is not null and mad_ledger_id is null) or(wallet='YUYI_MAD' and currency='MAD' and mad_ledger_id is not null and main_ledger_id is null))
);
create index world_cost_owner_entity on public.world_cost_components(user_id,entity_id) where destroyed_at is null;
create table public.world_quotes(
 id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,revision bigint not null,
 action text not null,payload jsonb not null,patch jsonb not null,refunds jsonb not null,
 legacy_versions jsonb not null,fx_id uuid references public.fx_rate_snapshots(id),realm text not null check(realm in('main','yuyi')),
 created_at timestamptz not null,expires_at timestamptz not null,used_at timestamptz
);
create index world_quotes_owner_expiry on public.world_quotes(user_id,expires_at);
create table public.world_events(
 id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,realm text not null check(realm in('main','yuyi')),
 kind text not null,source_key text not null,entity_id uuid,title text not null,metadata jsonb not null,
 created_at timestamptz not null default clock_timestamp(),seen boolean not null default false,unique(user_id,source_key)
);
create index world_events_owner_time on public.world_events(user_id,created_at desc);
create table public.world_settlements(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 command_key uuid not null,action text not null,bill jsonb not null,refunds jsonb not null,
 destroyed_components jsonb not null,created_at timestamptz not null default clock_timestamp(),unique(user_id,command_key)
);
create trigger world_settlements_immutable before update or delete on public.world_settlements for each row execute function public.ledger_immutable();
-- Small event deltas reconstruct old geometry without copying a full city on every edit.
create table public.world_history(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 command_key uuid not null,realm text not null check(realm in('main','yuyi')),title text not null,
 delta jsonb not null,metrics jsonb,created_at timestamptz not null default clock_timestamp(),unique(user_id,command_key)
);
create index world_history_owner_time on public.world_history(user_id,created_at);
create trigger world_history_immutable before update or delete on public.world_history for each row execute function public.ledger_immutable();
create table public.world_surprise_shares(
 surprise_id uuid primary key references public.world_entities(id),user_id uuid not null references auth.users(id) on delete cascade,
 token_hash text not null unique,enabled boolean not null default true,created_at timestamptz not null default clock_timestamp(),expires_at timestamptz not null
);
create index world_surprise_shares_owner on public.world_surprise_shares(user_id);
create function lifecity_private.world_cost_immutable() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if tg_op='DELETE' and not exists(select 1 from auth.users where id=old.user_id) then return old;end if;
 if tg_op='UPDATE' and old.destroyed_at is null and new.destroyed_at is not null and to_jsonb(old)-'destroyed_at'=to_jsonb(new)-'destroyed_at' then return new;end if;
 raise exception 'IMMUTABLE_LEDGER';
end $$;
create trigger world_cost_immutable before update or delete on public.world_cost_components for each row execute function lifecity_private.world_cost_immutable();
do $$declare t text;begin foreach t in array array['world_scenes','world_entities','world_cost_components','world_quotes','world_events','world_settlements','world_history'] loop
 execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from public,anon,authenticated',t);execute format('grant select on public.%I to authenticated',t);
 execute format('create policy owner_read on public.%I for select to authenticated using(user_id=(select auth.uid()))',t);
end loop;end $$;
alter table public.world_surprise_shares enable row level security;
revoke all on public.world_surprise_shares from public,anon,authenticated;

create function lifecity_private.world_snapshot(p_user uuid) returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('version',1,'initialized',s.initialized,'revision',s.revision,'settings',s.settings,
 'entities',coalesce((select jsonb_agg(e.data order by e.created_at,e.id) from public.world_entities e where e.user_id=p_user),'[]'),
 'components',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'entity_id',v.entity_id,'part',v.part,'wallet',v.wallet,'paid',v.paid::text,'currency',v.currency,'fx_id',v.fx_id,'destroyed_at',v.destroyed_at,'created_at',v.created_at)) from public.world_cost_components v where v.user_id=p_user),'[]'),
 'events',coalesce((select jsonb_agg(to_jsonb(v)-'user_id') from(select * from public.world_events where user_id=p_user order by created_at desc limit 150)v),'[]'),
 'quotes',coalesce((select jsonb_agg(to_jsonb(v)-'user_id'-'used_at') from public.world_quotes v where v.user_id=p_user and v.used_at is null and v.expires_at>clock_timestamp() and v.revision=s.revision),'[]'),
 'history',coalesce((select jsonb_agg(to_jsonb(v)) from(select id,title,created_at,realm from public.world_history where user_id=p_user order by created_at desc limit 100)v),'[]'),
 'metrics','[]'::jsonb) from public.world_scenes s where s.user_id=p_user
$$;
alter function public.game_state_for(uuid) rename to game_state_for_before_world;
revoke all on function public.game_state_for_before_world(uuid) from public,anon,authenticated;
create function public.game_state_for(p_user uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s jsonb;begin
 s:=public.game_state_for_before_world(p_user);
 if not exists(select 1 from public.world_scenes where user_id=p_user) then insert into public.world_scenes(user_id) values(p_user) on conflict do nothing;end if;
 return s||jsonb_build_object('world_systems',lifecity_private.world_snapshot(p_user));
end $$;
revoke all on function public.game_state_for(uuid) from public,anon,authenticated;

-- Only the trusted Edge/reference server may load an arbitrary authenticated owner's context.
create function public.world_service_context(p_user uuid,p_key uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s jsonb;fx public.fx_rate_snapshots%rowtype;cur text;eligible numeric;paid numeric;
begin
 s:=public.game_state_for(p_user);select display_currency into cur from public.profiles where id=p_user;
 select * into fx from public.fx_rate_snapshots order by rate_time desc limit 1;
 select greatest(0,coalesce(sum(delta),0)) into eligible from public.coin_transactions where user_id=p_user and created_at>clock_timestamp()-interval '24 hours' and
 (reason in('task:clean_room','task:make_bed','task:workout','study:minutes') or reason in('prayer:fajr:completed','prayer:dhuhr:completed','prayer:asr:completed','prayer:maghrib:completed','prayer:isha:completed') or (delta<0 and reason in('prayer:fajr:correction','prayer:dhuhr:correction','prayer:asr:correction','prayer:maghrib:correction','prayer:isha:correction')) or reason in('approved:wash_dishes','approved:laundry_load','approved:tidy_desk','approved:wash_car','approved:take_out_trash','approved:walk_20_minutes','approved:sleep_7_hours','approved:morning_adhkar','approved:evening_adhkar','approved:wake_on_time','approved:social_media_free_hour','approved:help_family'));
 select coalesce(sum(delta),0) into paid from public.coin_transactions where user_id=p_user and delta>0 and reason='world:business_income' and created_at>clock_timestamp()-interval '24 hours';
 return jsonb_build_object('user_id',p_user,'now',clock_timestamp(),'world',s->'world_systems',
 'balances',jsonb_build_object('MAIN',(select balance::text from public.wallets where user_id=p_user),'YUYI_MAD',(select balance::text from public.yuyi_wallets where user_id=p_user)),
 'fx',case when fx.id is null then null else jsonb_build_object('id',fx.id,'rate_time',fx.rate_time,'mad_rate',fx.rates->>'MAD','display_rate',fx.rates->>cur,'currency',cur) end,
 'legacy_sizes',jsonb_build_object('main',(s->'world'->>'size')::integer,'yuyi',(s->'v6'->'yuyi_world'->>'size')::integer),
 'legacy_versions',jsonb_build_object('main',(s->'world'->>'version')::integer,'yuyi',(s->'v6'->'yuyi_world'->>'version')::integer),
 'legacy',coalesce((select jsonb_agg(v) from(
 select p.id,'main' realm,p.catalog_id,p.rotation,p.x,p.z,case when p.rotation in(90,270) then c.footprint_z else c.footprint_x end width,case when p.rotation in(90,270) then c.footprint_x else c.footprint_z end depth from public.city_placements p join public.catalog_items c on c.id=p.catalog_id where p.user_id=p_user
 union all select p.id,'yuyi' realm,p.catalog_id,p.rotation,p.x,p.z,case when p.rotation in(90,270) then c.footprint_z else c.footprint_x end,case when p.rotation in(90,270) then c.footprint_x else c.footprint_z end from public.yuyi_placements p join public.catalog_items c on c.id=p.catalog_id where p.user_id=p_user)v),'[]'),
 'eligible_income',eligible::text,'income_paid',paid::text,'legitimate_minutes',(select coalesce(sum(credited_minutes),0) from public.study_sessions where user_id=p_user),
 'legitimate_actions',(select count(*) from public.task_completions v join public.task_definitions t on t.id=v.task_id where v.user_id=p_user and t.key in('clean_room','make_bed','workout'))+(select count(*) from public.prayer_logs where user_id=p_user and status='completed')+(select count(*) from public.approved_task_claims v join public.approved_task_catalog t on t.slug=v.slug where v.user_id=p_user and t.cadence<>'automatic'),
 'milestones',coalesce((select jsonb_agg(distinct slug) from public.approved_task_claims where user_id=p_user and slug in('five_tasks_day','study_20_hours_week','all_weekly_goals','commitment_30_days')),'[]'),
 'receipt',(select jsonb_build_object('action',action,'payload',payload,'result',response->'result') from public.command_receipts where user_id=p_user and key=p_key));
end $$;
revoke all on function public.world_service_context(uuid,uuid) from public,anon,authenticated;
grant execute on function public.world_service_context(uuid,uuid) to service_role;

create function public.world_service_commit(p_user uuid,p_action text,p_payload jsonb,p_key uuid,p_transition jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare scene public.world_scenes%rowtype;old_receipt public.command_receipts%rowtype;quote public.world_quotes%rowtype;
 patch jsonb;v jsonb;e public.world_entities%rowtype;component public.world_cost_components%rowtype;wid text;i uuid;wallet_delta numeric;
 main_charge numeric:=0;mad_charge numeric:=0;main_refund numeric:=0;mad_refund numeric:=0;
 eligible numeric;paid numeric;profit numeric;main_charge_id uuid;mad_charge_id uuid;seen uuid[]:='{}';refunds jsonb:='[]';main_ids jsonb:='[]';mad_ids jsonb:='[]';result jsonb;entry_id uuid;
begin
 if p_action not in('world_apply','world_quote','world_commit') or p_key is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>32768 or octet_length(p_transition::text)>2097152 then raise exception 'INVALID_PAYLOAD';end if;
 perform public.ensure_player(p_user);perform 1 from public.profiles where id=p_user for update;
 if not exists(select 1 from public.world_scenes where user_id=p_user) then insert into public.world_scenes(user_id) values(p_user);end if;
 select * into scene from public.world_scenes where user_id=p_user for update;
 select * into old_receipt from public.command_receipts where user_id=p_user and key=p_key;
 if found then if old_receipt.action<>p_action or old_receipt.payload<>p_payload then raise exception 'IDEMPOTENCY_CONFLICT';end if;return jsonb_build_object('state',public.game_state_for(p_user),'result',old_receipt.response->'result');end if;
 if (select count(*) from public.command_receipts where user_id=p_user and created_at>clock_timestamp()-interval '1 minute')>=120 then raise exception 'RATE_LIMIT';end if;
 if (p_transition->>'expected_revision')::bigint is distinct from scene.revision then raise exception 'WORLD_CONFLICT';end if;
 if (p_transition->'legacy_versions'->>'main')::integer is distinct from (select version from public.city_worlds where user_id=p_user) or (p_transition->'legacy_versions'->>'yuyi')::integer is distinct from (select version from public.yuyi_worlds where user_id=p_user) then raise exception 'WORLD_CONFLICT';end if;
 patch:=p_transition->'patch';result:=coalesce(p_transition->'result','{}');
 if p_action='world_quote' then
  v:=p_transition->'quote';if v is null or v='null'::jsonb or v->>'action' is distinct from p_payload->>'operation' or v->'payload' is distinct from p_payload->'request' or (v->>'revision')::bigint<>scene.revision+1 then raise exception 'INVALID_QUOTE';end if;
  insert into public.world_quotes(id,user_id,revision,action,payload,patch,refunds,legacy_versions,fx_id,realm,created_at,expires_at)
   values((v->>'id')::uuid,p_user,scene.revision+1,v->>'action',v->'payload',v->'patch',v->'refunds',v->'legacy_versions',nullif(v->>'fx_id','')::uuid,v->>'realm',clock_timestamp(),clock_timestamp()+interval '2 minutes');
  update public.world_scenes set revision=revision+1,updated_at=clock_timestamp() where user_id=p_user;
 elsif p_action in('world_apply','world_commit') then
  if p_action='world_commit' then
   if p_payload->'confirmed' is distinct from 'true'::jsonb then raise exception 'CONFIRMATION_REQUIRED';end if;
   select * into quote from public.world_quotes where id=(p_payload->>'quote_id')::uuid and user_id=p_user for update;
   if not found or quote.used_at is not null or quote.expires_at<=clock_timestamp() or quote.revision<>scene.revision then raise exception 'QUOTE_EXPIRED';end if;
   if quote.fx_id is not null and not exists(select 1 from public.fx_rate_snapshots where id=quote.fx_id and rate_time>clock_timestamp()-interval '48 hours') then raise exception 'FX_UNAVAILABLE';end if;
   patch:=quote.patch;
  elsif jsonb_array_length(coalesce(patch->'bill','[]'))>0 or jsonb_array_length(coalesce(patch->'destroy_components','[]'))>0 then raise exception 'QUOTE_REQUIRED';end if;
  if jsonb_array_length(coalesce(patch->'upsert','[]'))>2048 or jsonb_array_length(coalesce(patch->'bill','[]'))>256 or jsonb_array_length(coalesce(patch->'destroy_components','[]'))>8192 then raise exception 'WORLD_LIMIT';end if;
  perform 1 from public.wallets where user_id=p_user for update;perform 1 from public.yuyi_wallets where user_id=p_user for update;
  for v in select value from jsonb_array_elements(coalesce(patch->'destroy_components','[]')) loop
   i:=(v#>>'{}')::uuid;if i=any(seen) then raise exception 'DUPLICATE_COMPONENT';end if;seen:=array_append(seen,i);
   select * into component from public.world_cost_components where id=i and user_id=p_user and destroyed_at is null for update;
   if not found then raise exception 'COST_BASIS_UNVERIFIED';end if;
   if component.wallet='MAIN' then main_refund:=main_refund+component.paid/2;main_ids:=main_ids||to_jsonb(i);else mad_refund:=mad_refund+component.paid/2;mad_ids:=mad_ids||to_jsonb(i);end if;
  end loop;
  for v in select value from jsonb_array_elements(coalesce(patch->'bill','[]')) loop
   wallet_delta:=(v->>'paid')::numeric;if wallet_delta<=0 or wallet_delta>1000000000 or wallet_delta<>round(wallet_delta,2) then raise exception 'INVALID_AMOUNT';end if;
   if v->>'wallet'='MAIN' and v->>'currency'='SAR' then main_charge:=main_charge+wallet_delta;elsif v->>'wallet'='YUYI_MAD' and v->>'currency'='MAD' then mad_charge:=mad_charge+wallet_delta;else raise exception 'INVALID_WALLET';end if;
  end loop;
  if main_charge>0 and (select balance from public.wallets where user_id=p_user)+main_refund<main_charge or mad_charge>0 and (select balance from public.yuyi_wallets where user_id=p_user)+mad_refund<mad_charge then raise exception 'INSUFFICIENT_BALANCE';end if;
  if patch?'income' then
   -- Re-read the allowance while holding the SAME owner lock as all business settlements.
 select greatest(0,coalesce(sum(delta),0)) into eligible from public.coin_transactions where user_id=p_user and created_at>clock_timestamp()-interval '24 hours' and
 (reason in('task:clean_room','task:make_bed','task:workout','study:minutes') or reason in('prayer:fajr:completed','prayer:dhuhr:completed','prayer:asr:completed','prayer:maghrib:completed','prayer:isha:completed') or (delta<0 and reason in('prayer:fajr:correction','prayer:dhuhr:correction','prayer:asr:correction','prayer:maghrib:correction','prayer:isha:correction')) or reason in('approved:wash_dishes','approved:laundry_load','approved:tidy_desk','approved:wash_car','approved:take_out_trash','approved:walk_20_minutes','approved:sleep_7_hours','approved:morning_adhkar','approved:evening_adhkar','approved:wake_on_time','approved:social_media_free_hour','approved:help_family'));
 select coalesce(sum(delta),0) into paid from public.coin_transactions where user_id=p_user and delta>0 and reason='world:business_income' and created_at>clock_timestamp()-interval '24 hours';
   profit:=(patch->'income'->>'amount')::numeric;
   if profit<0 or profit<>round(profit,2) or profit>greatest(0,least(eligible*.2,60)-paid) then raise exception 'PASSIVE_CAP';end if;
   if profit>0 then insert into public.coin_transactions(user_id,delta,reason,idempotency_key,actor_id) values(p_user,profit,'world:business_income','world:income:'||p_key,p_user);update public.wallets set balance=balance+profit,updated_at=clock_timestamp() where user_id=p_user;end if;
  end if;
  if main_refund>0 then perform lifecity_private.main_refund(p_user,main_refund,p_key);refunds:=refunds||jsonb_build_object('wallet','MAIN','basis',(main_refund*2)::text,'amount',main_refund::text,'component_ids',main_ids);end if;
  if mad_refund>0 then perform lifecity_private.yuyi_post(p_user,mad_refund,'demolition','50% destroyed world components',p_user,'world:refund:'||p_key);refunds:=refunds||jsonb_build_object('wallet','YUYI_MAD','basis',(mad_refund*2)::text,'amount',mad_refund::text,'component_ids',mad_ids);end if;
  if main_charge>0 then insert into public.coin_transactions(user_id,delta,reason,idempotency_key,actor_id) values(p_user,-main_charge,'world:purchase','world:charge:'||p_key,p_user) returning id into main_charge_id;update public.wallets set balance=balance-main_charge,updated_at=clock_timestamp() where user_id=p_user;end if;
  if mad_charge>0 then mad_charge_id:=lifecity_private.yuyi_post(p_user,-mad_charge,'purchase','World construction and assets',p_user,'world:charge:'||p_key);end if;
  for v in select value from jsonb_array_elements(coalesce(patch->'upsert','[]')) loop
   i:=(v->>'id')::uuid;select * into e from public.world_entities where id=i for update;
   if found then
    if e.user_id<>p_user or e.kind<>v->>'kind' or e.realm<>v->>'realm' then raise exception 'NOT_OWNED';end if;
    if (v->>'version')::integer<>e.version+1 then raise exception 'WORLD_CONFLICT';end if;
    update public.world_entities set version=(v->>'version')::integer,status=v->>'status',data=v,updated_at=clock_timestamp() where id=i and user_id=p_user;
   else
    if (v->>'version')::integer<>1 then raise exception 'WORLD_CONFLICT';end if;
    insert into public.world_entities(id,user_id,realm,kind,version,status,data,created_at) values(i,p_user,v->>'realm',v->>'kind',1,v->>'status',v,(v->>'created_at')::timestamptz);
   end if;
  end loop;
  for v in select value from jsonb_array_elements(coalesce(patch->'retire','[]')) loop
   update public.world_entities set status='retired',version=version+1,data=data||jsonb_build_object('status','retired','version',version+1),updated_at=clock_timestamp() where id=(v#>>'{}')::uuid and user_id=p_user and status<>'retired';if not found then raise exception 'NOT_OWNED';end if;
  end loop;
  for v in select value from jsonb_array_elements(coalesce(patch->'bill','[]')) loop
   if not exists(select 1 from public.world_entities where id=(v->>'entity_id')::uuid and user_id=p_user) then raise exception 'NOT_OWNED';end if;
   insert into public.world_cost_components(id,user_id,entity_id,part,wallet,paid,currency,canonical,fx_id,main_ledger_id,mad_ledger_id)
   values((v->>'id')::uuid,p_user,(v->>'entity_id')::uuid,v->>'part',v->>'wallet',(v->>'paid')::numeric,v->>'currency',(v->>'canonical')::numeric,nullif(v->>'fx_id','')::uuid,case when v->>'wallet'='MAIN' then main_charge_id end,case when v->>'wallet'='YUYI_MAD' then mad_charge_id end);
  end loop;
  update public.world_cost_components set destroyed_at=clock_timestamp() where user_id=p_user and id=any(seen) and destroyed_at is null;
  for v in select value from jsonb_array_elements(coalesce(patch->'events','[]')) loop
   insert into public.world_events(id,user_id,realm,kind,source_key,entity_id,title,metadata) values((v->>'id')::uuid,p_user,v->>'realm',v->>'kind',v->>'source_key',nullif(v->>'entity_id','')::uuid,left(v->>'title',160),coalesce(v->'metadata','{}')) on conflict(user_id,source_key) do nothing;
  end loop;
  if patch?'share' then
   i:=(patch->'share'->>'surprise_id')::uuid;
   if not exists(select 1 from public.world_entities where id=i and user_id=p_user and kind='surprise') then raise exception 'NOT_OWNED';end if;
   if patch->'share'->>'token' is null then update public.world_surprise_shares set enabled=false where surprise_id=i and user_id=p_user;
   else
    if not exists(select 1 from public.world_entities where id=i and data->'reveal'->'consented'='true'::jsonb and data->'reveal'->>'revealed_at' is not null) then raise exception 'REVEAL_CONSENT_REQUIRED';end if;
    insert into public.world_surprise_shares(surprise_id,user_id,token_hash,expires_at) values(i,p_user,encode(sha256(convert_to(patch->'share'->>'token','UTF8')),'hex'),clock_timestamp()+interval '7 days') on conflict(surprise_id) do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at,enabled=true;
   end if;
  end if;
  if exists(select 1 from jsonb_array_elements(coalesce(patch->'upsert','[]')) as history_entry(value) where history_entry.value->>'kind' not in('avatar','car','blueprint','surprise')) or jsonb_array_length(coalesce(patch->'retire','[]'))>0 then
   insert into public.world_history(user_id,command_key,realm,title,delta,metrics) values(p_user,p_key,coalesce(patch->'upsert'->0->>'realm','main'),coalesce(patch->'events'->0->>'title','تغيير في المدينة'),jsonb_build_object('upsert',coalesce((select jsonb_agg(history_entry.value) from jsonb_array_elements(coalesce(patch->'upsert','[]')) as history_entry(value) where history_entry.value->>'kind' not in('avatar','car','blueprint','surprise')),'[]'),'retire',coalesce(patch->'retire','[]'),'legacy',jsonb_build_object('main',coalesce((select jsonb_agg(to_jsonb(legacy_row)) from public.city_placements legacy_row where legacy_row.user_id=p_user),'[]'),'yuyi',coalesce((select jsonb_agg(to_jsonb(legacy_row)) from public.yuyi_placements legacy_row where legacy_row.user_id=p_user),'[]'))),patch->'result'->'metrics');
  end if;
  if patch->'result'?'seen_event_id' then update public.world_events set seen=true where user_id=p_user and created_at<=(select created_at from public.world_events where user_id=p_user and id=(patch->'result'->>'seen_event_id')::uuid);end if;
  if patch->'result'->'initialized'='true'::jsonb then if scene.initialized then raise exception 'WORLD_ALREADY_INITIALIZED';end if;scene.initialized:=true;end if;
  update public.world_scenes set revision=revision+case when patch->'result'?'seen_event_id' then 0 else 1 end,initialized=scene.initialized,settings=coalesce(patch->'settings',settings),updated_at=clock_timestamp() where user_id=p_user;
  if p_action='world_commit' then update public.world_quotes set used_at=clock_timestamp() where id=quote.id;end if;
  insert into public.world_settlements(user_id,command_key,action,bill,refunds,destroyed_components) values(p_user,p_key,p_action,coalesce(patch->'bill','[]'),refunds,coalesce(patch->'destroy_components','[]'));
  result:=result||jsonb_build_object('refunds',refunds);
 end if;
 insert into public.command_receipts(user_id,key,action,payload,response) values(p_user,p_key,p_action,p_payload,jsonb_build_object('result',result));
 insert into public.sync_events(user_id,action,key) values(p_user,p_action,p_key);
 return jsonb_build_object('state',public.game_state_for(p_user),'result',result);
end $$;
revoke all on function public.world_service_commit(uuid,text,jsonb,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.world_service_commit(uuid,text,jsonb,uuid,jsonb) to service_role;
create function public.world_read_history(p_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid:=auth.uid();at_time timestamptz;v jsonb;r record;objects jsonb:='{}';legacy jsonb:='{}';i text;begin
 if u is null then raise exception 'AUTH_REQUIRED';end if;select created_at into at_time from public.world_history where id=p_id and user_id=u;if not found then raise exception 'NOT_FOUND';end if;
 for r in select delta from public.world_history where user_id=u and created_at<=at_time order by created_at,id loop
  if r.delta?'legacy' then legacy:=r.delta->'legacy';end if;
  for v in select value from jsonb_array_elements(r.delta->'upsert') loop objects:=jsonb_set(objects,array[v->>'id'],v,true);end loop;
  for v in select value from jsonb_array_elements(r.delta->'retire') loop i:=v#>>'{}';objects:=objects-i;end loop;
 end loop;
 return jsonb_build_object('entities',coalesce((select jsonb_agg(value) from jsonb_each(objects)),'[]'),'placements',coalesce(legacy->'main','[]'),'yuyi_placements',coalesce(legacy->'yuyi','[]'));
end $$;
revoke all on function public.world_read_history(uuid) from public,anon;
grant execute on function public.world_read_history(uuid) to authenticated;
create function lifecity_private.world_segment_hits(ax numeric,az numeric,bx numeric,bz numeric,rx numeric,rz numeric,rw numeric,rd numeric,pad numeric) returns boolean language plpgsql immutable set search_path=public,pg_temp as $$
declare dx numeric:=bx-ax;dz numeric:=bz-az;ps numeric[];qs numeric[];lo numeric:=0;hi numeric:=1;t numeric;j integer;begin
 ps:=array[-dx,dx,-dz,dz];qs:=array[ax-rx+pad,rx+rw+pad-ax,az-rz+pad,rz+rd+pad-az];
 for j in 1..4 loop if abs(ps[j])<.00000001 then if qs[j]<0 then return false;end if;else t:=qs[j]/ps[j];if ps[j]<0 then lo:=greatest(lo,t);else hi:=least(hi,t);end if;if lo>hi then return false;end if;end if;end loop;return true;
end $$;
-- Original store placements obey the same advanced footprints and sampled ground.
create function lifecity_private.guard_legacy_world_placement() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare r text;w numeric;d numeric;ew numeric;ed numeric;item public.catalog_items%rowtype;e record;x numeric;z numeric;h numeric;lo numeric:=100000;hi numeric:=-100000;heights jsonb;side integer;
begin
 if not exists(select 1 from public.world_scenes where user_id=new.user_id and initialized) then return new;end if;
 r:=case when tg_table_name='yuyi_placements' then 'yuyi' else 'main' end;select * into strict item from public.catalog_items where id=new.catalog_id;
 w:=case when new.rotation in(90,270) then item.footprint_z else item.footprint_x end;d:=case when new.rotation in(90,270) then item.footprint_x else item.footprint_z end;
 for e in select data,kind from public.world_entities where user_id=new.user_id and realm=r and status='active' and kind in('building','decoration','node') loop
  ew:=case when e.data->>'rotation'='90' then (e.data->>'depth')::numeric else (e.data->>'width')::numeric end;
  ed:=case when e.data->>'rotation'='90' then (e.data->>'width')::numeric else (e.data->>'depth')::numeric end;
  if e.kind in('building','decoration') and new.x<(e.data->>'x')::numeric+ew+.1 and new.x+w>(e.data->>'x')::numeric-.1 and new.z<(e.data->>'z')::numeric+ed+.1 and new.z+d>(e.data->>'z')::numeric-.1 then raise exception 'WORLD_COLLISION';end if;
  if e.kind='node' and (e.data->>'y')::numeric>=0 and (e.data->>'x')::numeric between new.x-.4 and new.x+w+.4 and (e.data->>'z')::numeric between new.z-.4 and new.z+d+.4 then raise exception 'WORLD_COLLISION';end if;
 end loop;
 for e in select edge.data,a.data start_node,b.data end_node from public.world_entities edge join public.world_entities a on a.id=(edge.data->>'from')::uuid and a.user_id=edge.user_id join public.world_entities b on b.id=(edge.data->>'to')::uuid and b.user_id=edge.user_id where edge.user_id=new.user_id and edge.realm=r and edge.kind='edge' and edge.status='active' and (edge.data->>'depth')::numeric>=0 loop
  ew:=case when e.data->>'network'='road' then (e.data->>'lanes')::numeric*(case when e.data->'directed'='true'::jsonb then 1.6 else 3 end)/2 else .2 end;
  if lifecity_private.world_segment_hits((e.start_node->>'x')::numeric,(e.start_node->>'z')::numeric,(e.end_node->>'x')::numeric,(e.end_node->>'z')::numeric,new.x,new.z,w,d,ew) then raise exception 'WORLD_COLLISION';end if;
 end loop;
 select data->'heights_cm',(data->>'side')::integer into heights,side from public.world_entities where user_id=new.user_id and realm=r and kind='terrain' and status='active';
 if heights is not null then for x in select generate_series(new.x,new.x+w,1) loop for z in select generate_series(new.z,new.z+d,1) loop
  h:=(heights->>(z::integer*(side+1)+x::integer))::numeric;lo:=least(lo,h);hi:=greatest(hi,h);
 end loop;end loop;if item.category not in('nature','water') and (hi-lo>12 or lo< -5) then raise exception 'FOUNDATION_NOT_FLAT';end if;end if;
 return new;
end $$;
create trigger original_advanced_collision before insert or update of x,z,rotation on public.city_placements for each row execute function lifecity_private.guard_legacy_world_placement();
create trigger yuyi_advanced_collision before insert or update of x,z,rotation on public.yuyi_placements for each row execute function lifecity_private.guard_legacy_world_placement();

-- Keep the original paid +4 land expansion working. Subtract existing titles so
-- financed parcels and their obligations are retained without overlapping titles.
create function lifecity_private.extend_legacy_world_title() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare r text;rectangles jsonb;next_rectangles jsonb;piece jsonb;existing record;ox numeric;oz numeric;ow numeric;od numeric;px numeric;pz numeric;pw numeric;pd numeric;ix numeric;iz numeric;ex numeric;ez numeric;entity jsonb;added jsonb:='[]';i uuid;
begin
 if new.size<=old.size or not exists(select 1 from public.world_scenes where user_id=new.user_id and initialized) then return new;end if;
 r:=case when tg_table_name='yuyi_worlds' then 'yuyi' else 'main' end;
 rectangles:=jsonb_build_array(jsonb_build_object('x',old.size,'z',0,'width',new.size-old.size,'depth',new.size),jsonb_build_object('x',0,'z',old.size,'width',old.size,'depth',new.size-old.size));
 for existing in select data from public.world_entities where user_id=new.user_id and realm=r and kind='parcel' and status='active' loop
  select min((v->>'x')::numeric),min((v->>'z')::numeric),max((v->>'x')::numeric)-min((v->>'x')::numeric),max((v->>'z')::numeric)-min((v->>'z')::numeric) into ox,oz,ow,od from jsonb_array_elements(existing.data->'polygon') v;
  next_rectangles:='[]';for piece in select value from jsonb_array_elements(rectangles) loop
   px:=(piece->>'x')::numeric;pz:=(piece->>'z')::numeric;pw:=(piece->>'width')::numeric;pd:=(piece->>'depth')::numeric;ix:=greatest(px,ox);iz:=greatest(pz,oz);ex:=least(px+pw,ox+ow);ez:=least(pz+pd,oz+od);
   if ix>=ex or iz>=ez then next_rectangles:=next_rectangles||jsonb_build_array(piece);else
    if ix>px then next_rectangles:=next_rectangles||jsonb_build_array(jsonb_build_object('x',px,'z',pz,'width',ix-px,'depth',pd));end if;
    if ex<px+pw then next_rectangles:=next_rectangles||jsonb_build_array(jsonb_build_object('x',ex,'z',pz,'width',px+pw-ex,'depth',pd));end if;
    if iz>pz then next_rectangles:=next_rectangles||jsonb_build_array(jsonb_build_object('x',ix,'z',pz,'width',ex-ix,'depth',iz-pz));end if;
    if ez<pz+pd then next_rectangles:=next_rectangles||jsonb_build_array(jsonb_build_object('x',ix,'z',ez,'width',ex-ix,'depth',pz+pd-ez));end if;
   end if;
  end loop;rectangles:=next_rectangles;
 end loop;
 for piece in select value from jsonb_array_elements(rectangles) loop
  px:=(piece->>'x')::numeric;pz:=(piece->>'z')::numeric;pw:=(piece->>'width')::numeric;pd:=(piece->>'depth')::numeric;i:=gen_random_uuid();
  entity:=jsonb_build_object('id',i,'realm',r,'kind','parcel','name','توسعة الأرض الأصلية','version',1,'status','active','created_at',clock_timestamp(),'polygon',jsonb_build_array(jsonb_build_object('x',px,'z',pz),jsonb_build_object('x',px+pw,'z',pz),jsonb_build_object('x',px+pw,'z',pz+pd),jsonb_build_object('x',px,'z',pz+pd)),'initial',true,'zone','mixed','title_history',jsonb_build_array(jsonb_build_object('action','legacy_paid_expansion','at',clock_timestamp(),'parents','[]'::jsonb)),'factors',jsonb_build_object('base_per_m2','0.0000','waterfront',1,'road_access',1,'capacity',1),'financing',null);
  insert into public.world_entities(id,user_id,realm,kind,version,status,data,created_at) values(i,new.user_id,r,'parcel',1,'active',entity,clock_timestamp());added:=added||jsonb_build_array(entity);
 end loop;
 update public.world_scenes set revision=revision+1,updated_at=clock_timestamp() where user_id=new.user_id;
 insert into public.world_history(user_id,command_key,realm,title,delta) values(new.user_id,gen_random_uuid(),r,'توسعة أرض محفوظة',jsonb_build_object('upsert',added,'retire','[]'::jsonb));
 return new;
end $$;
create trigger original_advanced_land after update of size on public.city_worlds for each row execute function lifecity_private.extend_legacy_world_title();
create trigger yuyi_advanced_land after update of size on public.yuyi_worlds for each row execute function lifecity_private.extend_legacy_world_title();

-- Existing store placement edits also become real history checkpoints after opt-in initialization.
create function lifecity_private.record_legacy_world_edit() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid;r text;begin
 u:=case when tg_op='DELETE' then old.user_id else new.user_id end;r:=case when tg_table_name='yuyi_placements' then 'yuyi' else 'main' end;
 if exists(select 1 from public.world_scenes where user_id=u and initialized) and exists(select 1 from auth.users where id=u) then
  insert into public.world_history(user_id,command_key,realm,title,delta) values(u,gen_random_uuid(),r,'تعديل عنصر في المدينة',jsonb_build_object('upsert','[]'::jsonb,'retire','[]'::jsonb,'legacy',jsonb_build_object('main',coalesce((select jsonb_agg(to_jsonb(legacy_row)) from public.city_placements legacy_row where legacy_row.user_id=u),'[]'),'yuyi',coalesce((select jsonb_agg(to_jsonb(legacy_row)) from public.yuyi_placements legacy_row where legacy_row.user_id=u),'[]'))));
 end if;return null;
end $$;
create trigger city_advanced_history after insert or update or delete on public.city_placements for each row execute function lifecity_private.record_legacy_world_edit();
create trigger yuyi_advanced_history after insert or update or delete on public.yuyi_placements for each row execute function lifecity_private.record_legacy_world_edit();
-- Capability-only projection: never profile, wallet, source receipts, hidden scenes or events.
create function public.world_surprise_visit(p_token text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v jsonb;begin
 if p_token is null or p_token!~'^[a-f0-9]{64}$' then raise exception 'SHARE_NOT_FOUND';end if;
 select jsonb_build_object('name',e.data->'name','note',e.data->'note','props',e.data->'props','revealed_at',e.data->'reveal'->'revealed_at','expires_at',s.expires_at) into v from public.world_surprise_shares s join public.world_entities e on e.id=s.surprise_id and e.user_id=s.user_id where s.token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and s.enabled and s.expires_at>clock_timestamp() and e.status='active' and e.data->'reveal'->>'revealed_at' is not null and e.data->'reveal'->'consented'='true'::jsonb and e.data->'share_enabled'='true'::jsonb;
 if v is null then raise exception 'SHARE_NOT_FOUND';end if;return v;
end $$;
revoke all on function public.world_surprise_visit(text) from public;
grant execute on function public.world_surprise_visit(text) to anon,authenticated;
revoke all on all functions in schema lifecity_private from public,anon,authenticated;
commit;
