import type {CatalogItem,Category} from './types';
const item=(id:string,ar:string,en:string,price:number,category:Category,x=1,z=1,level=1,furniture=false):CatalogItem=>({id,name_ar:ar,name_en:en,description_ar:`${ar} بتصميم أصلي لمدينتك.`,description_en:`An original ${en.toLowerCase()} for your city.`,price,category,footprint_x:x,footprint_z:z,unlock_level:level,model:id,is_furniture:furniture});
export const CATALOG:CatalogItem[]=[
item('road','طريق','Road',10,'roads'),item('tree','شجرة','Tree',20,'nature'),item('bush','شجيرة','Bush',15,'nature'),
item('house','بيت صغير','Small house',800,'homes',2,2),item('villa','فيلا','Villa',2500,'homes',3,3,2),
item('lake','بحيرة','Lake',1500,'water',3,3),item('beach','شاطئ','Beach',5000,'water',4,3,2),
item('skyscraper','ناطحة سحاب','Skyscraper',10000,'landmarks',3,3,3),item('palace','قصر','Palace',20000,'landmarks',4,4,5),
item('car','سيارة','Car',500,'vehicles'),item('bench','مقعد','Bench',40,'nature'),item('lightpost','عمود إنارة','Street light',60,'roads'),
item('park','حديقة','Park',250,'nature',2,2),item('bridge','جسر','Bridge',150,'roads',1,2),item('apartment','عمارة','Apartments',1800,'homes',2,2,2),
item('fence','سياج','Fence',15,'nature'),item('path','ممر','Path',10,'roads'),item('plaza','ساحة','Plaza',350,'nature',2,2),
item('desk','مكتب','Desk',80,'furniture',1,1,1,true),item('sofa','أريكة','Sofa',120,'furniture',2,1,1,true),item('bed','سرير','Bed',150,'furniture',1,2,1,true),
item('rug','سجادة','Rug',40,'furniture',2,2,1,true),item('lamp','مصباح','Lamp',60,'furniture',1,1,1,true),item('plant','نبتة منزلية','House plant',40,'furniture',1,1,1,true),item('shelf','رفوف','Shelving',100,'furniture',1,1,1,true)
];
export const catalogById=(id:string)=>CATALOG.find(i=>i.id===id);
