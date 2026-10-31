-- Approved V5 catalog and immutable award engine. No historic rewards are replayed.
begin;
create table public.approved_task_catalog(
 slug text primary key,version integer not null default 1,title_ar text not null,title_en text not null,
 reward integer not null check(reward>0),cadence text not null check(cadence in('daily','weekly','load','automatic')),
 section text not null
);
insert into public.approved_task_catalog(slug,title_ar,title_en,reward,cadence,section) values
 ('wash_dishes','غسل الصحون','Wash dishes',20,'daily','home'),
 ('laundry_load','غسيل الملابس ونشرها','Wash and hang a laundry load',30,'load','home'),
 ('tidy_desk','ترتيب المكتب','Tidy desk',15,'daily','home'),
 ('wash_car','تنظيف السيارة','Clean car',50,'weekly','home'),
 ('take_out_trash','إخراج القمامة','Take out trash',10,'daily','home'),
 ('walk_20_minutes','المشي 20 دقيقة','Walk 20 minutes',20,'daily','health'),
 ('sleep_7_hours','النوم 7 ساعات أو أكثر','Sleep 7+ hours',20,'daily','health'),
 ('morning_adhkar','أذكار الصباح','Morning adhkar',10,'daily','adhkar'),
 ('evening_adhkar','أذكار المساء','Evening adhkar',10,'daily','adhkar'),
 ('wake_on_time','الاستيقاظ في الموعد المحدد','Wake up on time',20,'daily','discipline'),
 ('social_media_free_hour','ساعة بدون تطبيقات التواصل','60 minutes without social media',20,'daily','discipline'),
 ('help_family','مساعدة أحد أفراد العائلة','Help a family member',25,'daily','home'),
 ('five_tasks_day','إنجاز 5 مهام في يوم واحد','Complete 5 tasks in a day',30,'automatic','daily'),
 ('study_20_hours_week','إكمال 20 ساعة مذاكرة خلال أسبوع','Study 20 hours in one week',150,'automatic','weekly'),
 ('all_weekly_goals','إكمال جميع أهداف الأسبوع','Complete all weekly goals',200,'automatic','weekly'),
 ('commitment_30_days','تحقيق 30 يومًا من الالتزام','Reach 30 consecutive days of commitment',500,'automatic','streak');
alter table public.approved_task_catalog enable row level security;
revoke all on public.approved_task_catalog from public,anon,authenticated;
grant select on public.approved_task_catalog to authenticated;
create policy catalog_read on public.approved_task_catalog for select to authenticated using(true);

create table public.task_calendars(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 timezone text not null,week_start integer not null default 0 check(week_start between 0 and 6),
 effective_at timestamptz not null,previous_ends_at timestamptz,
 created_at timestamptz not null default clock_timestamp(),unique(user_id,effective_at),
 check(previous_ends_at is null or previous_ends_at<effective_at)
);
create unique index task_calendar_initial on public.task_calendars(user_id) where previous_ends_at is null;
create index task_calendars_owner on public.task_calendars(user_id,effective_at desc);
create table public.approved_task_claims(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 slug text not null references public.approved_task_catalog(slug),version integer not null,
 claim_key text not null,local_day date not null,local_week date not null,calendar_id uuid not null references public.task_calendars(id),
 reward integer not null,evidence jsonb not null,ledger_id uuid not null references public.coin_transactions(id),
 request_id uuid not null,fx_id uuid references public.fx_rate_snapshots(id),fx_display jsonb not null,created_at timestamptz not null,
 unique(user_id,slug,claim_key)
);
create index approved_claims_owner_day on public.approved_task_claims(user_id,local_day,slug);
create table public.task_base_events(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 slug text not null,source_id text not null,local_day date not null,local_week date not null,
 calendar_id uuid not null references public.task_calendars(id),created_at timestamptz not null,
 unique(user_id,source_id)
);
create index task_base_events_owner_period on public.task_base_events(user_id,local_week,local_day);
create table public.task_study_minutes(
 user_id uuid not null references auth.users(id) on delete cascade,session_id uuid not null references public.study_sessions(id) on delete cascade,
 ordinal integer not null check(ordinal>0),occurred_at timestamptz not null,local_day date not null,local_week date not null,
 calendar_id uuid not null references public.task_calendars(id),primary key(session_id,ordinal)
);
create index task_study_minutes_owner_period on public.task_study_minutes(user_id,local_week,local_day);
create table public.task_study_segments(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid not null references public.study_sessions(id) on delete cascade,
 starts_at timestamptz not null,ends_at timestamptz not null,local_day date not null,local_week date not null,
 calendar_id uuid not null references public.task_calendars(id),unique(session_id,starts_at),check(ends_at>starts_at and ends_at-starts_at<=interval '90 seconds')
);
create index task_study_segments_owner_period on public.task_study_segments(user_id,local_week,local_day);
create table public.task_weekly_plans(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 local_week date not null,calendar_id uuid not null references public.task_calendars(id),goals jsonb not null,
 created_at timestamptz not null,unique(user_id,local_week),check(jsonb_array_length(goals) between 3 and 12)
);
create table public.task_wake_targets(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 local_day date not null,target_at timestamptz not null,calendar_id uuid not null references public.task_calendars(id),
 created_at timestamptz not null,grace_minutes integer not null default 10 check(grace_minutes=10),unique(user_id,local_day)
);
create table public.task_commitment_days(
 user_id uuid not null references auth.users(id) on delete cascade,local_day date not null,
 calendar_id uuid not null references public.task_calendars(id),streak_id uuid not null,streak_day integer not null check(streak_day>0),
 created_at timestamptz not null,primary key(user_id,local_day)
);
create table public.task_rule_settings(id boolean primary key default true check(id),laundry_daily_limit integer not null default 3 check(laundry_daily_limit between 1 and 10));
insert into public.task_rule_settings default values;
create table public.task_rule_audit(id uuid primary key default gen_random_uuid(),old_value integer not null,new_value integer not null,changed_at timestamptz not null default clock_timestamp(),actor text not null);
alter table public.task_rule_settings enable row level security;
alter table public.task_rule_audit enable row level security;
revoke all on public.task_rule_settings,public.task_rule_audit from public,anon,authenticated;
grant select on public.task_rule_settings to authenticated;
create policy rules_read on public.task_rule_settings for select to authenticated using(true);
create function lifecity_private.audit_task_rules() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 insert into public.task_rule_audit(old_value,new_value,actor) values(old.laundry_daily_limit,new.laundry_daily_limit,session_user);
 return new;
end $$;
create trigger task_rules_audited after update on public.task_rule_settings for each row execute function lifecity_private.audit_task_rules();
create trigger task_rule_audit_immutable before update or delete on public.task_rule_audit for each row execute function public.ledger_immutable();
do $$ declare t text;begin
 foreach t in array array['task_calendars','approved_task_claims','task_base_events','task_study_minutes','task_study_segments','task_weekly_plans','task_wake_targets','task_commitment_days'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy owner_read on public.%I for select to authenticated using(user_id=(select auth.uid()))',t);
  execute format('create trigger immutable before update or delete on public.%I for each row execute function public.ledger_immutable()',t);
 end loop;
end $$;

create function lifecity_private.task_now() returns timestamptz language sql volatile set search_path=public,pg_temp as $$select clock_timestamp()$$;
create function lifecity_private.task_context(p_user uuid,p_at timestamptz) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.task_calendars%rowtype;d date;w date;paused boolean;
begin
 select * into c from public.task_calendars where user_id=p_user and effective_at<=p_at order by effective_at desc limit 1;
 if not found then return null;end if;
 d:=(p_at at time zone c.timezone)::date;w:=d-((extract(dow from d)::integer-c.week_start+7)%7);
 paused:=exists(select 1 from public.task_calendars where user_id=p_user and previous_ends_at<=p_at and effective_at>p_at);
 return jsonb_build_object('calendar_id',c.id,'timezone',c.timezone,'week_start',c.week_start,'day',d,'week',w,'paused',paused,
  'day_ends_at',(d+1)::timestamp at time zone c.timezone,'week_ends_at',(w+7)::timestamp at time zone c.timezone);
end $$;
alter function public.ensure_player(uuid) rename to ensure_player_before_tasks;
revoke all on function public.ensure_player_before_tasks(uuid) from public,anon,authenticated;
create function public.ensure_player(p_user uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform public.ensure_player_before_tasks(p_user);
 perform 1 from public.profiles where id=p_user for update;
 if not exists(select 1 from public.task_calendars where user_id=p_user) then
  insert into public.task_calendars(user_id,timezone,effective_at) select p_user,timezone,lifecity_private.task_now() from public.profiles where id=p_user;
 end if;
end $$;
revoke all on function public.ensure_player(uuid) from public,anon,authenticated;
do $$declare u uuid;begin for u in select id from public.profiles loop perform public.ensure_player(u);end loop;end $$;

create function lifecity_private.task_post(p_user uuid,p_slug text,p_claim_key text,p_day date,p_week date,p_calendar uuid,p_evidence jsonb,p_key uuid) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.approved_task_catalog%rowtype;i uuid:=gen_random_uuid();l uuid;fx public.fx_rate_snapshots%rowtype;cur text;snap jsonb;
begin
 if exists(select 1 from public.approved_task_claims where user_id=p_user and slug=p_slug and claim_key=p_claim_key) then return null;end if;
 select * into strict c from public.approved_task_catalog where slug=p_slug;
 select display_currency into cur from public.profiles where id=p_user;
 select * into fx from public.fx_rate_snapshots order by rate_time desc limit 1;
 snap:=case when fx.id is null or not(fx.rates?cur) then jsonb_build_object('currency','SAR','rate','1','source','Canonical SAR','rate_time',null)
 else jsonb_build_object('currency',cur,'rate',fx.rates->>cur,'source',fx.provider,'rate_time',fx.rate_time,'stale',fx.rate_time<clock_timestamp()-interval '48 hours') end;
 perform public.apply_coins(p_user,c.reward,'approved:'||p_slug,'approved:'||i::text,p_user,c.reward);
 select id into strict l from public.coin_transactions where user_id=p_user and idempotency_key='approved:'||i::text;
 insert into public.approved_task_claims(id,user_id,slug,version,claim_key,local_day,local_week,calendar_id,reward,evidence,ledger_id,request_id,fx_id,fx_display,created_at)
 values(i,p_user,p_slug,c.version,p_claim_key,p_day,p_week,p_calendar,c.reward,p_evidence,l,p_key,fx.id,snap,lifecity_private.task_now());
 return i;
end $$;

create function lifecity_private.goal_progress(p_user uuid,p_week date,p_since timestamptz,p_slug text) returns integer
language sql stable security definer set search_path=public,pg_temp as $$
 select case when p_slug='study_minutes' then (select floor(coalesce(sum(extract(epoch from ends_at-greatest(starts_at,p_since))),0)/60)::integer from public.task_study_segments where user_id=p_user and local_week=p_week and ends_at>=p_since)
 else (select count(*)::integer from public.task_base_events where user_id=p_user and local_week=p_week and created_at>=p_since and slug=p_slug) end
$$;
create function lifecity_private.task_distinct(p_user uuid,p_day date) returns integer
language sql stable security definer set search_path=public,pg_temp as $$
 select count(distinct e.slug)::integer from public.task_base_events e where e.user_id=p_user and e.local_day=p_day
 and (e.slug not like 'prayer_%' or exists(select 1 from public.prayer_logs p where p.user_id=p_user and p.day=p_day and p.prayer=substring(e.slug from 8) and p.status='completed'))
$$;
create function lifecity_private.task_reconcile(p_user uuid,p_key uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare c jsonb:=lifecity_private.task_context(p_user,lifecity_private.task_now());r record;last public.task_commitment_days%rowtype;
 plan public.task_weekly_plans%rowtype;g jsonb;ok boolean;sid uuid;sd integer;
begin
 if c is null or (c->>'paused')::boolean then return;end if;
 for r in select d,calendar_id,min(w) w from (
  select local_day d,calendar_id,local_week w from public.task_base_events where user_id=p_user and local_day between (c->>'day')::date-1 and (c->>'day')::date
  union select local_day,calendar_id,local_week from public.task_study_segments where user_id=p_user and local_day between (c->>'day')::date-1 and (c->>'day')::date
 )q group by d,calendar_id order by d loop
  if lifecity_private.task_distinct(p_user,r.d)>=5 then
   perform lifecity_private.task_post(p_user,'five_tasks_day','d:'||r.d,r.d,r.w,r.calendar_id,'{"type":"derived_distinct_base_tasks"}',p_key);
  end if;
  if exists(select 1 from public.task_commitment_days where user_id=p_user and local_day=r.d) then continue;end if;
  if exists(select 1 from public.task_commitment_days where user_id=p_user and local_day>r.d) then continue;end if;
  if not exists(select 1 from public.task_base_events where user_id=p_user and local_day=r.d and slug<>'study_completed')
    and (select coalesce(sum(extract(epoch from ends_at-starts_at)),0) from public.task_study_segments where user_id=p_user and local_day=r.d)<1200 then continue;end if;
  select * into last from public.task_commitment_days where user_id=p_user order by local_day desc limit 1;
  if found and last.local_day=r.d-1 then sid:=last.streak_id;sd:=last.streak_day+1;else sid:=gen_random_uuid();sd:=1;end if;
  insert into public.task_commitment_days(user_id,local_day,calendar_id,streak_id,streak_day,created_at) values(p_user,r.d,r.calendar_id,sid,sd,lifecity_private.task_now());
  if sd%30=0 then perform lifecity_private.task_post(p_user,'commitment_30_days','s:'||sid::text||':'||(sd/30),r.d,r.w,r.calendar_id,jsonb_build_object('type','commitment','streak_id',sid,'day',sd),p_key);end if;
 end loop;
 for r in select distinct local_week w,calendar_id from public.task_study_segments where user_id=p_user and local_week between (c->>'week')::date-7 and (c->>'week')::date loop
  if(select coalesce(sum(extract(epoch from ends_at-starts_at)),0) from public.task_study_segments where user_id=p_user and local_week=r.w)>=72000 then
   perform lifecity_private.task_post(p_user,'study_20_hours_week','w:'||r.w,(c->>'day')::date,r.w,r.calendar_id,'{"type":"verified_study_minutes","minutes":1200}',p_key);
  end if;
 end loop;
 select * into plan from public.task_weekly_plans where user_id=p_user and local_week=(c->>'week')::date;
 if found then
  ok:=true;
  for g in select value from jsonb_array_elements(plan.goals) loop
   if lifecity_private.goal_progress(p_user,plan.local_week,plan.created_at,g->>'slug')<(g->>'target')::integer then ok:=false;exit;end if;
  end loop;
  if ok then perform lifecity_private.task_post(p_user,'all_weekly_goals','w:'||plan.local_week,(c->>'day')::date,plan.local_week,plan.calendar_id,jsonb_build_object('type','immutable_weekly_plan','plan_id',plan.id),p_key);end if;
 end if;
end $$;

alter function public.tick_study(uuid,uuid,uuid,timestamptz) rename to tick_study_before_tasks;
revoke all on function public.tick_study_before_tasks(uuid,uuid,uuid,timestamptz) from public,anon,authenticated;
create function public.tick_study(p_user uuid,p_session uuid,p_key uuid,p_now timestamptz) returns public.study_sessions
language plpgsql security definer set search_path=public,pg_temp as $$
declare old public.study_sessions%rowtype;s public.study_sessions%rowtype;k integer;at_time timestamptz;c jsonb;cursor_at timestamptz;end_at timestamptz;part_end timestamptz;enrolled timestamptz;
begin
 select * into old from public.study_sessions where id=p_session and user_id=p_user for update;
 s:=public.tick_study_before_tasks(p_user,p_session,p_key,p_now);
 select min(effective_at) into enrolled from public.task_calendars where user_id=p_user;
 cursor_at:=greatest(old.last_tick_at,enrolled);
 end_at:=old.last_tick_at+make_interval(secs=>greatest(0,s.active_seconds-old.active_seconds));
 while cursor_at<end_at loop
  c:=lifecity_private.task_context(p_user,cursor_at);
  part_end:=least(end_at,(c->>'day_ends_at')::timestamptz);
  if c is not null and not(c->>'paused')::boolean then
   insert into public.task_study_segments(user_id,session_id,starts_at,ends_at,local_day,local_week,calendar_id)
    values(p_user,p_session,cursor_at,part_end,(c->>'day')::date,(c->>'week')::date,(c->>'calendar_id')::uuid) on conflict do nothing;
  end if;
  cursor_at:=part_end;
 end loop;
 for k in old.credited_minutes+1..s.credited_minutes loop
  at_time:=old.last_tick_at+make_interval(secs=>k*60-old.active_seconds);
  c:=lifecity_private.task_context(p_user,at_time);
  if c is not null and not(c->>'paused')::boolean then
   insert into public.task_study_minutes(user_id,session_id,ordinal,occurred_at,local_day,local_week,calendar_id)
    values(p_user,p_session,k,at_time,(c->>'day')::date,(c->>'week')::date,(c->>'calendar_id')::uuid) on conflict do nothing;
  end if;
 end loop;
 return s;
end $$;
revoke all on function public.tick_study(uuid,uuid,uuid,timestamptz) from public,anon,authenticated;

alter function public.city_partner_command(uuid,text,jsonb,uuid) rename to city_partner_command_before_tasks;
revoke all on function public.city_partner_command_before_tasks(uuid,text,jsonb,uuid) from public,anon,authenticated;
create function public.city_partner_command(p_uid uuid,p_action text,p_payload jsonb,p_key uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
<<task_command>>
declare c jsonb:=lifecity_private.task_context(p_uid,lifecity_private.task_now());cat public.approved_task_catalog%rowtype;
 d date:=(c->>'day')::date;w date:=(c->>'week')::date;cal uuid:=(c->>'calendar_id')::uuid;slug text:=p_payload->>'slug';
 e jsonb:=coalesce(p_payload->'evidence','{}');i uuid;k text;n integer;b timestamptz;z timestamptz;t public.task_wake_targets%rowtype;
 g jsonb;goals jsonb;seen text[]:='{}';target integer;newtz text;newdow integer;ends timestamptz;starts timestamptz;
begin
 if p_action not in('approved_task_claim','weekly_plan_start','wake_target_set','task_calendar_set','task_reconcile') then
  return public.city_partner_command_before_tasks(p_uid,p_action,p_payload,p_key);
 end if;
 if (c->>'paused')::boolean then raise exception 'TASK_CALENDAR_TRANSITION';end if;
 if p_action='approved_task_claim' then
  select * into cat from public.approved_task_catalog where approved_task_catalog.slug=task_command.slug;
  if not found or cat.cadence='automatic' then raise exception 'TASK_NOT_CLAIMABLE';end if;
  if p_payload->'self_reported' is distinct from 'true'::jsonb or jsonb_typeof(e)<>'object' then raise exception 'SELF_REPORT_REQUIRED';end if;
  k:=case when cat.cadence='weekly' then 'w:'||w else 'd:'||d end;
  if slug='laundry_load' then
   i:=public.payload_uuid(e,'load_id');k:='load:'||i::text;
   if exists(select 1 from public.approved_task_claims where user_id=p_uid and approved_task_claims.slug=task_command.slug and claim_key=k) then raise exception 'ALREADY_CLAIMED';end if;
   if(select count(*) from public.approved_task_claims where user_id=p_uid and approved_task_claims.slug='laundry_load' and local_day=d)>=(select laundry_daily_limit from public.task_rule_settings) then raise exception 'LAUNDRY_LIMIT';end if;
  elsif slug in('walk_20_minutes','social_media_free_hour') then
   n:=public.payload_integer(e,'minutes',case when slug='walk_20_minutes' then 20 else 60 end,1440);
  elsif slug='sleep_7_hours' then
   b:=(e->>'bedtime')::timestamptz;z:=(e->>'wake_time')::timestamptz;
   if b is null or z is null or z-b<interval '7 hours' or z-b>interval '16 hours' or z>lifecity_private.task_now() or (z at time zone(c->>'timezone'))::date<>d then raise exception 'INVALID_SLEEP_INTERVAL';end if;
   if exists(select 1 from public.approved_task_claims where user_id=p_uid and approved_task_claims.slug='sleep_7_hours' and (e->>'bedtime')::timestamptz<(evidence->>'wake_time')::timestamptz and (e->>'wake_time')::timestamptz>(evidence->>'bedtime')::timestamptz) then raise exception 'SLEEP_OVERLAP';end if;
  elsif slug='wake_on_time' then
   select * into t from public.task_wake_targets where user_id=p_uid and local_day=d;
   z:=(e->>'wake_time')::timestamptz;
   if not found or z is null or z>lifecity_private.task_now() or z>t.target_at+interval '10 minutes' or (z at time zone(c->>'timezone'))::date<>d then raise exception 'WAKE_TARGET_NOT_MET';end if;
  end if;
  i:=lifecity_private.task_post(p_uid,slug,k,d,w,cal,e||'{"type":"self_reported"}'::jsonb,p_key);
  if i is null then raise exception 'ALREADY_CLAIMED';end if;
  insert into public.task_base_events(user_id,slug,source_id,local_day,local_week,calendar_id,created_at) values(p_uid,slug,'approved:'||i,d,w,cal,lifecity_private.task_now());
  return jsonb_build_object('claim_id',i,'reward',cat.reward,'wallet','MAIN','verification','self_reported');
 elsif p_action='weekly_plan_start' then
  goals:=p_payload->'goals';
  if jsonb_typeof(goals) is distinct from 'array' or jsonb_array_length(goals) not between 3 and 12 then raise exception 'THREE_GOALS_REQUIRED';end if;
  for g in select value from jsonb_array_elements(goals) loop
   slug:=g->>'slug';target:=public.payload_integer(g,'target',case when slug='study_minutes' then 20 else 1 end,case when slug='study_minutes' then 1200 else 7 end);
   if slug is null or slug=any(seen) or (slug not in('clean_room','make_bed','workout','study_minutes') and not exists(select 1 from public.approved_task_catalog where approved_task_catalog.slug=task_command.slug and cadence<>'automatic')) then raise exception 'INVALID_WEEKLY_GOAL';end if;
   if slug='wash_car' and target<>1 then raise exception 'INVALID_WEEKLY_GOAL';end if;
   if lifecity_private.goal_progress(p_uid,w,'-infinity',slug)>=target then raise exception 'GOAL_ALREADY_ACCOMPLISHED';end if;
   seen:=array_append(seen,slug);
  end loop;
  if exists(select 1 from public.task_weekly_plans where user_id=p_uid and local_week=w) then raise exception 'PLAN_LOCKED';end if;
  insert into public.task_weekly_plans(user_id,local_week,calendar_id,goals,created_at) values(p_uid,w,cal,goals,lifecity_private.task_now()) returning id into i;
  return jsonb_build_object('plan_id',i,'immutable',true);
 elsif p_action='wake_target_set' then
  d:=(p_payload->>'day')::date;
  if d is null or d<=(c->>'day')::date or d>(c->>'day')::date+7 or (p_payload->>'time')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'WAKE_TARGET_IN_ADVANCE';end if;
  z:=(d::text||' '||(p_payload->>'time'))::timestamp at time zone(c->>'timezone');
  if z is null then raise exception 'INVALID_PAYLOAD';end if;
  if exists(select 1 from public.task_wake_targets where user_id=p_uid and local_day=d) then raise exception 'WAKE_TARGET_LOCKED';end if;
  insert into public.task_wake_targets(user_id,local_day,target_at,calendar_id,created_at) values(p_uid,d,z,cal,lifecity_private.task_now()) returning id into i;
  return jsonb_build_object('target_id',i,'grace_minutes',10);
 elsif p_action='task_calendar_set' then
  newtz:=p_payload->>'timezone';newdow:=public.payload_integer(p_payload,'week_start',0,6);
  if not exists(select 1 from pg_timezone_names where name=newtz) then raise exception 'INVALID_TIMEZONE';end if;
  if exists(select 1 from public.task_calendars where user_id=p_uid and effective_at>lifecity_private.task_now()) then raise exception 'CALENDAR_CHANGE_PENDING';end if;
  ends:=(c->>'week_ends_at')::timestamptz;
  -- A disclosed, >=24h transition gap prevents timezone hopping earning a second daily claim.
  starts:=((ends+interval '24 hours') at time zone newtz)::date::timestamp at time zone newtz;
  if starts<ends+interval '24 hours' then starts:=starts+interval '1 day';end if;
  insert into public.task_calendars(user_id,timezone,week_start,effective_at,previous_ends_at) values(p_uid,newtz,newdow,starts,ends);
  return jsonb_build_object('effective_at',starts,'pause_from',ends,'timezone',newtz,'week_start',newdow);
 end if;
 return jsonb_build_object('reconciled',true);
end $$;
revoke all on function public.city_partner_command(uuid,text,jsonb,uuid) from public,anon,authenticated;

-- Preserve the command gate/receipt checks. New awards run inside that SAME transaction.
alter function public.game_command(text,jsonb,uuid) rename to game_command_before_tasks;
revoke all on function public.game_command_before_tasks(text,jsonb,uuid) from public,anon,authenticated;
create function public.game_command(p_action text,p_payload jsonb,p_key uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
<<task_gate>>
declare u uuid:=auth.uid();r jsonb;c jsonb;slug text;s public.study_sessions%rowtype;was_replay boolean;
begin
 if u is null then raise exception 'AUTH_REQUIRED';end if;
 perform public.ensure_player(u);
 perform 1 from public.profiles where id=u for update;
 was_replay:=exists(select 1 from public.command_receipts where user_id=u and key=p_key);
 if not was_replay and p_action in('approved_task_claim','task_complete','prayer_set') then
  perform 1 from public.wallets where user_id=u for update;
  for s in select * from public.study_sessions where user_id=u and status='running' loop
   perform public.tick_study(u,s.id,p_key,lifecity_private.task_now());
  end loop;
 end if;
 r:=public.game_command_before_tasks(p_action,p_payload,p_key);
 if p_action='delete_account' then return r;end if;
 c:=lifecity_private.task_context(u,lifecity_private.task_now());
 if not was_replay and not(c->>'paused')::boolean then
  slug:=null;
  if p_action='task_complete' then
   select key into slug from public.task_definitions where id=(p_payload->>'task_id')::uuid and user_id=u and key in('clean_room','make_bed','workout');
  elsif p_action='prayer_set' and p_payload->>'status'='completed' and exists(select 1 from public.coin_transactions where user_id=u and idempotency_key=p_key::text||':prayer:set' and delta>0) and exists(select 1 from public.prayer_logs where user_id=u and id=(r->'result'->>'prayer_id')::uuid and day=(c->>'day')::date) then
   slug:='prayer_'||(p_payload->>'prayer');
   -- One base event per prayer/day, regardless of status correction/repeated taps.
   if exists(select 1 from public.task_base_events where user_id=u and task_base_events.slug=task_gate.slug and local_day=(c->>'day')::date) then slug:=null;end if;
  elsif p_action='study_finish' then
   select * into s from public.study_sessions where id=(p_payload->>'session_id')::uuid and user_id=u;
   if exists(select 1 from public.task_study_minutes where user_id=u and session_id=s.id) then slug:='study_completed';end if;
  end if;
  if slug is not null then
   insert into public.task_base_events(user_id,slug,source_id,local_day,local_week,calendar_id,created_at)
    values(u,slug,case when slug='study_completed' then 'study:'||s.id else p_key::text end,(c->>'day')::date,(c->>'week')::date,(c->>'calendar_id')::uuid,lifecity_private.task_now()) on conflict do nothing;
  end if;
 end if;
 if p_action not like 'partner\_%' escape '\' then perform lifecity_private.task_reconcile(u,p_key);end if;
 return r||jsonb_build_object('state',public.game_state_for(u));
end $$;
revoke all on function public.game_command(text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.game_command(text,jsonb,uuid) to authenticated;

alter function public.game_state_for(uuid) rename to game_state_for_before_tasks;
revoke all on function public.game_state_for_before_tasks(uuid) from public,anon,authenticated;
create function public.game_state_for(p_user uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s jsonb;c jsonb;plan public.task_weekly_plans%rowtype;goals jsonb;
begin
 s:=public.game_state_for_before_tasks(p_user);c:=lifecity_private.task_context(p_user,lifecity_private.task_now());
 select * into plan from public.task_weekly_plans where user_id=p_user and local_week=(c->>'week')::date;
 if found then select jsonb_agg(g||jsonb_build_object('progress',lifecity_private.goal_progress(p_user,plan.local_week,plan.created_at,g->>'slug'))) into goals from jsonb_array_elements(plan.goals) g;end if;
 return s||jsonb_build_object('approved_tasks',jsonb_build_object('version',1,'calendar',c,
  'catalog',(select jsonb_agg(to_jsonb(t) order by slug) from public.approved_task_catalog t),
  'claims',coalesce((select jsonb_agg(to_jsonb(t)-'user_id' order by created_at desc) from public.approved_task_claims t where user_id=p_user),'[]'),
  'laundry_daily_limit',(select laundry_daily_limit from public.task_rule_settings),
  'distinct_today',lifecity_private.task_distinct(p_user,(c->>'day')::date),
  'study_minutes_week',(select floor(coalesce(sum(extract(epoch from ends_at-starts_at)),0)/60) from public.task_study_segments where user_id=p_user and local_week=(c->>'week')::date),
  'weekly_plan',case when plan.id is null then null else to_jsonb(plan)-'user_id'||jsonb_build_object('goals',goals) end,
  'wake_targets',coalesce((select jsonb_agg(to_jsonb(t)-'user_id') from public.task_wake_targets t where user_id=p_user and local_day>=(c->>'day')::date),'[]'),
  'pending_calendar',(select to_jsonb(t)-'user_id' from public.task_calendars t where user_id=p_user and effective_at>lifecity_private.task_now() order by effective_at limit 1),
  'commitment',coalesce((select to_jsonb(t)-'user_id'||jsonb_build_object('current',t.local_day>=(c->>'day')::date-1) from public.task_commitment_days t where user_id=p_user order by local_day desc limit 1),'null')));
end $$;
revoke all on function public.game_state_for(uuid) from public,anon,authenticated;
revoke all on all functions in schema lifecity_private from public,anon,authenticated;
commit;
