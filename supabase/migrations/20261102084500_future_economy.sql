-- Future catalog prices only. No wallet, contract, project, cost basis or ledger changes.
begin;
update public.catalog_items c set price=v.price from(values ('road',10),('tree',20),('bush',15),('house',800),('villa',7500),('lake',1500),('beach',5000),('skyscraper',10000),('palace',20000),('car',2400),('bench',40),('lightpost',60),('park',250),('bridge',150),('apartment',1800),('fence',15),('path',10),('plaza',350),('desk',180),('sofa',550),('bed',450),('rug',100),('lamp',90),('plant',40),('shelf',250)) v(id,price) where c.id=v.id;
create or replace function lifecity_private.purchase_level(p_user uuid,p_realm text default 'main') returns integer
language sql stable security definer set search_path=public,pg_temp as $$
 select least(40,floor(sqrt(greatest(w.player_xp,case when p_realm='yuyi' then coalesce(y.city_xp,0) else w.city_xp end)/25.0))::integer+1)
 from public.wallets w left join public.yuyi_worlds y on y.user_id=w.user_id where w.user_id=p_user
$$;
revoke all on function lifecity_private.purchase_level(uuid,text) from public,anon,authenticated;
commit;
