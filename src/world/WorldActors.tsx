import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {PerspectiveCamera} from '@react-three/drei';
import {Group,Vector3} from 'three';
import {useGame} from '../lib/game';
import type {Appearance,Avatar,Car,Point,Realm,WorldContext} from '../../supabase/functions/_shared/world-types';
import {activeAvatar,CARS,interiorFree,outdoorFree,toLocal} from '../../supabase/functions/_shared/world-motion';
import {buildingRect,contains,heightAt,pointSegmentDistance,terrainAt} from '../../supabase/functions/_shared/world-math';
import {graph,walkingPath} from '../../supabase/functions/_shared/world-networks';
import {TextSurface} from './TextSurface';
import {Box} from './WorldGeometry';
import {useTouchTools} from './useTouchTools';
import {useWorldUI,worldRuntime} from './useWorldUI';
export function PersonMesh({appearance:a,moving=false,live=false}:{appearance:Appearance;moving?:boolean;live?:boolean}){
 const left=useRef<Group>(null),right=useRef<Group>(null);
 useFrame(({clock})=>{const swing=moving||live&&worldRuntime.moving?Math.sin(clock.elapsedTime*8)*.45:0;if(left.current)left.current.rotation.x=swing;if(right.current)right.current.rotation.x=-swing;});
 return <group><Box at={[0,.94,0]} size={[.43,.55,.25]} color={a.top}/>{a.outfit==='builder'&&<Box at={[0,.98,.14]} size={[.35,.4,.04]} color="#d4b56b"/>}{a.outfit==='formal'&&<Box at={[0,1.04,.14]} size={[.08,.32,.03]} color="#d0b372"/>}<mesh position={[0,1.44,0]} castShadow><sphereGeometry args={[.23,10,8]}/><meshStandardMaterial color={a.skin}/></mesh>{[-1,1].map(s=><Box key={s} at={[s*.085,1.47,.21]} size={[.045,.045,.03]} color="#2f4037"/>)}{a.hair!=='none'&&<mesh position={[0,a.hair==='long'?1.42:1.58,-.03]} scale={[1,a.hair==='long'?1.4:.65,1]}><sphereGeometry args={[.235,a.hair==='curly'?6:10,6]}/><meshStandardMaterial color={a.hair_color}/></mesh>}
  <group ref={left} position={[-.13,.68,0]}><Box at={[0,-.25,0]} size={[.16,.5,.19]} color={a.bottom}/><Box at={[0,-.52,.06]} size={[.18,.13,.29]} color={a.shoes}/></group><group ref={right} position={[.13,.68,0]}><Box at={[0,-.25,0]} size={[.16,.5,.19]} color={a.bottom}/><Box at={[0,-.52,.06]} size={[.18,.13,.29]} color={a.shoes}/></group>
  {[-1,1].map(s=><Box key={s} at={[s*.3,.94,0]} size={[.13,.48,.15]} color={a.top}/>)}
  {a.accessory==='cap'&&<><Box at={[0,1.65,0]} size={[.47,.13,.42]} color={a.top}/><Box at={[0,1.61,.22]} size={[.45,.04,.23]} color={a.top}/></>}{a.accessory==='glasses'&&[-1,1].map(s=><Box key={s} at={[s*.09,1.47,.21]} size={[.15,.09,.035]} color="#364944"/>)}{a.accessory==='backpack'&&<Box at={[0,.98,-.21]} size={[.36,.42,.22]} color="#9c8058"/>}
 </group>;
}
export function CarMesh({car}:{car:Car}){
 const model=CARS.find(v=>v.id===car.model)!,w=model.width,l=model.length;
 return <><Box at={[0,.42,0]} size={[w,.5,l]} color={car.paint}/><Box at={[0,.88,-l*.08]} size={[w*.85,.55,l*.5]} color={car.paint}/><Box at={[0,.95,l*.18]} size={[w*.8,.38,.04]} color="#708c91" opacity={1-car.tint/2}/><Box at={[0,.98,-l*.28]} size={[w*.8,.35,.04]} color="#708c91"/>{[-1,1].flatMap(x=>[-1,1].map(z=><mesh key={x+':'+z} position={[x*w*.49,.27,z*l*.31]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.28,.28,.18,car.rims==='sport'?12:8]}/><meshStandardMaterial color={car.rims==='classic'?'#c3bd9e':car.rims==='sport'?'#566b71':'#3c4945'}/></mesh>))}{[-1,1].map(s=><Box key={s} at={[s*w*.32,.5,l/2+.015]} size={[.25,.15,.04]} color="#f1d997" emissive/>)}<Box at={[0,.4,-l/2-.02]} size={[.45,.15,.04]} color="#dfdec7"/><TextSurface text={car.plate} width={.43} height={.14} position={[0,.4,-l/2-.043]} rotation={[0,Math.PI,0]}/>{car.trim!=='standard'&&<Box at={[0,.71,0]} size={[w*.6,.06,l*.32]} color={car.trim==='wood'?'#9b774d':'#b2b9b7'}/>}</>;
}
export function AvatarActor({avatar,realm}:{avatar:Avatar;realm:Realm}){
 const ref=useRef<Group>(null);useFrame(()=>{if(!ref.current)return;const p=worldRuntime.realm===realm&&worldRuntime.pose?worldRuntime.pose:avatar.pose;ref.current.position.set(p.x,p.y,p.z);ref.current.rotation.y=p.heading;});
 return <group ref={ref} position={[avatar.pose.x,avatar.pose.y,avatar.pose.z]} visible={avatar.mode!=='drive'&&avatar.mode!=='first'}><PersonMesh appearance={avatar.appearance} live/></group>;
}
export function CarActor({car,driven,realm}:{car:Car;driven:boolean;realm:Realm}){
 const ref=useRef<Group>(null);useFrame(()=>{if(!ref.current)return;const p=driven&&worldRuntime.realm===realm&&worldRuntime.pose?worldRuntime.pose:car.pose;ref.current.position.set(p.x,p.y,p.z);ref.current.rotation.y=p.heading;});
 return <group ref={ref} position={[car.pose.x,car.pose.y,car.pose.z]} rotation={[0,car.pose.heading,0]}><CarMesh car={car}/></group>;
}
export function PlayController({context,realm,offset,active}:{context:WorldContext;realm:Realm;offset:[number,number];active:boolean}){
 const toolOpen=useTouchTools(s=>s.sheet!==null||s.draft!==null||s.designOpen);
 const {mutate}=useGame(),invalidate=useThree(s=>s.invalidate),camera=useThree(s=>s.camera),uiOpen=useWorldUI(s=>s.open),input=useWorldUI(s=>s.input);
 const a=activeAvatar(context,realm),exploring=!!a&&a.mode!=='aerial';const live=useRef(context),actor=useRef(a),busy=useRef(false),trace=useRef<Point[]>([]),lastSample=useRef(0),lastSave=useRef(0),velocity=useRef(0),keys=useRef(new Set<string>()),path=useRef<Point[]>([]),target=useRef<Point|null>(null),disposed=useRef(false);
 const roads=useMemo(()=>graph(context,realm,'road'),[context,realm]);
 useEffect(()=>{const old=actor.current;live.current=context;actor.current=a;if(old?.mode!==a?.mode&&(old?.mode==='drive'||a?.mode==='drive')){path.current=[];target.current=null;worldRuntime.target=null;velocity.current=0;trace.current=[];useWorldUI.getState().set({input:{forward:0,turn:0,run:false}});}if(!worldRuntime.pose||worldRuntime.realm!==realm||old?.mode!==a?.mode||old?.inside_building!==a?.inside_building||old?.floor!==a?.floor||!busy.current&&!worldRuntime.moving){worldRuntime.realm=realm;worldRuntime.pose=a?{...a.pose}:null;trace.current=[];}invalidate();},[context,a,realm,invalidate]);
 useEffect(()=>{if(!active||!exploring)return;const pressed=keys.current;const down=(e:KeyboardEvent)=>{if(e.target instanceof HTMLElement&&e.target.closest('input,select,textarea,[role=dialog]'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D','Shift'].includes(e.key)){e.preventDefault();pressed.add(e.key.toLowerCase());invalidate();}};const up=(e:KeyboardEvent)=>{pressed.delete(e.key.toLowerCase());invalidate();};const blur=()=>{pressed.clear();useWorldUI.getState().set({input:{forward:0,turn:0,run:false}});invalidate();};addEventListener('keydown',down);addEventListener('keyup',up);addEventListener('blur',blur);return()=>{removeEventListener('keydown',down);removeEventListener('keyup',up);removeEventListener('blur',blur);pressed.clear();};},[active,exploring,invalidate]);
 useEffect(()=>{invalidate();},[input,uiOpen,toolOpen,invalidate]);
 useEffect(()=>{disposed.current=false;return()=>{disposed.current=true;worldRuntime.moving=false;};},[]);
 const save=()=>{const avatar=actor.current,pose=worldRuntime.pose;if(busy.current||!avatar||!pose||!trace.current.length||!active)return;const points=trace.current.splice(0,128);busy.current=true;lastSave.current=performance.now();void mutate('world_apply',{operation:avatar.mode==='drive'?'car_move':'avatar_move',expected_revision:live.current.world.revision,request:{realm,x:pose.x,z:pose.z,heading:pose.heading,trace:points}}).then(response=>{if(response.state?.world_systems){live.current={...live.current,world:response.state.world_systems};const next=activeAvatar(live.current,realm);actor.current=next;}}).catch(()=>{const current=activeAvatar(live.current,realm);if(current)worldRuntime.pose={...current.pose};path.current=[];worldRuntime.target=null;trace.current=[];velocity.current=0;}).finally(()=>{busy.current=false;if(!disposed.current)invalidate();});};
 useFrame((_,delta)=>{
  if(!active||!exploring||!a||!worldRuntime.pose||worldRuntime.realm!==realm)return;const dt=Math.min(.045,delta),pose=worldRuntime.pose,c=live.current;let forward=uiOpen||toolOpen?0:input.forward+(keys.current.has('w')||keys.current.has('arrowup')?1:0)-(keys.current.has('s')||keys.current.has('arrowdown')?1:0),turn=uiOpen||toolOpen?0:input.turn+(keys.current.has('a')||keys.current.has('arrowleft')?1:0)-(keys.current.has('d')||keys.current.has('arrowright')?1:0);const running=keys.current.has('shift')||input.run;if(uiOpen||toolOpen)velocity.current=0;
  if(worldRuntime.target!==target.current){target.current=worldRuntime.target;path.current=target.current?(a.inside_building?[target.current]:walkingPath(c,realm,pose,target.current)??[]):[];}
  if(forward||turn){path.current=[];target.current=null;worldRuntime.target=null;}
  if(!uiOpen&&!toolOpen&&path.current.length){const next=path.current[0],dx=next.x-pose.x,dz=next.z-pose.z;if(Math.hypot(dx,dz)<.25)path.current.shift();else{pose.heading=Math.atan2(dx,dz);forward=1;turn=0;}}
  pose.heading+=Math.max(-1,Math.min(1,turn))*dt*(a.mode==='drive'?(Math.abs(velocity.current)>.1?1.4:0):2.2);
  const car=a.vehicle_id?c.world.entities.find(e=>e.id===a.vehicle_id&&e.kind==='car'):null,model=car?.kind==='car'?CARS.find(v=>v.id===car.model):null;
  if(a.mode==='drive')velocity.current+=((forward>0?model?.speed??8:forward<0?-3:0)-velocity.current)*Math.min(1,dt*(forward?1.5:4));else velocity.current=forward*(running?4.2:2.7);
  const speed=velocity.current,next={x:pose.x+Math.sin(pose.heading)*speed*dt,z:pose.z+Math.cos(pose.heading)*speed*dt};
  const building=a.inside_building?c.world.entities.find(e=>e.id===a.inside_building&&e.kind==='building'):null,plan=building?.kind==='building'?building.floors.find(f=>f.index===a.floor):null;
  const free=(p:Point)=>building?.kind==='building'&&plan?interiorFree(plan,building.width,building.depth,toLocal(building,p)):outdoorFree(c,realm,p,a.mode==='drive'?(model?.width??1.4)/2:.24)&& (a.mode!=='drive'||c.world.settings.free_drive||[...roads.edges.values()].some(list=>list.some(({edge})=>pointSegmentDistance(p,roads.nodes.get(edge.from)!,roads.nodes.get(edge.to)!)<=(edge.directed?edge.lanes*1.6:edge.lanes*3)/2+.1)));
  const moved=Math.abs(speed)>.02&&free(next);if(moved){pose.x=next.x;pose.z=next.z;pose.y=building?.kind==='building'?building.y+a.floor*3:heightAt(terrainAt(c,realm),pose.x,pose.z)+(a.mode==='drive'?.12:0);}else if(Math.abs(speed)>.02){velocity.current=0;path.current=[];worldRuntime.target=null;}
  const now=performance.now();if(moved&&now-lastSample.current>100){trace.current.push({x:pose.x,z:pose.z});lastSample.current=now;}
  if(trace.current.length&&(!moved&&!turn||now-lastSave.current>2000))save();worldRuntime.moving=!!moved;
  const x=pose.x+offset[0],z=pose.z+offset[1],first=a.mode==='first',height=first?1.5:a.inside_building?1.9:a.mode==='drive'?3:2.5;let distance=first?.08:a.mode==='drive'?6:4;
  if(!first)for(let step=.25;step<=distance;step+=.25){const at={x:pose.x-Math.sin(pose.heading)*step,z:pose.z-Math.cos(pose.heading)*step};const clear=building?.kind==='building'&&plan?interiorFree(plan,building.width,building.depth,toLocal(building,at),.08):!c.world.entities.some(e=>e.kind==='building'&&e.status==='active'&&e.realm===realm&&contains(buildingRect(e),at)&&pose.y+height<e.y+(Math.max(...e.floors.map(f=>f.index))+1)*3);if(!clear||heightAt(terrainAt(c,realm),at.x,at.z)>pose.y+height-.2){distance=Math.max(.2,step-.25);break;}}
  const destination=new Vector3(x-Math.sin(pose.heading)*distance,pose.y+height,z-Math.cos(pose.heading)*distance),error=camera.position.distanceTo(destination);camera.position.lerp(destination,c.world.settings.reduced_motion?1:Math.min(1,dt*8));camera.lookAt(x+Math.sin(pose.heading)*2,pose.y+(first?1.5:1),z+Math.cos(pose.heading)*2);
  if(moved||turn||Math.abs(velocity.current)>.02||error>.02||busy.current)invalidate();
 });
 return exploring?<PerspectiveCamera makeDefault fov={a?.mode==='first'?65:52} near={.08} far={240}/>:null;
}
