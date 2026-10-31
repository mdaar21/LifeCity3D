import type {GameSnapshot} from '../lib/types';
import type {WorldEntity,Realm,Point} from '../../supabase/functions/_shared/world-types';
import {bounds,contains} from '../../supabase/functions/_shared/world-math';
import type {Target,TouchDraft} from './useTouchTools';
import {footprint} from './building';
export function moveDraft(game:GameSnapshot,target:Target):TouchDraft|null{
 if(target.source!=='world'){const p=(target.source==='interior'?game.furniture:target.realm==='main'?game.placements:game.v6?.yuyi_placements??[]).find(v=>v.id===target.id),item=game.catalog.find(v=>v.id===p?.catalog_id);if(!p||!item)return null;const [width,depth]=footprint(item,p.rotation);return {operation:target.source==='interior'?'legacy_interior_move':'legacy_move',request:{placement_id:p.id,expected_version:p.version},catalogId:item.id,x:p.x,z:p.z,width,depth,rotation:p.rotation};}
 const e=game.world_systems?.entities.find(e=>e.id===target.id);if(!e)return null;
 if(e.kind==='building')return {operation:'building_move',request:{building_id:e.id,parcel_id:e.parcel_id},x:e.x,z:e.z,width:e.rotation===90?e.depth:e.width,depth:e.rotation===90?e.width:e.depth,rotation:e.rotation};
 if(e.kind==='decoration')return {operation:'decoration_move',request:{entity_id:e.id},x:e.x,z:e.z,width:e.width,depth:e.depth,rotation:0};
 if(e.kind==='node'&&e.role!=='consumer')return {operation:'node_move',request:{node_id:e.id},x:e.x,z:e.z,width:.4,depth:.4,rotation:0};
 if(e.kind==='furniture'){const b=game.world_systems?.entities.find(b=>b.id===e.building_id);if(b?.kind!=='building')return null;return {operation:'furniture_place',request:{furniture_id:e.id,building_id:b.id,room_id:e.room_id,floor:e.floor},x:e.x,z:e.z,width:e.rotation%180?e.depth:e.width,depth:e.rotation%180?e.width:e.depth,rotation:e.rotation};}
 return null;
}
export function requestFor(d:TouchDraft,game:GameSnapshot,realm:Realm){const request:Record<string,unknown>={...d.request,x:d.x,z:d.z,rotation:d.rotation};if(d.operation==='furniture_place'){const b=game.world_systems?.entities.find(e=>e.id===request.building_id);if(b?.kind==='building'){const room=b.floors.find(f=>f.index===request.floor)?.rooms.find(r=>contains(r,d,.08)&&contains(r,{x:d.x+d.width,z:d.z+d.depth},.08));if(room)request.room_id=room.id;}}if(d.operation==='road_draw')return {...request,points:d.points??[]};if(['building_start','building_move'].includes(d.operation)){const p=game.world_systems?.entities.find(e=>e.kind==='parcel'&&e.realm===realm&&e.status==='active'&&contains(bounds(e.polygon),d)&&contains(bounds(e.polygon),{x:d.x+d.width,z:d.z+d.depth}));if(p)request.parcel_id=p.id;}return request;}
export function canRotate(d:TouchDraft){return d.operation.startsWith('legacy_')||d.operation==='furniture_place'||d.operation==='building_start'||d.operation==='building_move';}
export function targetEntity(game:GameSnapshot,t:Target|null):WorldEntity|undefined{return t?.source==='world'?game.world_systems?.entities.find(e=>e.id===t.id&&e.realm===t.realm&&e.status==='active'):undefined;}
export function snapPoint(p:Point,step=1):Point{return {x:Math.round(p.x/step)*step,z:Math.round(p.z/step)*step};}
