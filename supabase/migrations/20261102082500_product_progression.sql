-- Add purchase eligibility only; no balances, XP, owned assets or paid bases are rewritten.
begin;
create function lifecity_private.purchase_level(p_user uuid,p_realm text default 'main') returns integer
language sql stable security definer set search_path=public,pg_temp as $$
 select least(40,floor(sqrt(greatest(w.player_xp,case when p_realm='yuyi' then coalesce(y.city_xp,0) else w.city_xp end)/100.0))::integer+1)
 from public.wallets w left join public.yuyi_worlds y on y.user_id=w.user_id where w.user_id=p_user
$$;
revoke all on function lifecity_private.purchase_level(uuid,text) from public,anon,authenticated;
update public.catalog_items c set unlock_level=v.level from(values ('road',1),('path',1),('bridge',5),('lightpost',3),('tree',1),('bush',1),('bench',2),('park',5),('fence',2),('plaza',7),('house',1),('apartment',5),('villa',10),('palace',20),('skyscraper',30),('lake',3),('beach',10),('car',5),('plant',1),('rug',2),('lamp',2),('desk',5),('sofa',5),('bed',1),('shelf',10)) v(id,level) where c.id=v.id;
-- Keep each existing command implementation and its grants. Replace only the three legacy level expressions.
do $$ declare r record;body text;n integer:=0;begin
 for r in select p.oid from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='public' and p.proname like 'city_partner_command%' loop
  body:=pg_get_functiondef(r.oid);
  if position('floor(sqrt(city_xp/100.0))::integer+1' in body)>0 then
   body:=replace(body,'floor(sqrt(city_xp/100.0))::integer+1','lifecity_private.purchase_level(p_uid,''main'')');execute body;n:=n+1;
  elsif position('floor(sqrt(w.city_xp/100.0))::int+1' in body)>0 then
   body:=replace(body,'floor(sqrt(w.city_xp/100.0))::int+1','lifecity_private.purchase_level(p_uid,''yuyi'')');execute body;n:=n+1;
  end if;
 end loop;
 if n<>3 then raise exception 'Unexpected legacy progression implementations: %',n;end if;
end $$;
alter function public.world_service_context(uuid,uuid) rename to world_service_context_before_progression;
create function public.world_service_context(p_user uuid,p_key uuid) returns jsonb
language sql security definer set search_path=public,pg_temp as $$
 select public.world_service_context_before_progression(p_user,p_key)||jsonb_build_object('progress_xp',jsonb_build_object(
 'main',(select greatest(city_xp,player_xp) from public.wallets where user_id=p_user),
 'yuyi',(select greatest(w.player_xp,y.city_xp) from public.wallets w join public.yuyi_worlds y on y.user_id=w.user_id where w.user_id=p_user)))
$$;
revoke all on function public.world_service_context(uuid,uuid) from public,anon,authenticated;
grant execute on function public.world_service_context(uuid,uuid) to service_role;
commit;
