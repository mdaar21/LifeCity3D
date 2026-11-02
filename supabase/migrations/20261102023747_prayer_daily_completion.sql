-- Additive, no historical backfill; rewards only follow an authenticated prayer edit.
create table lifecity_private.prayer_day_rewards (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null, active boolean not null default false,
 revision integer not null default 0, xp_awarded boolean not null default false,
 primary key(user_id,day)
);
alter table lifecity_private.prayer_day_rewards enable row level security;
revoke all on lifecity_private.prayer_day_rewards from public,anon,authenticated;
create function lifecity_private.reconcile_prayer_day_reward() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare c jsonb; r lifecity_private.prayer_day_rewards%rowtype; full_day boolean; delta integer;
begin
 if auth.uid() is distinct from new.user_id then return new;end if;
 c:=lifecity_private.task_context(new.user_id,lifecity_private.task_now());
 -- Corrections to a previously rewarded day reverse/restore its net bonus.
 -- Newly completing a historical day never creates a new reward.
 if (c->>'paused')::boolean or new.day<>(c->>'day')::date then
  if not exists(select 1 from lifecity_private.prayer_day_rewards where user_id=new.user_id and day=new.day) then return new;end if;
 end if;
 perform 1 from public.wallets where user_id=new.user_id for update;
 insert into lifecity_private.prayer_day_rewards(user_id,day) values(new.user_id,new.day) on conflict do nothing;
 select * into r from lifecity_private.prayer_day_rewards where user_id=new.user_id and day=new.day for update;
 full_day:=(select count(*)=5 from public.prayer_logs where user_id=new.user_id and day=new.day and status='completed');
 if r.active=full_day then return new;end if;
 delta:=case when full_day then 50 else -50 end;
 perform public.apply_coins(new.user_id,delta,'prayer:daily_bonus:'||new.day,
  'prayer-day:'||new.day||':'||(r.revision+1),null,case when full_day and not r.xp_awarded then 50 else 0 end);
 update lifecity_private.prayer_day_rewards set active=full_day,revision=r.revision+1,xp_awarded=r.xp_awarded or full_day
  where user_id=new.user_id and day=new.day;
 return new;
end $$;
revoke all on function lifecity_private.reconcile_prayer_day_reward() from public,anon,authenticated;
create trigger prayer_daily_completion after update of status on public.prayer_logs
 for each row when(old.status is distinct from new.status) execute function lifecity_private.reconcile_prayer_day_reward();
