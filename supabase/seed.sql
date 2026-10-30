-- Authoritative server catalog; mirrors src/lib/catalog.ts. Admin migration only.
-- No accounts, balances, completed tasks or removed default missions are seeded.
begin;
insert into public.catalog_items(id,name_ar,name_en,description_ar,description_en,price,category,footprint_x,footprint_z,unlock_level,model,is_furniture) values
  ('road','طريق','Road','طريق بتصميم أصلي لمدينتك.','An original road for your city.',10,'roads',1,1,1,'road',false),
  ('tree','شجرة','Tree','شجرة بتصميم أصلي لمدينتك.','An original tree for your city.',20,'nature',1,1,1,'tree',false),
  ('bush','شجيرة','Bush','شجيرة بتصميم أصلي لمدينتك.','An original bush for your city.',15,'nature',1,1,1,'bush',false),
  ('house','بيت صغير','Small house','بيت صغير بتصميم أصلي لمدينتك.','An original small house for your city.',800,'homes',2,2,1,'house',false),
  ('villa','فيلا','Villa','فيلا بتصميم أصلي لمدينتك.','An original villa for your city.',2500,'homes',3,3,2,'villa',false),
  ('lake','بحيرة','Lake','بحيرة بتصميم أصلي لمدينتك.','An original lake for your city.',1500,'water',3,3,1,'lake',false),
  ('beach','شاطئ','Beach','شاطئ بتصميم أصلي لمدينتك.','An original beach for your city.',5000,'water',4,3,2,'beach',false),
  ('skyscraper','ناطحة سحاب','Skyscraper','ناطحة سحاب بتصميم أصلي لمدينتك.','An original skyscraper for your city.',10000,'landmarks',3,3,3,'skyscraper',false),
  ('palace','قصر','Palace','قصر بتصميم أصلي لمدينتك.','An original palace for your city.',20000,'landmarks',4,4,5,'palace',false),
  ('car','سيارة','Car','سيارة بتصميم أصلي لمدينتك.','An original car for your city.',500,'vehicles',1,1,1,'car',false),
  ('bench','مقعد','Bench','مقعد بتصميم أصلي لمدينتك.','An original bench for your city.',40,'nature',1,1,1,'bench',false),
  ('lightpost','عمود إنارة','Street light','عمود إنارة بتصميم أصلي لمدينتك.','An original street light for your city.',60,'roads',1,1,1,'lightpost',false),
  ('park','حديقة','Park','حديقة بتصميم أصلي لمدينتك.','An original park for your city.',250,'nature',2,2,1,'park',false),
  ('bridge','جسر','Bridge','جسر بتصميم أصلي لمدينتك.','An original bridge for your city.',150,'roads',1,2,1,'bridge',false),
  ('apartment','عمارة','Apartments','عمارة بتصميم أصلي لمدينتك.','An original apartments for your city.',1800,'homes',2,2,2,'apartment',false),
  ('fence','سياج','Fence','سياج بتصميم أصلي لمدينتك.','An original fence for your city.',15,'nature',1,1,1,'fence',false),
  ('path','ممر','Path','ممر بتصميم أصلي لمدينتك.','An original path for your city.',10,'roads',1,1,1,'path',false),
  ('plaza','ساحة','Plaza','ساحة بتصميم أصلي لمدينتك.','An original plaza for your city.',350,'nature',2,2,1,'plaza',false),
  ('desk','مكتب','Desk','مكتب بتصميم أصلي لمدينتك.','An original desk for your city.',80,'furniture',1,1,1,'desk',true),
  ('sofa','أريكة','Sofa','أريكة بتصميم أصلي لمدينتك.','An original sofa for your city.',120,'furniture',2,1,1,'sofa',true),
  ('bed','سرير','Bed','سرير بتصميم أصلي لمدينتك.','An original bed for your city.',150,'furniture',1,2,1,'bed',true),
  ('rug','سجادة','Rug','سجادة بتصميم أصلي لمدينتك.','An original rug for your city.',40,'furniture',2,2,1,'rug',true),
  ('lamp','مصباح','Lamp','مصباح بتصميم أصلي لمدينتك.','An original lamp for your city.',60,'furniture',1,1,1,'lamp',true),
  ('plant','نبتة منزلية','House plant','نبتة منزلية بتصميم أصلي لمدينتك.','An original house plant for your city.',40,'furniture',1,1,1,'plant',true),
  ('shelf','رفوف','Shelving','رفوف بتصميم أصلي لمدينتك.','An original shelving for your city.',100,'furniture',1,1,1,'shelf',true)
on conflict(id) do update set
  name_ar=excluded.name_ar,name_en=excluded.name_en,
  description_ar=excluded.description_ar,description_en=excluded.description_en,
  price=excluded.price,category=excluded.category,footprint_x=excluded.footprint_x,
  footprint_z=excluded.footprint_z,unlock_level=excluded.unlock_level,
  model=excluded.model,is_furniture=excluded.is_furniture;

insert into public.city_rule_prices(action,price) values('land_expand',1000)
on conflict(action) do update set price=excluded.price;
commit;
