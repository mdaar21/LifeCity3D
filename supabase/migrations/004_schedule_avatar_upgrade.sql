-- Forward-compatible upgrade for early local/reference installations.
-- Adds schedule/avatar columns without resetting wallets, ledgers or worlds.
begin;
alter table public.profiles add column if not exists avatar text not null default 'sprout' check(avatar in ('sprout','sun','moon','home'));
alter table public.task_definitions add column if not exists frequency text not null default 'daily' check(frequency in ('daily','weekly','once'));
create or replace function public.ensure_player(p_user uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_name text;
begin
  if p_user is null or not exists(select 1 from auth.users where id=p_user) then
    raise exception using message='AUTH_REQUIRED',errcode='P0001';
  end if;
  select left(coalesce(nullif(btrim(raw_user_meta_data->>'display_name'),''),nullif(btrim(raw_user_meta_data->>'name'),''),'Player'),60)
    into v_name from auth.users where id=p_user;
  insert into public.profiles(id,display_name) values(p_user,v_name) on conflict(id) do nothing;
  insert into public.wallets(user_id) values(p_user) on conflict(user_id) do nothing;
  insert into public.user_preferences(user_id) values(p_user) on conflict(user_id) do nothing;
  insert into public.city_worlds(user_id) values(p_user) on conflict(user_id) do nothing;
  insert into public.task_definitions(user_id,key,title,title_ar,title_en,reward,category) values
    (p_user,'clean_room','تنظيف الغرفة','تنظيف الغرفة','Clean room',40,'home'),
    (p_user,'make_bed','ترتيب السرير','ترتيب السرير','Make bed',10,'home'),
    (p_user,'workout','تمرين رياضي','تمرين رياضي','Workout',50,'health')
    on conflict(user_id,key) do nothing;
end; $$;

create or replace function public.game_command(p_action text,p_payload jsonb,p_key uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_user uuid:=auth.uid(); v_now timestamptz:=clock_timestamp(); v_profile public.profiles%rowtype;
  v_prefs public.user_preferences%rowtype; v_receipt public.command_receipts%rowtype;
  v_result jsonb:='{}'::jsonb; v_response jsonb; v_day date; v_id uuid; v_title text; v_category text;
  v_task public.task_definitions%rowtype; v_count integer; v_day_count integer; v_reward integer; v_limit integer;
  v_session public.study_sessions%rowtype; v_prayer public.prayer_logs%rowtype;
  v_status text; v_prayer_name text; v_value integer; v_delta integer; v_xp integer;
  v_timezone text; v_bool boolean; v_frequency text; v_period_start date; v_period_end date;
begin
  if v_user is null then raise exception using message='AUTH_REQUIRED',errcode='P0001'; end if;
  if p_key is null or p_action is null or char_length(p_action) not between 1 and 64
    or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>8192 then
    raise exception using message='INVALID_PAYLOAD',errcode='P0001';
  end if;
  perform public.ensure_player(v_user);
  -- Caller profile serializes receipts. Partner commands lock only TARGET wallet
  -- in002, preventing reciprocal partner actions from locking two wallets.
  select * into v_profile from public.profiles where id=v_user for update;
  if p_action not like 'partner\_%' escape '\' then
    perform 1 from public.wallets where user_id=v_user for update;
  end if;
  -- Measure only after lock acquisition: queued requests must not move time back.
  v_now:=clock_timestamp();
  select * into v_receipt from public.command_receipts where user_id=v_user and key=p_key;
  if found then
    if v_receipt.action<>p_action or v_receipt.payload<>p_payload then
      raise exception using message='IDEMPOTENCY_CONFLICT',errcode='P0001';
    end if;
    if p_action='partner_inspect' then
      -- Consent is checked again on every inspection, including retries.
      return jsonb_build_object('result',public.city_partner_command(v_user,p_action,p_payload,p_key),
        'state',public.game_state_for(v_user));
    end if;
    -- Replay the same result with a fresh state so a delayed retry cannot roll
    -- the client back behind commands already committed on another device.
    return v_receipt.response||jsonb_build_object('state',public.game_state_for(v_user));
  end if;
  select count(*) into v_count from public.command_receipts where user_id=v_user and created_at>v_now-interval '1 minute';
  if v_count>=120 then raise exception using message='RATE_LIMIT',errcode='P0001'; end if;
  select * into v_prefs from public.user_preferences where user_id=v_user;
  v_day:=(v_now at time zone v_profile.timezone)::date;

  case p_action
  when 'task_complete' then
    v_id:=public.payload_uuid(p_payload,'task_id');
    select * into v_task from public.task_definitions where id=v_id and user_id=v_user;
    if not found then raise exception using message='NOT_FOUND',errcode='P0001'; end if;
    if v_task.archived then raise exception using message='TASK_ARCHIVED',errcode='P0001'; end if;
    v_limit:=case when v_task.frequency='once' then 1 else least(v_task.daily_limit,v_prefs.task_daily_limit) end;
    v_period_start:=case when v_task.frequency='weekly' then date_trunc('week',v_day::timestamp)::date
      when v_task.frequency='daily' then v_day else null end;
    v_period_end:=case when v_task.frequency='weekly' then v_period_start+6 else v_day end;
    select count(*) into v_count from public.task_completions where task_id=v_id
      and (v_period_start is null or day between v_period_start and v_period_end);
    if v_count>=v_limit then raise exception using message='DAILY_LIMIT',errcode='P0001'; end if;
    v_reward:=case when v_task.key is null then least(v_task.reward,v_prefs.custom_reward_limit) else v_task.reward end;
    -- Ordinals remain local-day scoped even when the completion limit is weekly
    -- or lifetime. Editing frequency never makes a prior ordinal reusable.
    select count(*) into v_day_count from public.task_completions where task_id=v_id and day=v_day;
    insert into public.task_completions(user_id,task_id,day,ordinal,reward,command_key)
      values(v_user,v_id,v_day,v_day_count+1,v_reward,p_key) returning id into v_id;
    perform public.apply_coins(v_user,v_reward,'task:'||coalesce(v_task.key,'custom'),p_key::text||':task',null,v_reward);
    insert into public.achievements(user_id,key) values(v_user,'first_task') on conflict do nothing;
    v_result:=jsonb_build_object('completion_id',v_id,'reward',v_reward);
  when 'task_create' then
    if jsonb_typeof(p_payload->'title') is distinct from 'string' then raise exception using message='INVALID_PAYLOAD',errcode='P0001'; end if;
    v_title:=btrim(p_payload->>'title');
    v_category:=coalesce(p_payload->>'category','personal');
    if char_length(v_title) not between 1 and 120 or char_length(v_category) not between 1 and 40
      or (p_payload?'category' and jsonb_typeof(p_payload->'category')<>'string') then
      raise exception using message='INVALID_PAYLOAD',errcode='P0001';
    end if;
    v_reward:=public.payload_integer(p_payload,'reward',1,v_prefs.custom_reward_limit);
    v_limit:=case when p_payload?'daily_limit' then public.payload_integer(p_payload,'daily_limit',1,v_prefs.task_daily_limit) else 1 end;
    v_frequency:=case when p_payload?'frequency' then p_payload->>'frequency' else 'daily' end;
    if v_frequency is null or v_frequency not in ('daily','weekly','once') then
      raise exception using message='INVALID_PAYLOAD',errcode='P0001';
    end if;
    if (select count(*) from public.task_definitions where user_id=v_user and not archived)>=100 then
      raise exception using message='TASK_LIMIT',errcode='P0001';
    end if;
    insert into public.task_definitions(user_id,title,reward,category,frequency,daily_limit)
      values(v_user,v_title,v_reward,v_category,v_frequency,v_limit) returning id into v_id;
    v_result:=jsonb_build_object('task_id',v_id);
  when 'task_update' then
    v_id:=public.payload_uuid(p_payload,'task_id');
    select * into v_task from public.task_definitions where id=v_id and user_id=v_user for update;
    if not found then raise exception using message='NOT_FOUND',errcode='P0001'; end if;
    if v_task.archived then raise exception using message='TASK_ARCHIVED',errcode='P0001'; end if;
    if v_task.key is not null and (p_payload?'title' or p_payload?'reward' or p_payload?'category' or p_payload?'frequency') then
      raise exception using message='TASK_FIXED',errcode='P0001';
    end if;
    if p_payload?'title' then
      if jsonb_typeof(p_payload->'title') is distinct from 'string' or char_length(btrim(p_payload->>'title')) not between 1 and 120 then
        raise exception using message='INVALID_PAYLOAD',errcode='P0001';
      end if;
      v_task.title:=btrim(p_payload->>'title');
    end if;
    if p_payload?'category' then
      if jsonb_typeof(p_payload->'category') is distinct from 'string' or char_length(p_payload->>'category') not between 1 and 40 then
        raise exception using message='INVALID_PAYLOAD',errcode='P0001';
      end if;
      v_task.category:=p_payload->>'category';
    end if;
    if p_payload?'reward' then v_task.reward:=public.payload_integer(p_payload,'reward',1,v_prefs.custom_reward_limit); end if;
    if p_payload?'daily_limit' then v_task.daily_limit:=public.payload_integer(p_payload,'daily_limit',1,v_prefs.task_daily_limit); end if;
    if p_payload?'frequency' then
      v_frequency:=p_payload->>'frequency';
      if v_frequency is null or v_frequency not in ('daily','weekly','once') then
        raise exception using message='INVALID_PAYLOAD',errcode='P0001';
      end if;
      v_task.frequency:=v_frequency;
    end if;
    update public.task_definitions set title=v_task.title,reward=v_task.reward,category=v_task.category,
      frequency=v_task.frequency,daily_limit=v_task.daily_limit where id=v_id;
    v_result:=jsonb_build_object('task_id',v_id,'updated',true);
  when 'task_archive' then
    v_id:=public.payload_uuid(p_payload,'task_id');
    update public.task_definitions set archived=true where id=v_id and user_id=v_user;
    if not found then raise exception using message='NOT_FOUND',errcode='P0001'; end if;
    v_result:=jsonb_build_object('task_id',v_id);
  when 'study_start' then
    if exists(select 1 from public.study_sessions where user_id=v_user and status<>'finished') then
      raise exception using message='SESSION_ACTIVE',errcode='P0001';
    end if;
    insert into public.study_sessions(user_id,started_at,last_tick_at) values(v_user,v_now,v_now) returning * into v_session;
    v_result:=jsonb_build_object('session_id',v_session.id);
  when 'study_heartbeat','study_pause','study_resume','study_finish' then
    v_id:=public.payload_uuid(p_payload,'session_id');
    select * into v_session from public.study_sessions where id=v_id and user_id=v_user for update;
    if not found then raise exception using message='NOT_FOUND',errcode='P0001'; end if;
    if v_session.status='finished' then
      if p_action<>'study_finish' then raise exception using message='SESSION_FINISHED',errcode='P0001'; end if;
    elsif p_action='study_resume' then
      -- Repeated resume of an already running session never advances its clock.
      if v_session.status='paused' then
        update public.study_sessions set status='running',last_tick_at=v_now where id=v_id returning * into v_session;
      end if;
    else
      v_session:=public.tick_study(v_user,v_id,p_key,v_now);
      if p_action='study_pause' then
        update public.study_sessions set status='paused' where id=v_id returning * into v_session;
      elsif p_action='study_finish' then
        update public.study_sessions set status='finished',finished_at=v_now where id=v_id returning * into v_session;
      end if;
    end if;
    v_result:=jsonb_build_object('session_id',v_id,'session',to_jsonb(v_session),'credited_reward',v_session.credited_minutes+case when v_session.bonus_awarded then 20 else 0 end);
  when 'prayer_set' then
    v_prayer_name:=p_payload->>'prayer'; v_status:=p_payload->>'status';
    if v_prayer_name is null or v_prayer_name not in ('fajr','dhuhr','asr','maghrib','isha')
      or v_status is null or v_status not in ('pending','completed','missed','excused') then
      raise exception using message='INVALID_PAYLOAD',errcode='P0001';
    end if;
    if p_payload?'day' then
      if jsonb_typeof(p_payload->'day') is distinct from 'string' or (p_payload->>'day')!~'^\d{4}-\d{2}-\d{2}$' then
        raise exception using message='INVALID_PAYLOAD',errcode='P0001';
      end if;
      v_day:=(p_payload->>'day')::date;
      if v_day>(v_now at time zone v_profile.timezone)::date or v_day<(v_now at time zone v_profile.timezone)::date-7 then
        raise exception using message='DAY_OUT_OF_RANGE',errcode='P0001';
      end if;
    end if;
    if v_status='missed' and (p_payload->'confirmed_missed') is distinct from 'true'::jsonb then
      raise exception using message='CONFIRM_MISSED',errcode='P0001';
    end if;
    insert into public.prayer_logs(user_id,day,prayer) values(v_user,v_day,v_prayer_name) on conflict do nothing;
    select * into v_prayer from public.prayer_logs where user_id=v_user and day=v_day and prayer=v_prayer_name for update;
    v_value:=case when v_status='missed' then -100 when v_status='completed' then case when v_prayer_name='fajr' then 30 else 20 end else 0 end;
    v_delta:=v_value-v_prayer.net_coins;
    v_xp:=case when v_status='completed' and not v_prayer.xp_awarded then v_value else 0 end;
    if v_prayer.status<>v_status then
      insert into public.prayer_audit(user_id,prayer_log_id,previous_status,new_status,delta,command_key)
        values(v_user,v_prayer.id,v_prayer.status,v_status,v_delta,p_key);
      -- Reverse the previous statement, then record the new statement. A missed
      -- entry is always exactly -100; refunds remain visibly separate.
      if v_prayer.net_coins<>0 then
        perform public.apply_coins(v_user,-v_prayer.net_coins,'prayer:'||v_prayer_name||':correction',p_key::text||':prayer:reverse',null,0);
      end if;
      if v_value<>0 then
        perform public.apply_coins(v_user,v_value,'prayer:'||v_prayer_name||':'||v_status,p_key::text||':prayer:set',null,v_xp);
      end if;
      update public.prayer_logs set status=v_status,net_coins=v_value,xp_awarded=xp_awarded or v_xp>0,updated_at=v_now where id=v_prayer.id;
    end if;
    if v_status='completed' then insert into public.achievements(user_id,key) values(v_user,'first_prayer') on conflict do nothing; end if;
    v_result:=jsonb_build_object('prayer_id',v_prayer.id,'delta',v_delta,'status',v_status);
  when 'profile_update' then
    if p_payload?'display_name' then
      if jsonb_typeof(p_payload->'display_name') is distinct from 'string' or char_length(btrim(p_payload->>'display_name')) not between 1 and 60 then
        raise exception using message='INVALID_PAYLOAD',errcode='P0001';
      end if;
      v_profile.display_name:=btrim(p_payload->>'display_name');
    end if;
    if p_payload?'language' then
      if coalesce(p_payload->>'language','') not in ('ar-SA','en') then raise exception using message='INVALID_PAYLOAD',errcode='P0001'; end if;
      v_profile.language:=p_payload->>'language';
    end if;
    if p_payload?'theme' then
      if coalesce(p_payload->>'theme','') not in ('light','dark','system') then raise exception using message='INVALID_PAYLOAD',errcode='P0001'; end if;
      v_profile.theme:=p_payload->>'theme';
    end if;
    if p_payload?'digits' then
      if coalesce(p_payload->>'digits','') not in ('latin','local') then raise exception using message='INVALID_PAYLOAD',errcode='P0001'; end if;
      v_profile.digits:=p_payload->>'digits';
    end if;
    if p_payload?'currency_label' then
      if coalesce(p_payload->>'currency_label','') not in ('coins','points') then raise exception using message='INVALID_PAYLOAD',errcode='P0001'; end if;
      v_profile.currency_label:=p_payload->>'currency_label';
    end if;
    if p_payload?'avatar' then
      if coalesce(p_payload->>'avatar','') not in ('sprout','sun','moon','home') then
        raise exception using message='INVALID_PAYLOAD',errcode='P0001';
      end if;
      v_profile.avatar:=p_payload->>'avatar';
    end if;
    if p_payload?'timezone' then
      v_timezone:=p_payload->>'timezone';
      if v_timezone is null or not exists(select 1 from pg_timezone_names where name=v_timezone) then
        raise exception using message='INVALID_TIMEZONE',errcode='P0001';
      end if;
      if v_timezone<>v_profile.timezone then
        if v_profile.timezone_changed_at is not null and v_profile.timezone_changed_at>v_now-interval '7 days' then
          raise exception using message='TIMEZONE_COOLDOWN',errcode='P0001';
        end if;
        v_profile.timezone:=v_timezone; v_profile.timezone_changed_at:=v_now;
      end if;
    end if;
    if p_payload?'custom_reward_limit' then v_prefs.custom_reward_limit:=public.payload_integer(p_payload,'custom_reward_limit',1,10000); end if;
    if p_payload?'task_daily_limit' then
      v_prefs.task_daily_limit:=public.payload_integer(p_payload,'task_daily_limit',1,20);
      update public.task_definitions set daily_limit=v_prefs.task_daily_limit where user_id=v_user and key is not null;
    end if;
    foreach v_title in array array['prayer_reminders','audio','notifications'] loop
      if p_payload?v_title then
        if jsonb_typeof(p_payload->v_title) is distinct from 'boolean' then raise exception using message='INVALID_PAYLOAD',errcode='P0001'; end if;
        v_bool:=(p_payload->>v_title)::boolean;
        if v_title='prayer_reminders' then v_prefs.prayer_reminders:=v_bool;
        elsif v_title='audio' then v_prefs.audio:=v_bool; else v_prefs.notifications:=v_bool; end if;
      end if;
    end loop;
    update public.profiles set display_name=v_profile.display_name,language=v_profile.language,timezone=v_profile.timezone,
      timezone_changed_at=v_profile.timezone_changed_at,theme=v_profile.theme,digits=v_profile.digits,currency_label=v_profile.currency_label,
      avatar=v_profile.avatar,updated_at=v_now where id=v_user;
    update public.user_preferences set custom_reward_limit=v_prefs.custom_reward_limit,task_daily_limit=v_prefs.task_daily_limit,
      prayer_reminders=v_prefs.prayer_reminders,audio=v_prefs.audio,notifications=v_prefs.notifications where user_id=v_user;
    v_result:=jsonb_build_object('updated',true);
  when 'delete_account' then
    if (p_payload->>'confirmation') is distinct from 'DELETE' then raise exception using message='DELETE_CONFIRMATION',errcode='P0001'; end if;
    select count(*) into v_count from public.coin_transactions where user_id=v_user;
    insert into public.account_deletion_audit(ledger_entries) values(v_count);
    delete from auth.users where id=v_user;
    return jsonb_build_object('state',null,'result',jsonb_build_object('deleted',true,'retention','anonymous-deletion-count-only'));
  else
    v_result:=public.city_partner_command(v_user,p_action,p_payload,p_key);
  end case;

  insert into public.sync_events(user_id,action,key) values(v_user,p_action,p_key);
  v_response:=jsonb_build_object('state',public.game_state_for(v_user),'result',v_result);
  -- Retain immutable command results, not an ever-growing copy of all history
  -- for every heartbeat. State is read afresh on a successful retry.
  insert into public.command_receipts(user_id,key,action,payload,response)
    values(v_user,p_key,p_action,p_payload,jsonb_build_object('result',case when p_action='partner_inspect' then null else v_result end));
  return v_response;
exception
  when invalid_text_representation or numeric_value_out_of_range or datetime_field_overflow or invalid_datetime_format or check_violation then
    raise exception using message='INVALID_PAYLOAD',errcode='P0001';
end; $$;
commit;
