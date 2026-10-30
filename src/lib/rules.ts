import type {CatalogItem,Placement,Prayer} from './types';
export const PRAYER_REWARDS:Record<Prayer,number>={fajr:30,dhuhr:20,asr:20,maghrib:20,isha:20};
export const levelFromXp=(xp:number)=>Math.floor(Math.sqrt(Math.max(0,xp)/100))+1;
export function localDay(now:Date,timezone:string){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function footprint(item:CatalogItem,rotation:number){return rotation===90||rotation===270?[item.footprint_z,item.footprint_x]:[item.footprint_x,item.footprint_z];}
export function canPlace(item:CatalogItem,x:number,z:number,rotation:number,size:number,placements:Placement[],catalog:CatalogItem[],exclude?:string){
 if(!Number.isInteger(x)||!Number.isInteger(z)||![0,90,180,270].includes(rotation))return false;
 const [w,d]=footprint(item,rotation);if(x<0||z<0||x+w>size||z+d>size)return false;
 return !placements.filter(p=>p.id!==exclude).some(p=>{const other=catalog.find(v=>v.id===p.catalog_id);if(!other)return true;const [ow,od]=footprint(other,p.rotation);return x<p.x+ow&&x+w>p.x&&z<p.z+od&&z+d>p.z;});
}
