-- Large plans retain every floor/receipt; other entity caps stay unchanged.
-- Install and validate the replacement before removing the old stricter cap.
alter table public.world_entities add constraint world_entities_bounded_data
 check(jsonb_typeof(data)='object' and octet_length(data::text)<=
  case when kind in('building','blueprint') then 1048576 else 262144 end) not valid;
alter table public.world_entities validate constraint world_entities_bounded_data;
alter table public.world_entities drop constraint world_entities_data_check;
