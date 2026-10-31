import type {GameSnapshot,Placement} from './types';
import type {Parcel,Rect,Realm,WorldEntity} from '../../supabase/functions/_shared/world-types';
import {bounds,flatHeight,overlap,polygon,surfaceBlocked} from '../../supabase/functions/_shared/world-math';
import {viewWorldContext} from './world-state';
import {ApiError} from './errors';
export function validateGuestLegacy(s:GameSnapshot,action:string,p:Record<string,unknown>){
 if(!s.world_systems?.initialized||!['place','move','yuyi_place','yuyi_move'].includes(action))return;const realm:Realm=action.startsWith('yuyi_')?'yuyi':'main',placements=realm==='main'?s.placements:s.v6?.yuyi_placements??[],inventory=realm==='main'?s.inventory:s.v6?.yuyi_inventory??[],old=placements.find(v=>v.id===p.placement_id),item=s.catalog.find(v=>v.id===(old?.catalog_id??inventory.find(v=>v.id===p.inventory_id)?.catalog_id));if(!item)return;
 const rotation=Number(p.rotation),r={x:Number(p.x),z:Number(p.z),width:rotation%180?item.footprint_z:item.footprint_x,depth:rotation%180?item.footprint_x:item.footprint_z};if(![r.x,r.z,rotation].every(Number.isFinite))return;
 const c=viewWorldContext(s);c.legacy=c.legacy.filter(v=>v.id!==old?.id);if(surfaceBlocked(c,realm,r))throw new ApiError('WORLD_COLLISION');if(!['nature','water'].includes(item.category))flatHeight(c,realm,r);
}
function subtract(a:Rect,b:Rect):Rect[]{if(!overlap(a,b))return [a];const ix=Math.max(a.x,b.x),iz=Math.max(a.z,b.z),ex=Math.min(a.x+a.width,b.x+b.width),ez=Math.min(a.z+a.depth,b.z+b.depth),list:Rect[]=[];if(ix>a.x)list.push({...a,width:ix-a.x});if(ex<a.x+a.width)list.push({...a,x:ex,width:a.x+a.width-ex});if(iz>a.z)list.push({x:ix,z:a.z,width:ex-ix,depth:iz-a.z});if(ez<a.z+a.depth)list.push({x:ix,z:ez,width:ex-ix,depth:a.z+a.depth-ez});return list;}
/** Compatibility for the explicit guest only; production uses SQL triggers in the same transaction. */
export function recordGuestLegacy(s:GameSnapshot,action:string,oldSize:number){
 const w=s.world_systems;if(!w?.initialized)return;const added:WorldEntity[]=[];
 if(action==='land_expand'&&s.world.size>oldSize){const size=s.world.size;let rectangles=[{x:oldSize,z:0,width:size-oldSize,depth:size},{x:0,z:oldSize,width:oldSize,depth:size-oldSize}];for(const e of w.entities)if(e.kind==='parcel'&&e.realm==='main'&&e.status==='active')rectangles=rectangles.flatMap(v=>subtract(v,bounds(e.polygon)));
  for(const r of rectangles){const parcel:Parcel={id:crypto.randomUUID(),realm:'main',kind:'parcel',name:'توسعة الأرض الأصلية',version:1,status:'active',created_at:s.server_now,polygon:polygon(r),initial:true,zone:'mixed',title_history:[{action:'legacy_paid_expansion',at:s.server_now,parents:[]}],factors:{base_per_m2:'0.0000',waterfront:1,road_access:1,capacity:1},financing:null};added.push(parcel);}w.entities.push(...added);w.revision++;
 }
 if(added.length||['place','move','remove','demolish','yuyi_place','yuyi_move','yuyi_remove'].includes(action))w.history=[{id:crypto.randomUUID(),title:added.length?'توسعة أرض محفوظة':'تعديل عنصر في المدينة',created_at:s.server_now,realm:action.startsWith('yuyi_')?'yuyi':'main',delta:{upsert:structuredClone(added),retire:[]},placements:structuredClone(s.placements) as Placement[],yuyi_placements:structuredClone(s.v6?.yuyi_placements??[]) as Placement[]},...(w.history??[])];
}
