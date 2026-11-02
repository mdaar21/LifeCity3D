import type {Realm,WorldContext} from './world-types.ts';
/** Deliberate category schedules, independent from price. Existing ownership is never checked here. */
export const PRODUCT_UNLOCKS:Record<string,number>={
 'legacy:road':1,'legacy:path':1,'legacy:bridge':5,'legacy:lightpost':3,
 'legacy:tree':1,'legacy:bush':1,'legacy:bench':2,'legacy:park':5,'legacy:fence':2,'legacy:plaza':7,
 'legacy:house':1,'legacy:apartment':5,'legacy:villa':10,'legacy:palace':20,'legacy:skyscraper':30,
 'legacy:lake':3,'legacy:beach':10,'legacy:car':5,
 'legacy:plant':1,'legacy:rug':2,'legacy:lamp':2,'legacy:desk':5,'legacy:sofa':5,'legacy:bed':1,'legacy:shelf':10,
 'building:house':1,'building:villa':10,'building:restaurant':5,'building:mall':20,'building:hotel':15,'building:resort':30,
 'building:school':5,'building:university':25,'building:clinic':5,'building:hospital':20,'building:garage':5,'building:museum':15,'building:office':10,
 'building:tower_glass':25,'building:tower_round':20,'building:tower_twist':35,'building:tower_steps':25,'building:tower_twin':35,'building:tower_spire':30,'building:tower_sail':40,'building:tower_crown':30,
 'car:cedar':5,'car:dune':15,'car:atlas':20,
 'furniture:bed':1,'furniture:chair':1,'furniture:table':2,'furniture:sofa':5,'furniture:counter':10,'furniture:plant':1,'furniture:shelf':15,
 'vegetation:date_palm':3,'vegetation:fan_palm':2,'vegetation:coconut_palm':5,'vegetation:royal_palm':7,'vegetation:cherry_blossom':5,'vegetation:jacaranda':7,'vegetation:orange_tree':3,'vegetation:lemon_tree':3,'vegetation:olive_tree':2,'vegetation:box_hedge':5,'vegetation:flowering_shrub':1,'vegetation:agave':1,'vegetation:bougainvillea':10,'vegetation:cypress':5,
 'farm:bed':1,'farm:orchard':7,
 'crop:tomato':1,'crop:wheat':1,'crop:carrot':1,'crop:strawberry':5,'crop:lavender':3,'crop:orchard_orange':7,'crop:orchard_lemon':7,'crop:orchard_dates':10,
 'node:road_junction':1,'node:streetlight':3,'node:bus_stop':8,'node:metro_station':12,'node:depot':12,
 'node:power_plant':5,'node:solar':8,'node:battery':5,'node:transformer':3,'node:power_junction':1,'node:water_tank':3,'node:water_pump':3,'node:water_junction':1,'node:treatment':5,'node:sewage_junction':1,
 'decoration:park':5,'decoration:tree':1,'decoration:bench':2,'decoration:lamp':3,'decoration:fountain':7,'decoration:pet_habitat':10,
};
export const XP_LEVEL_UNIT=25;
export const levelFromXp=(xp:number)=>Math.min(40,Math.floor(Math.sqrt(Math.max(0,Number.isFinite(xp)?xp:0)/XP_LEVEL_UNIT))+1);
export const requiredLevel=(key:string)=>PRODUCT_UNLOCKS[key]??1;
export function purchaseKey(c:WorldContext,op:string,p:Record<string,unknown>):string|null{
 if(op==='building_start'){const b=c.world.entities.find(e=>e.id===p.blueprint_id&&e.kind==='blueprint');return b?.kind==='blueprint'?'building:'+b.archetype:null;}
 const fields:Record<string,[string,string]>={car_buy:['car','model'],furniture_buy:['furniture','type'],vegetation_buy:['vegetation','item'],farm_plot_buy:['farm','item'],crop_plant:['crop','crop_id'],node_create:['node','item'],decoration_buy:['decoration','item']};
 const row=fields[op];return row?row[0]+':'+String(p[row[1]]):null;
}
export function assertProductAccess(c:WorldContext,op:string,p:Record<string,unknown>,realm:Realm){const key=purchaseKey(c,op,p);if(key&&levelFromXp(c.progress_xp?.[realm]??0)<requiredLevel(key))throw Error('ITEM_LOCKED');}
