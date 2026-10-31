import type {Building,DistrictMetrics,Network,NetworkEdge,NetworkNode,Point,Realm,TransitLine,WorldContext} from './world-types.ts';
import {worldHour} from './world-environment.ts';
import {amount,buildingRect,contains,distance,pointOnOwnedLand} from './world-math.ts';

export interface Graph {nodes:Map<string,NetworkNode>;edges:Map<string,{to:string;edge:NetworkEdge;cost:number}[]>}
export function graph(c:WorldContext,realm:Realm,network:Network):Graph{
 const nodes=new Map(c.world.entities.filter((e):e is NetworkNode=>e.kind==='node'&&e.status==='active'&&e.realm===realm&&e.network===network).map(n=>[n.id,n]));const edges=new Map<string,{to:string;edge:NetworkEdge;cost:number}[]>();
 for(const e of c.world.entities){if(e.kind!=='edge'||e.status!=='active'||e.realm!==realm||e.network!==network||e.blocked||!nodes.has(e.from)||!nodes.has(e.to))continue;const length=distance(nodes.get(e.from)!,nodes.get(e.to)!);edges.set(e.from,[...(edges.get(e.from)??[]),{to:e.to,edge:e,cost:length/Math.max(1,e.speed)}]);if(!e.directed)edges.set(e.to,[...(edges.get(e.to)??[]),{to:e.from,edge:e,cost:length/Math.max(1,e.speed)}]);}
 return {nodes,edges};
}
export function shortestPath(g:Graph,from:string,to:string):{nodes:string[];cost:number}|null{
 if(!g.nodes.has(from)||!g.nodes.has(to))return null;const costs=new Map([[from,0]]),previous=new Map<string,string>(),open=new Set([from]);
 while(open.size){let current='';let cost=Infinity;for(const id of open){const n=costs.get(id)!;if(n<cost){current=id;cost=n;}}open.delete(current);if(current===to){const nodes=[to];while(nodes[0]!==from)nodes.unshift(previous.get(nodes[0])!);return {nodes,cost};}for(const n of g.edges.get(current)??[]){const candidate=cost+n.cost;if(candidate<(costs.get(n.to)??Infinity)){costs.set(n.to,candidate);previous.set(n.to,current);open.add(n.to);}}}
 return null;
}
export function entrance(b:Building):Point{return b.rotation===90?{x:b.x+b.depth+.5,z:b.z+b.width/2}:{x:b.x+b.width/2,z:b.z-.5};}
export function walkingPath(c:WorldContext,realm:Realm,from:Point,to:Point):Point[]|null{
 const key=(x:number,z:number)=>x+','+z,start={x:Math.floor(from.x),z:Math.floor(from.z)},end={x:Math.floor(to.x),z:Math.floor(to.z)};const queue=[start],prev=new Map<string,string|null>([[key(start.x,start.z),null]]);const buildings=c.world.entities.filter((e):e is Building=>e.kind==='building'&&e.realm===realm&&e.status==='active');
 const free=(x:number,z:number)=>pointOnOwnedLand(c,realm,{x:x+.5,z:z+.5})&&!buildings.some(b=>contains(buildingRect(b),{x:x+.5,z:z+.5}))&&!c.legacy.some(b=>b.realm===realm&&contains(b,{x:x+.5,z:z+.5}));
 for(let i=0;i<queue.length&&i<4225;i++){const at=queue[i];if(at.x===end.x&&at.z===end.z){const points:Point[]=[to];let k:string|null=key(at.x,at.z);while(k){const [x,z]=k.split(',').map(Number);points.unshift({x:x+.5,z:z+.5});k=prev.get(k)??null;}points[0]=from;return points;}
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=at.x+dx,z=at.z+dz,k=key(x,z);if(prev.has(k)||!free(x,z))continue;prev.set(k,key(at.x,at.z));queue.push({x,z});}
 }
 return null;
}
export function transitPath(c:WorldContext,line:TransitLine):{points:Point[];length:number;nodes:string[]}|null{
 if(!line.enabled||line.stops.length<2)return null;const g=graph(c,line.realm,line.mode==='bus'?'road':'metro');const ids:string[]=[];
 for(let i=1;i<line.stops.length;i++){const p=shortestPath(g,line.stops[i-1],line.stops[i]);if(!p)return null;ids.push(...(i===1?p.nodes:p.nodes.slice(1)));}
 const points=ids.map(id=>g.nodes.get(id)!);return {points,length:points.slice(1).reduce((sum,p,i)=>sum+distance(points[i],p),0),nodes:ids};
}
export function serviceFlow(c:WorldContext,realm:Realm,network:'power'|'water'|'sewage',hour:number):Set<string>{
 const g=graph(c,realm,network),available=new Map<string,number>(),edgeLeft=new Map<string,number>();
 const sources=[...g.nodes.values()].filter(n=>network==='power'?['plant','solar','battery'].includes(n.role):network==='water'?['tank','pump'].includes(n.role):n.role==='treatment');
 for(const n of g.nodes.values())available.set(n.id,n.role==='solar'?n.capacity*Math.max(0,Math.sin((hour-6)*Math.PI/12))*(c.world.settings.weather==='rain'?.35:c.world.settings.weather==='clouds'?.65:1):n.role==='battery'?(n.energy>0?n.capacity:0):n.capacity);
 for(const list of g.edges.values())for(const {edge}of list)edgeLeft.set(edge.id,edge.capacity);
 const served=new Set<string>();
 for(const consumer of [...g.nodes.values()].filter(n=>n.role==='consumer'||n.role==='streetlight').sort((a,b)=>a.id.localeCompare(b.id))){
  const beforeCapacity=new Map(available),beforeEdges=new Map(edgeLeft);let needed=Math.max(1,consumer.demand);const original=needed;
  for(const source of sources){const p=shortestPath(g,source.id,consumer.id);if(!p)continue;let capacity=available.get(source.id)??0;const routeEdges:NetworkEdge[]=[];for(let i=1;i<p.nodes.length;i++){const e=g.edges.get(p.nodes[i-1])?.find(e=>e.to===p.nodes[i])?.edge;if(e){routeEdges.push(e);capacity=Math.min(capacity,edgeLeft.get(e.id)??0);}const n=g.nodes.get(p.nodes[i])!;if(n.role==='transformer'||n.role==='pump')capacity=Math.min(capacity,available.get(n.id)??0);}
   const flow=Math.min(needed,Math.max(0,capacity));if(flow<=0)continue;needed-=flow;available.set(source.id,(available.get(source.id)??0)-flow);for(const e of routeEdges)edgeLeft.set(e.id,(edgeLeft.get(e.id)??0)-flow);for(const id of p.nodes.slice(1)){const n=g.nodes.get(id)!;if(n.role==='transformer'||n.role==='pump')available.set(id,(available.get(id)??0)-flow);}if(needed<=.0001)break;
  }
  if(needed<.0001&&original>0)served.add(consumer.building_id??consumer.id);else{for(const [id,value]of beforeCapacity)available.set(id,value);for(const [id,value]of beforeEdges)edgeLeft.set(id,value);}
 }
 return served;
}
export function signalAllows(node:NetworkNode,from:Point,to:Point,seconds:number,waited=0):boolean{
 const s=node.signal;if(!s)return true;if(s.mode==='stop')return waited>=2;if(s.mode==='yield')return waited>=.5;
 const cycle=s.ns_green+s.ew_green+2*s.all_red,t=((seconds+s.offset)%cycle+cycle)%cycle,ns=Math.abs(to.z-from.z)>=Math.abs(to.x-from.x);
 return ns?t<s.ns_green:t>=s.ns_green+s.all_red&&t<s.ns_green+s.all_red+s.ew_green;
}
export function travel(c:WorldContext,realm:Realm,from:Point,to:Point):{points:Point[];seconds:number;mode:'walk'|'transit';line_id:string|null}|null{
 const direct=walkingPath(c,realm,from,to);let best=direct?{points:direct,seconds:direct.length/1.2,mode:'walk' as 'walk'|'transit',line_id:null as string|null}:null;
 for(const line of c.world.entities){if(line.kind!=='line'||line.realm!==realm||line.status!=='active')continue;const route=transitPath(c,line);if(!route)continue;const g=graph(c,realm,line.mode==='bus'?'road':'metro');for(let i=0;i<line.stops.length;i++)for(let j=i+1;j<line.stops.length;j++){const start=g.nodes.get(line.stops[i])!,end=g.nodes.get(line.stops[j])!;if(distance(from,start)>10||distance(to,end)>10)continue;const access=walkingPath(c,realm,from,start),exit=walkingPath(c,realm,end,to),ride=shortestPath(g,start.id,end.id);if(!access||!exit||!ride)continue;const seconds=access.length/1.2+exit.length/1.2+ride.cost+Math.min(10,line.depart_every/2);if(!best||seconds<best.seconds)best={points:[...access,...ride.nodes.map(id=>g.nodes.get(id)!),...exit],seconds,mode:'transit',line_id:line.id};}}
 return best;
}
export function metrics(c:WorldContext,realm:Realm,parcelIds?:string[]):DistrictMetrics{
 const buildings=c.world.entities.filter((e):e is Building=>e.kind==='building'&&e.realm===realm&&e.status==='active'&&!!e.opened_at);const homes=buildings.filter(b=>['house','villa'].includes(b.archetype)&&(!parcelIds||parcelIds.includes(b.parcel_id)));const population=homes.reduce((n,b)=>n+b.floors.reduce((s,f)=>s+f.rooms.filter(r=>r.use==='bedroom').reduce((a,r)=>a+r.capacity,0),0),0);const hour=worldHour(c);
 const powered=c.world.settings.infrastructure?serviceFlow(c,realm,'power',hour):new Set(buildings.map(b=>b.id)),watered=c.world.settings.infrastructure?serviceFlow(c,realm,'water',hour):new Set(buildings.map(b=>b.id)),sewage=c.world.settings.infrastructure?serviceFlow(c,realm,'sewage',hour):new Set(buildings.map(b=>b.id));
 const lines=c.world.entities.filter((e):e is TransitLine=>e.kind==='line'&&e.realm===realm&&e.status==='active'),transit_valid=Object.fromEntries(lines.map(l=>[l.id,!!transitPath(c,l)]));const schools=buildings.filter(b=>['school','university'].includes(b.archetype)),clinics=buildings.filter(b=>['clinic','hospital'].includes(b.archetype));const coverage:Record<string,number>={};
 const service=(b:Building,providers:Building[])=>{let best=0;for(const provider of providers){if(!powered.has(provider.id)||!watered.has(provider.id))continue;const p=travel(c,realm,entrance(b),entrance(provider));if(!p||p.seconds>45)continue;best=Math.max(best,Math.max(0,1-p.seconds/60)*Math.min(1,provider.capacity*Math.max(1,provider.staff/2)/Math.max(1,population)));}return best;};
 let parks=0,transport=0,power=0,water=0,education=0,health=0,leisure=0;
 for(const home of homes){const p=entrance(home),parkScore=c.world.entities.filter(e=>e.kind==='decoration'&&e.realm===realm&&e.status==='active'&&['park','tree','fountain'].includes(e.type)).reduce((sum,e)=>sum+Math.max(0,1-distance(p,e as Point)/12)*(e.kind==='decoration'&&e.type==='park'?1:.2),0)+c.legacy.filter(e=>e.realm===realm&&['tree','palm','park'].includes(e.catalog_id)).reduce((sum,e)=>sum+Math.max(0,1-distance(p,e)/12)*.2,0);
  parks+=Math.min(1,parkScore);power+=Number(powered.has(home.id));water+=Number(watered.has(home.id)&&sewage.has(home.id));const school=service(home,schools),clinic=service(home,clinics);education+=school;health+=clinic;coverage[home.id+':education']=school;coverage[home.id+':health']=clinic;
  transport+=Number(lines.some(l=>transit_valid[l.id]&&l.stops.some(id=>{const n=c.world.entities.find(e=>e.id===id);return n?.kind==='node'&&distance(p,n)<=8;})));leisure+=Number(buildings.some(b=>['mall','restaurant','museum'].includes(b.archetype)&&distance(p,entrance(b))<12));
 }
 const n=Math.max(1,homes.length),roadCapacity=c.world.entities.filter((e):e is NetworkEdge=>e.kind==='edge'&&e.realm===realm&&e.network==='road'&&!e.blocked&&e.status==='active').reduce((s,e)=>s+e.lanes*8,0),traffic=!c.world.settings.simulate_residents||!roadCapacity?1:Math.max(0,1-population/(roadCapacity*2));
 const breakdown={parks:Math.round(parks/n*100),transport:Math.round(transport/n*100),power:Math.round(power/n*100),water:Math.round(water/n*100),education:Math.round(education/n*100),health:Math.round(health/n*100),traffic:Math.round(traffic*100),leisure:Math.round(leisure/n*100)};
 const score=population?Math.min(100,Math.round(20+breakdown.parks*.2+breakdown.transport*.1+breakdown.power*.12+breakdown.water*.12+breakdown.education*.08+breakdown.health*.08+breakdown.traffic*.05+breakdown.leisure*.05)):null;
 return {realm,population,score,breakdown,powered:[...powered],watered:[...watered],sewage:[...sewage],unpowered:buildings.filter(b=>!powered.has(b.id)).map(b=>b.id),transit_valid,service_coverage:coverage};
}
export function passiveRemaining(eligible:string,paid:string):bigint{const maximum=amount(eligible)*20n/100n,cap=maximum<600000n?maximum:600000n,remaining=cap-amount(paid);return remaining>0n?remaining:0n;}
