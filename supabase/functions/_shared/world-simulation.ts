import type {Point,Realm,WorldContext} from './world-types.ts';
import {distance} from './world-math.ts';
import {graph,shortestPath,signalAllows,transitPath,travel,entrance} from './world-networks.ts';
export interface SimAgent {id:string;kind:'person'|'car'|'bus'|'metro';points:Point[];node_ids:string[];at:number;progress:number;waited:number;wait_until:number;x:number;z:number;heading:number;speed:number;color:string}
export function agentsFor(c:WorldContext,realm:Realm):SimAgent[]{
 if(!c.world.settings.simulate_residents)return [];const cap=c.world.settings.quality==='low'?12:32,result:SimAgent[]=[];
 const make=(id:string,kind:SimAgent['kind'],points:Point[],node_ids:string[],speed:number,color:string):SimAgent=>({id,kind,points,node_ids,at:0,progress:0,waited:0,wait_until:0,x:points[0].x,z:points[0].z,heading:0,speed,color});
 const buildings=c.world.entities.filter(v=>v.kind==='building'&&v.realm===realm&&v.status==='active'&&v.opened_at),homes=buildings.filter(v=>v.kind==='building'&&['house','villa'].includes(v.archetype)),destinations=buildings.filter(v=>v.kind==='building'&&!['house','villa','garage'].includes(v.archetype));
 for(const [i,home]of homes.entries()){if(result.length>=cap||home.kind!=='building')break;const target=destinations[i%Math.max(1,destinations.length)];if(target?.kind!=='building')continue;const route=travel(c,realm,entrance(home),entrance(target));if(!route||route.points.length<2)continue;result.push(make(home.id+':walk','person',[...route.points,...route.points.slice(0,-1).reverse()],[],1.2,'#74917a'));}
 const roads=graph(c,realm,'road'),ids=[...roads.nodes.keys()].sort();
 for(let i=0;i<Math.min(cap-result.length,ids.length,8);i++){const start=ids[i],end=ids[(i+Math.floor(ids.length/2))%ids.length],there=shortestPath(roads,start,end),back=shortestPath(roads,end,start);if(!there||!back||there.nodes.length<2)continue;const route=[...there.nodes,...back.nodes.slice(1)];result.push(make(start+':traffic','car',route.map(id=>roads.nodes.get(id)!),route,3.3+i%3,['#b9a578','#8aa8ae','#849a78'][i%3]));}
 for(const e of c.world.entities){if(result.length>=cap||e.kind!=='line'||e.realm!==realm||e.status!=='active')continue;const route=transitPath(c,e);if(!route)continue;const g=graph(c,realm,e.mode==='bus'?'road':'metro'),back=shortestPath(g,e.stops.at(-1)!,e.stops[0]);if(!back)continue;const ids=[...route.nodes,...back.nodes.slice(1)],agent=make(e.id,e.mode==='bus'?'bus':'metro',ids.map(id=>g.nodes.get(id)!),ids,e.mode==='bus'?4:7,e.color);agent.wait_until=Math.floor(Date.parse(c.now)/1000/e.depart_every)*e.depart_every+e.depart_every;result.push(agent);}
 return result;
}
/** Fixed-step traffic: no backend transform writes, red-light and queue behavior are real. */
export function tickAgents(agents:SimAgent[],c:WorldContext,realm:Realm,dt:number,seconds:number){
 const roads=graph(c,realm,'road');
 for(const a of agents){if(seconds<a.wait_until)continue;if(a.points.length<2)continue;const from=a.points[a.at],to=a.points[(a.at+1)%a.points.length],length=distance(from,to);if(length<.01){a.at=(a.at+1)%(a.points.length-1);a.progress=0;continue;}
  const node=a.kind==='car'||a.kind==='bus'?roads.nodes.get(a.node_ids[(a.at+1)%a.node_ids.length]):null;
  const approaching=length-a.progress<Math.max(.8,a.speed*dt+1),allowed=!node||signalAllows(node,from,to,seconds,a.waited);
  const queue=a.kind!=='person'&&agents.some(b=>b!==a&&b.kind!=='person'&&Math.hypot(a.x-b.x,a.z-b.z)<2.4&&(b.x-a.x)*(to.x-from.x)+(b.z-a.z)*(to.z-from.z)>.05);
  if(approaching&&!allowed||queue){a.waited+=dt;continue;}
  a.progress=Math.min(length,a.progress+a.speed*dt);const t=a.progress/length;a.x=from.x+(to.x-from.x)*t;a.z=from.z+(to.z-from.z)*t;a.heading=Math.atan2(to.x-from.x,to.z-from.z);
  if(a.progress>=length){a.at=(a.at+1)%(a.points.length-1);a.progress=0;a.waited=0;if(a.kind==='person'&&(a.at===0||a.at===Math.floor(a.points.length/2)))a.wait_until=seconds+12;}
 }
}
