import type {Decoration,Realm,WorldContext,WorldPatch,WorldTools} from './world-types.ts';
import {bounds,contains,fail,flatHeight,integer,money,numeric,owned,priced,surfaceBlocked,WORLD_LIMIT} from './world-math.ts';
import {passiveRemaining} from './world-networks.ts';
// Prices are canonical cents, used exclusively by the trusted quote engine.
export const VEGETATION=[
 {id:'date_palm',ar:'نخيل تمر',en:'Date palm',family:'date',price:6500,width:1.6,depth:1.6},
 {id:'fan_palm',ar:'نخيل مروحي',en:'Fan palm',family:'fan',price:5500,width:1.4,depth:1.4},
 {id:'coconut_palm',ar:'نخيل جوز الهند',en:'Coconut palm',family:'coconut',price:7500,width:1.8,depth:1.8},
 {id:'royal_palm',ar:'نخيل ملكي',en:'Royal palm',family:'royal',price:8500,width:1.5,depth:1.5},
 {id:'cherry_blossom',ar:'شجرة زهر وردي',en:'Pink blossom tree',family:'blossom',price:6000,width:1.8,depth:1.8},
 {id:'jacaranda',ar:'جاكرندا بنفسجية',en:'Jacaranda',family:'purple',price:7000,width:2,depth:2},
 {id:'orange_tree',ar:'شجرة برتقال للزينة',en:'Ornamental orange tree',family:'orange',price:5000,width:1.5,depth:1.5},
 {id:'lemon_tree',ar:'شجرة ليمون للزينة',en:'Ornamental lemon tree',family:'lemon',price:5000,width:1.5,depth:1.5},
 {id:'olive_tree',ar:'شجرة زيتون',en:'Olive tree',family:'olive',price:4500,width:1.5,depth:1.5},
 {id:'box_hedge',ar:'سياج نباتي مشذب',en:'Clipped hedge',family:'hedge',price:2500,width:2,depth:.6},
 {id:'flowering_shrub',ar:'شجيرة مزهرة',en:'Flowering shrub',family:'shrub',price:2000,width:1,depth:1},
 {id:'agave',ar:'أغاف للزينة',en:'Ornamental agave',family:'agave',price:1800,width:1,depth:1},
 {id:'bougainvillea',ar:'جهنمية',en:'Bougainvillea',family:'bougainvillea',price:3500,width:1.2,depth:1.2},
 {id:'cypress',ar:'سرو عمودي',en:'Columnar cypress',family:'cypress',price:4000,width:1,depth:1}
] as const;
export const FARM_PLOTS=[{id:'bed',ar:'حوض زراعة',en:'Planting bed',width:2,depth:2,price:2500},{id:'orchard',ar:'قطعة بستان',en:'Orchard plot',width:4,depth:4,price:10000}] as const;
export const CROPS=[
 {id:'tomato',ar:'طماطم',en:'Tomatoes',plot:'bed',seed:200,minutes:120,waterings:2,yield:8,unit:100},
 {id:'wheat',ar:'قمح',en:'Wheat',plot:'bed',seed:150,minutes:180,waterings:2,yield:6,unit:100},
 {id:'carrot',ar:'جزر',en:'Carrots',plot:'bed',seed:150,minutes:90,waterings:1,yield:5,unit:100},
 {id:'strawberry',ar:'فراولة',en:'Strawberries',plot:'bed',seed:300,minutes:240,waterings:3,yield:6,unit:200},
 {id:'lavender',ar:'لافندر',en:'Lavender',plot:'bed',seed:200,minutes:180,waterings:2,yield:4,unit:200},
 {id:'orchard_orange',ar:'بستان برتقال',en:'Orange orchard',plot:'orchard',seed:1200,minutes:720,waterings:3,yield:20,unit:100},
 {id:'orchard_lemon',ar:'بستان ليمون',en:'Lemon orchard',plot:'orchard',seed:1000,minutes:600,waterings:3,yield:18,unit:100},
 {id:'orchard_dates',ar:'بستان تمور',en:'Date orchard',plot:'orchard',seed:1500,minutes:1440,waterings:4,yield:20,unit:200}
] as const;
export interface FarmState {plot:'bed'|'orchard';cycle:number;crop:{id:string;planted_at:string;waterings:number;harvested_at:string|null}|null;produce:Record<string,number>;harvests:number}
export function farmProgress(farm:FarmState,now:string){
 const crop=CROPS.find(c=>c.id===farm.crop?.id);if(!crop||!farm.crop)return {progress:0,stage:'empty' as const,ready:false,remaining:0};
 const elapsed=Math.max(0,Date.parse(now)-Date.parse(farm.crop.planted_at)),time=Math.min(1,elapsed/(crop.minutes*60000)),progress=Math.min(time,(farm.crop.waterings+1)/(crop.waterings+1)),ready=time>=1&&farm.crop.waterings>=crop.waterings&&!farm.crop.harvested_at;
 return {progress,stage:farm.crop.harvested_at?'harvested':ready?'mature':progress<.25?'seedling':progress<.65?'growing':'flowering',ready,remaining:Math.max(0,Math.ceil(crop.minutes-elapsed/60000))};
}
function fit(c:WorldContext,realm:Realm,e:{x:number;z:number;width:number;depth:number;id?:string}){
 if(!c.world.entities.some(p=>p.kind==='parcel'&&p.realm===realm&&p.status==='active'&&contains(bounds(p.polygon),e)&&contains(bounds(p.polygon),{x:e.x+e.width,z:e.z+e.depth})))return fail('PLAN_EXCEEDS_PARCEL');
 if(surfaceBlocked(c,realm,e,e.id))return fail('WORLD_COLLISION');flatHeight(c,realm,e);
}
export function horticulture(c:WorldContext,op:string,p:Record<string,unknown>,q:WorldPatch,realm:Realm,t:WorldTools):boolean{
 if(op==='vegetation_buy'||op==='farm_plot_buy'){
  if(c.world.entities.filter(e=>e.kind==='decoration'&&e.realm===realm&&e.status==='active'&&(e.species||e.farm)).length>=256)return fail('WORLD_LIMIT');
  const plant=op==='vegetation_buy'?VEGETATION.find(v=>v.id===p.item):null,plot=op==='farm_plot_buy'?FARM_PLOTS.find(v=>v.id===p.item):null,item=plant??plot;if(!item)return fail('PLANT_NOT_FOUND');
  const e:Decoration={...t.base(c,realm,'decoration',item.ar),kind:'decoration',type:plant?'vegetation':'farm_plot',x:numeric(p,'x',0,WORLD_LIMIT),z:numeric(p,'z',0,WORLD_LIMIT),width:item.width,depth:item.depth,material:'forest',...(plant?{species:plant.id}:{farm:{plot:plot!.id,cycle:0,crop:null,produce:{},harvests:0}})};
  fit(c,realm,e);t.bill(c,q,e,plant?'vegetation:planting':'agriculture:plot',item.en+' incl. planting / preparation',priced(1,item.price));q.upsert.push(e);q.result={entity_id:e.id,item:item.id};return true;
 }
 if(op==='decoration_move'||op==='decoration_demolish'){
  const original=c.world.entities.find(e=>e.id===p.entity_id&&e.kind==='decoration');if(original?.kind!=='decoration'||!original.species&&!original.farm)return false;
  const e=structuredClone(owned(c,p.entity_id,'decoration',realm));
  if(op==='decoration_move'){e.x=numeric(p,'x',0,WORLD_LIMIT);e.z=numeric(p,'z',0,WORLD_LIMIT);fit(c,realm,e);t.bill(c,q,e,'horticulture:relocation:'+crypto.randomUUID(),'Paid relocation / replanting',priced(e.width*e.depth,100));e.version++;q.upsert.push(e);}
  else{if(e.farm&&(e.farm.crop&&!e.farm.crop.harvested_at||Object.values(e.farm.produce).some(n=>n>0))&&p.discard_produce!==true)return fail('FARM_CONTENTS_CONFIRMATION');t.destroy(c,q,e.id);q.retire.push(e.id);q.result.discarded=e.farm??null;}
  q.result.entity_id=e.id;return true;
 }
 if(!['crop_plant','crop_water','crop_harvest','crop_clear','farm_sell'].includes(op))return false;
 const e=structuredClone(owned(c,p.entity_id,'decoration',realm)),farm=e.farm;if(!farm||e.type!=='farm_plot')return fail('FARM_PLOT_REQUIRED');
 if(op==='crop_plant'){
  if(farm.crop&&!farm.crop.harvested_at)return fail('CROP_ALREADY_PLANTED');const crop=CROPS.find(v=>v.id===p.crop_id&&v.plot===farm.plot);if(!crop)return fail('CROP_NOT_COMPATIBLE');
  t.bill(c,q,e,'agriculture:seed:'+crypto.randomUUID(),crop.en+' seeds / planting',priced(1,crop.seed));farm.cycle++;farm.crop={id:crop.id,planted_at:c.now,waterings:0,harvested_at:null};
 }else if(op==='farm_sell'){
  if(realm!=='main')return fail('YUYI_GRANT_ONLY');const crop=CROPS.find(v=>v.id===p.crop_id);if(!crop)return fail('PLANT_NOT_FOUND');const requested=integer(p,'quantity',1,10000),available=farm.produce[crop.id]??0;if(requested>available)return fail('PRODUCE_UNAVAILABLE');
  const allowance=passiveRemaining(c.eligible_income,c.income_paid),unit=BigInt(crop.unit)*100n,sold=Math.min(requested,Number(allowance/unit));if(sold<1)return fail('PASSIVE_CAP');t.bill(c,q,e,'agriculture:sale:'+crypto.randomUUID(),'Harvest market commission',priced(1,25));farm.produce[crop.id]-=sold;q.income={amount:money(BigInt(sold)*unit)};q.result={sold,income:q.income.amount,requested,shared_cap:'20% eligible / 24h, max 60; shared with all businesses'};
 }else{
  const crop=CROPS.find(v=>v.id===farm.crop?.id);if(!crop||!farm.crop)return fail('CROP_NOT_PLANTED');
  if(op==='crop_clear'){t.bill(c,q,e,'agriculture:clear:'+crypto.randomUUID(),'Crop clearing',priced(1,100));farm.crop=null;}
  else{if(farm.crop.harvested_at)return fail('ALREADY_HARVESTED');if(op==='crop_water'){if(farm.crop.waterings>=crop.waterings)return fail('WATER_NOT_NEEDED');t.bill(c,q,e,'agriculture:water:'+crypto.randomUUID(),'Irrigation service',priced(1,50));farm.crop.waterings++;}
   else{if(!farmProgress(farm,c.now).ready)return fail('CROP_NOT_READY');t.bill(c,q,e,'agriculture:harvest:'+crypto.randomUUID(),'Harvest labour',priced(1,50));farm.crop.harvested_at=c.now;farm.harvests++;farm.produce[crop.id]=(farm.produce[crop.id]??0)+crop.yield;q.result.harvested=crop.yield;}}
 }
 e.version++;q.upsert.push(e);q.result={...q.result,entity_id:e.id,farm};return true;
}
