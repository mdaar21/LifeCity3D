import {BUILDING_CATALOG} from '../../supabase/functions/_shared/building-catalog';
import {CATALOG} from '../lib/catalog';
import {VEGETATION,FARM_PLOTS,CROPS} from '../../supabase/functions/_shared/world-horticulture';
import {CARS} from '../../supabase/functions/_shared/world-motion';
import {FURNITURE} from '../../supabase/functions/_shared/world-commerce';
import {NODE_CATALOG,DECORATIONS} from '../../supabase/functions/_shared/world-infrastructure';
import {MATERIALS,ARCHETYPES} from '../../supabase/functions/_shared/world-planner';
export interface AssetArt {key:string;family:string;id:string;ar:string;en:string}
export const BUILDING_NAMES:Record<string,[string,string]>=Object.fromEntries(Object.entries(BUILDING_CATALOG).map(([id,v])=>[id,[v.ar,v.en]]));
const group=(family:string,rows:readonly {id:string;ar:string;en:string}[]):AssetArt[]=>rows.map(r=>({...r,key:family+':'+r.id,family}));
export const ASSET_ART:AssetArt[]=[
 ...group('legacy',CATALOG.map(c=>({id:c.id,ar:c.name_ar,en:c.name_en}))),
 ...group('building',ARCHETYPES.map(id=>({id,ar:BUILDING_NAMES[id][0],en:BUILDING_NAMES[id][1]}))),
 ...group('vegetation',VEGETATION),...group('farm',FARM_PLOTS),...group('crop',CROPS),
 ...group('furniture',FURNITURE),...group('car',CARS),...group('node',NODE_CATALOG),...group('decoration',DECORATIONS),...group('material',MATERIALS),
 ...group('tool',[{id:'road',ar:'رسم طريق',en:'Draw road'},{id:'land',ar:'أرض جديدة',en:'Land'},{id:'terrain',ar:'تشكيل الأرض',en:'Terrain'}])
];
export function assetArtPath(key:string){const [family,id]=key.split(':');return family==='legacy'?`catalog/${id}.png`:`catalog/world/${family}-${id}.png`;}
