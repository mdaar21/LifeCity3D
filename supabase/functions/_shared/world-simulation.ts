import type {Point,Realm,WorldContext} from './world-types.ts';
import {distance,buildingRect,pointOnOwnedLand} from './world-math.ts';
import {graph,shortestPath,signalAllows,transitPath,travel,entrance,walkingPath} from './world-networks.ts';
export interface SimAgent {id:string;kind:'person'|'car'|'bus'|'metro';points:Point[];node_ids:string[];at:number;progress:number;waited:number;wait_until:number;x:number;z:number;heading:number;speed:number;color:string;home_id?:string;hidden?:boolean;moving?:boolean}
export function agentsFor(c:WorldContext,realm:Realm):SimAgent[]{
 const cap=c.world.settings.quality==='low'?12:32,result:SimAgent[]=[];
 const make=(id:string,kind:SimAgent['kind'],points:Point[],node_ids:string[],speed:number,color:string):SimAgent=>({id,kind,points,node_ids,at:0,progress:0,waited:0,wait_until:0,x:points[0].x,z:points[0].z,heading:0,speed,color});
 const buildings=c.world.entities.filter(v=>v.kind==='building'&&v.realm===realm&&v.status==='active'&&v.opened_at),homes=[...buildings.filter(v=>v.kind==='building'&&['house','villa'].includes(v.archetype)).map(v=>{if(v.kind!=='building')throw Error('BUILDING_EXPECTED');return {id:v.id,rect:buildingRect(v),point:entrance(v),opened_at:v.opened_at!};}),...c.legacy.filter(v=>v.realm===realm&&['house','villa','apartment','palace'].includes(v.catalog_id)).map(v=>({id:v.id,rect:v,point:{x:v.x+v.width/2,z:v.z-.5},opened_at:c.now}))],destinations=buildings.filter(v=>v.kind==='building'&&!['house','villa','garage'].includes(v.archetype));
 for(const [i,home]of homes.entries()){
  if(result.length>=cap)break;let start=home.point;if(!pointOnOwnedLand(c,realm,start)){const r=home.rect;start=[{x:r.x+r.width+.5,z:r.z+r.depth/2},{x:r.x-.5,z:r.z+r.depth/2},{x:r.x+r.width/2,z:r.z+r.depth+.5}].find(p=>pointOnOwnedLand(c,realm,p))??start;}const target=destinations[i%Math.max(1,destinations.length)];
  let points:Point[]|null=target?.kind==='building'?travel(c,realm,start,entrance(target))?.points??null:null;
  if(!points){const r=home.rect,candidates=[{x:r.x+r.width+.75,z:r.z-.75},{x:r.x-.75,z:r.z-.75},{x:r.x+r.width+.75,z:r.z+r.depth+.75},{x:r.x-.75,z:r.z+r.depth+.75}];
   for(const goal of candidates){if(!pointOnOwnedLand(c,realm,goal))continue;const route=walkingPath(c,realm,start,goal);if(route&&route.length>2){points=route;break;}}}
  const route=points&&points.length>1?[...points,...points.slice(0,-1).reverse()]:[start,start];
  const resident=make(home.id+':resident','person',route,[],1.15,['#557d8b','#a47967','#72976a','#a28b56'][i%4]);resident.home_id=home.id;resident.wait_until=Date.parse(home.opened_at!)/1000+3+i%5;resident.hidden=!points;result.push(resident);
 }
 if(!c.world.settings.simulate_residents)return result;
 const roads=graph(c,realm,'road'),ids=[...roads.nodes.keys()].sort();
 for(let i=0;i<Math.min(cap-result.length,ids.length,8);i++){const start=ids[i],end=ids[(i+Math.floor(ids.length/2))%ids.length],there=shortestPath(roads,start,end),back=shortestPath(roads,end,start);if(!there||!back||there.nodes.length<2)continue;const route=[...there.nodes,...back.nodes.slice(1)];result.push(make(start+':traffic','car',route.map(id=>roads.nodes.get(id)!),route,3.3+i%3,['#b9a578','#8aa8ae','#849a78'][i%3]));}
 for(const e of c.world.entities){if(result.length>=cap||e.kind!=='line'||e.realm!==realm||e.status!=='active')continue;const route=transitPath(c,e);if(!route)continue;const g=graph(c,realm,e.mode==='bus'?'road':'metro'),back=shortestPath(g,e.stops.at(-1)!,e.stops[0]);if(!back)continue;const ids=[...route.nodes,...back.nodes.slice(1)],agent=make(e.id,e.mode==='bus'?'bus':'metro',ids.map(id=>g.nodes.get(id)!),ids,e.mode==='bus'?4:7,e.color);agent.wait_until=Math.floor(Date.parse(c.now)/1000/e.depart_every)*e.depart_every+e.depart_every;result.push(agent);}
 return result;
}
/** Fixed-step traffic: no backend transform writes, red-light and queue behavior are real. */
export function tickAgents(agents:SimAgent[],c:WorldContext,realm:Realm,dt:number,seconds:number){
 const roads=graph(c,realm,'road');
 for(const a of agents){a.moving=false;if(seconds<a.wait_until){if(a.kind==='person')a.hidden=a.at===0;continue;}if(a.kind==='person')a.hidden=false;if(a.points.length<2)continue;const from=a.points[a.at],to=a.points[(a.at+1)%a.points.length],length=distance(from,to);if(length<.01){a.at=(a.at+1)%(a.points.length-1);a.progress=0;continue;}
  const node=a.kind==='car'||a.kind==='bus'?roads.nodes.get(a.node_ids[(a.at+1)%a.node_ids.length]):null;
  const approaching=length-a.progress<Math.max(.8,a.speed*dt+1),allowed=!node||signalAllows(node,from,to,seconds,a.waited);
  const queue=a.kind!=='person'&&agents.some(b=>b!==a&&b.kind!=='person'&&Math.hypot(a.x-b.x,a.z-b.z)<2.4&&(b.x-a.x)*(to.x-from.x)+(b.z-a.z)*(to.z-from.z)>.05);
  if(approaching&&!allowed||queue){a.waited+=dt;continue;}
  a.moving=true;a.progress=Math.min(length,a.progress+a.speed*dt);const t=a.progress/length;a.x=from.x+(to.x-from.x)*t;a.z=from.z+(to.z-from.z)*t;a.heading=Math.atan2(to.x-from.x,to.z-from.z);
  if(a.progress>=length){a.at=(a.at+1)%(a.points.length-1);a.progress=0;a.waited=0;if(a.kind==='person'&&(a.at===0||a.at===Math.floor(a.points.length/2))){a.wait_until=seconds+(a.at===0?16:4);a.hidden=a.at===0;}}
 }
}
