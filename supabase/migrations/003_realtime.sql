begin;
-- Realtime is optional acceleration; ten-second authenticated polling remains
-- available. Local PostgreSQL test harness has no Supabase publication.
do $$
declare v_table text;
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  foreach v_table in array array['wallets','city_worlds','profiles'] loop
   if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=v_table) then
    execute format('alter publication supabase_realtime add table public.%I',v_table);
   end if;
  end loop;
 end if;
end;
$$;
commit;
