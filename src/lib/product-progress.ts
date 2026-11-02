import {BUILDING_CATALOG} from '../../supabase/functions/_shared/building-catalog';
import {FURNITURE} from '../../supabase/functions/_shared/world-commerce';
import {CARS} from '../../supabase/functions/_shared/world-motion';
import {VEGETATION,FARM_PLOTS,CROPS} from '../../supabase/functions/_shared/world-horticulture';
import {NODE_CATALOG} from '../../supabase/functions/_shared/world-infrastructure';
import {requiredLevel} from '../../supabase/functions/_shared/product-unlocks';
import {CATALOG} from './catalog';
import {legacyOffSale,legacyShopSection,type ShopSection} from './shop-catalog';
export interface ProgressProduct{key:string;asset:string;ar:string;en:string;section:ShopSection;level:number}
const rows=(prefix:string,section:ShopSection,list:readonly {id:string;ar:string;en:string}[]):ProgressProduct[]=>list.map(v=>({key:prefix+':'+v.id,asset:prefix+':'+v.id,section,ar:v.ar,en:v.en,level:requiredLevel(prefix+':'+v.id)}));
export const PROGRESS_PRODUCTS:ProgressProduct[]=[
 ...CATALOG.filter(v=>!legacyOffSale(v.id)).map(v=>({key:'legacy:'+v.id,asset:'legacy:'+v.id,ar:v.name_ar,en:v.name_en,section:legacyShopSection(v),level:requiredLevel('legacy:'+v.id)})),
 ...rows('building','construction',Object.entries(BUILDING_CATALOG).map(([id,v])=>({id,...v}))),...rows('car','vehicles',CARS),...rows('furniture','furniture',FURNITURE),
 ...rows('vegetation','plants',VEGETATION),...rows('farm','plants',FARM_PLOTS),...rows('crop','plants',CROPS),...rows('node','roads',NODE_CATALOG.filter(v=>['streetlight','bus_stop','road_junction'].includes(v.id)))
];
export function nextProducts(level:number,section?:ShopSection){const future=PROGRESS_PRODUCTS.filter(p=>p.level>level&&(!section||p.section===section)),next=Math.min(...future.map(p=>p.level));return {level:Number.isFinite(next)?next:null,products:future.filter(p=>p.level===next)};}
