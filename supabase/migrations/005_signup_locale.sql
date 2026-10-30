-- Preserve selected signup language without overwriting existing account preferences.
begin;
create or replace function public.ensure_player(p_user uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_name text; v_language text;
begin
  if p_user is null or not exists(select 1 from auth.users where id=p_user) then
    raise exception using message='AUTH_REQUIRED',errcode='P0001';
  end if;
  select left(coalesce(nullif(btrim(raw_user_meta_data->>'display_name'),''),nullif(btrim(raw_user_meta_data->>'name'),''),'Player'),60),case when raw_user_meta_data->>'language'='en' then 'en' else 'ar-SA' end
    into v_name,v_language from auth.users where id=p_user;
  insert into public.profiles(id,display_name,language) values(p_user,v_name,v_language) on conflict(id) do nothing;
  insert into public.wallets(user_id) values(p_user) on conflict(user_id) do nothing;
  insert into public.user_preferences(user_id) values(p_user) on conflict(user_id) do nothing;
  insert into public.city_worlds(user_id) values(p_user) on conflict(user_id) do nothing;
  insert into public.task_definitions(user_id,key,title,title_ar,title_en,reward,category) values
    (p_user,'clean_room','تنظيف الغرفة','تنظيف الغرفة','Clean room',40,'home'),
    (p_user,'make_bed','ترتيب السرير','ترتيب السرير','Make bed',10,'home'),
    (p_user,'workout','تمرين رياضي','تمرين رياضي','Workout',50,'health')
    on conflict(user_id,key) do nothing;
end; $$;

commit;
