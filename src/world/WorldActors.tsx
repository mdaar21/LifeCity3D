import {modalInput} from '../lib/modal-input';
import {floorElevation,buildingHeight} from '../../supabase/functions/_shared/world-math';
import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {PerspectiveCamera} from '@react-three/drei';
import {Group,Vector3} from 'three';
import {useGame} from '../lib/game';
import type {Avatar,Car,Point,Realm,WorldContext} from '../../supabase/functions/_shared/world-types';
import {activeAvatar,CARS,interiorFree,outdoorFree,toLocal} from '../../supabase/functions/_shared/world-motion';
import {buildingRect,contains,heightAt,pointSegmentDistance,terrainAt} from '../../supabase/functions/_shared/world-math';
import {graph,walkingPath} from '../../supabase/functions/_shared/world-networks';
import {TextSurface} from './TextSurface';
import {Box} from './WorldGeometry';
import {useTouchTools} from './useTouchTools';
import {useWorldUI,worldRuntime} from './useWorldUI';
export {HumanFigure as PersonMesh} from './HumanFigure';
import {HumanFigure as PersonMesh} from './HumanFigure';
export function CarMesh({car}:{car:Car}){
 const model=CARS.find(v=>v.id===car.model)!,w=model.width,l=model.length;
 return <><Box at={[0,.42,0]} size={[w,.5,l]} color={car.paint}/><Box at={[0,.88,-l*.08]} size={[w*.85,.55,l*.5]} color={car.paint}/><Box at={[0,.95,l*.18]} size={[w*.8,.38,.04]} color="#708c91" opacity={1-car.tint/2}/><Box at={[0,.98,-l*.28]} size={[w*.8,.35,.04]} color="#708c91"/>{[-1,1].flatMap(x=>[-1,1].map(z=><mesh key={x+':'+z} position={[x*w*.49,.27,z*l*.31]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.28,.28,.18,car.rims==='sport'?12:8]}/><meshStandardMaterial color={car.rims==='classic'?'#c3bd9e':car.rims==='sport'?'#566b71':'#3c4945'}/></mesh>))}{[-1,1].map(s=><Box key={s} at={[s*w*.32,.5,l/2+.015]} size={[.25,.15,.04]} color="#f1d997" emissive/>)}<Box at={[0,.4,-l/2-.02]} size={[.45,.15,.04]} color="#dfdec7"/><TextSurface text={car.plate} width={.43} height={.14} position={[0,.4,-l/2-.043]} rotation={[0,Math.PI,0]}/>{car.trim!=='standard'&&<Box at={[0,.71,0]} size={[w*.6,.06,l*.32]} color={car.trim==='wood'?'#9b774d':'#b2b9b7'}/>}</>;
}
export function AvatarActor({avatar,realm}:{avatar:Avatar;realm:Realm}){
 const ref=useRef<Group>(null);useFrame(()=>{if(!ref.current)return;const p=worldRuntime.realm===realm&&worldRuntime.pose?worldRuntime.pose:avatar.pose;ref.current.position.set(p.x,p.y,p.z);ref.current.rotation.y+=Math.atan2(Math.sin(p.heading-ref.current.rotation.y),Math.cos(p.heading-ref.current.rotation.y))*.35;});
 return <group ref={ref} position={[avatar.pose.x,avatar.pose.y,avatar.pose.z]} visible={avatar.mode!=='drive'&&avatar.mode!=='first'}><PersonMesh appearance={avatar.appearance} live/></group>;
}
export function CarActor({car,driven,realm}:{car:Car;driven:boolean;realm:Realm}){
 const ref=useRef<Group>(null);useFrame(()=>{if(!ref.current)return;const p=driven&&worldRuntime.realm===realm&&worldRuntime.pose?worldRuntime.pose:car.pose;ref.current.position.set(p.x,p.y,p.z);ref.current.rotation.y=p.heading;});
 return <group ref={ref} position={[car.pose.x,car.pose.y,car.pose.z]} rotation={[0,car.pose.heading,0]}><CarMesh car={car}/></group>;
}
export function PlayController({context,realm,offset,active}:{context:WorldContext;realm:Realm;offset:[number,number];active:boolean}){
 const toolOpen=useTouchTools(s=>s.sheet!==null||s.draft!==null||s.designOpen);
 const {mutate}=useGame(),invalidate=useThree(s=>s.invalidate),camera=useThree(s=>s.camera),gl=useThree(s=>s.gl),uiOpen=useWorldUI(s=>s.open),input=useWorldUI(s=>s.input);
 const a=activeAvatar(context,realm),exploring=!!a&&a.mode!=='aerial';const live=useRef(context),actor=useRef(a),busy=useRef(false),trace=useRef<Point[]>([]),lastSample=useRef(0),lastSave=useRef(0),velocity=useRef(0),keys=useRef(new Set<string>()),path=useRef<Point[]>([]),target=useRef<Point|null>(null),disposed=useRef(false);
 const roads=useMemo(()=>graph(context,realm,'road'),[context,realm]);
 useEffect(()=>{const old=actor.current;live.current=context;actor.current=a;if(old?.mode!==a?.mode&&(old?.mode==='drive'||a?.mode==='drive')){path.current=[];target.current=null;worldRuntime.target=null;velocity.current=0;trace.current=[];useWorldUI.getState().set({input:{forward:0,turn:0,run:false}});}if(!worldRuntime.pose||worldRuntime.realm!==realm||old?.mode!==a?.mode||old?.inside_building!==a?.inside_building||old?.floor!==a?.floor||!busy.current&&!worldRuntime.moving){worldRuntime.realm=realm;worldRuntime.pose=a?{...a.pose}:null;trace.current=[];}invalidate();},[context,a,realm,invalidate]);
 useEffect(()=>{if(!active||!exploring)return;const pressed=keys.current;const down=(e:KeyboardEvent)=>{if(modalInput.count>0)return;if(e.target instanceof HTMLElement&&e.target.closest('input,select,textarea,[contenteditable=true]'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D','Shift'].includes(e.key)){e.preventDefault();pressed.add(e.key.toLowerCase());invalidate();}};const up=(e:KeyboardEvent)=>{pressed.delete(e.key.toLowerCase());invalidate();};const blur=()=>{pressed.clear();useWorldUI.getState().set({input:{forward:0,turn:0,run:false}});invalidate();};addEventListener('keydown',down);addEventListener('keyup',up);addEventListener('blur',blur);addEventListener('lifecity-modal-open',blur);return()=>{removeEventListener('keydown',down);removeEventListener('keyup',up);removeEventListener('blur',blur);removeEventListener('lifecity-modal-open',blur);pressed.clear();};},[active,exploring,invalidate]);
 useEffect(()=>{if(!active||!exploring)return;const canvas=gl.domElement,pointers=new Map<number,{x:number;y:number}>();let dragging=false,lastX=0,lastY=0,pinch=0;
 const down=(e:PointerEvent)=>{if(toolOpen||uiOpen||modalInput.count>0)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});dragging=true;lastX=e.clientX;lastY=e.clientY;if(pointers.size===2){const [a,b]=[...pointers.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);}canvas.setPointerCapture(e.pointerId);};
 const move=(e:PointerEvent)=>{if(modalInput.count>0)return;if(!dragging&&document.pointerLockElement!==canvas)return;if(pointers.has(e.pointerId))pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>=2){const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(pinch&&distance>5)worldRuntime.followDistance=Math.max(2.5,Math.min(10,worldRuntime.followDistance*pinch/distance));pinch=distance;invalidate();return;}
 const dx=document.pointerLockElement===canvas?e.movementX:e.clientX-lastX,dy=document.pointerLockElement===canvas?e.movementY:e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;worldRuntime.lookYaw-=dx*.005;worldRuntime.lookPitch=Math.max(-.45,Math.min(.6,worldRuntime.lookPitch+dy*.004));worldRuntime.target=null;invalidate();};
 const up=(e:PointerEvent)=>{pointers.delete(e.pointerId);dragging=pointers.size>0;pinch=0;const next=[...pointers.values()][0];if(next){lastX=next.x;lastY=next.y;}};
 const wheel=(e:WheelEvent)=>{e.preventDefault();worldRuntime.followDistance=Math.max(2.5,Math.min(10,worldRuntime.followDistance*Math.exp(e.deltaY*.001)));invalidate();};
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);canvas.addEventListener('wheel',wheel,{passive:false});return()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('lostpointercapture',up);canvas.removeEventListener('wheel',wheel);};
 },[active,exploring,gl,invalidate,toolOpen,uiOpen]);
 useEffect(()=>{invalidate();},[input,uiOpen,toolOpen,invalidate]);
 useEffect(()=>{disposed.current=false;return()=>{disposed.current=true;worldRuntime.moving=false;worldRuntime.speed=0;};},[]);
 const save=()=>{const avatar=actor.current,pose=worldRuntime.pose;if(busy.current||!avatar||!pose||!trace.current.length||!active)return;const points=trace.current.splice(0,128);busy.current=true;lastSave.current=performance.now();void mutate('world_apply',{operation:avatar.mode==='drive'?'car_move':'avatar_move',expected_revision:live.current.world.revision,request:{realm,x:pose.x,z:pose.z,heading:pose.heading,trace:points}}).then(response=>{if(response.state?.world_systems){live.current={...live.current,world:response.state.world_systems};const next=activeAvatar(live.current,realm);actor.current=next;}}).catch(()=>{const current=activeAvatar(live.current,realm);if(current)worldRuntime.pose={...current.pose};path.current=[];worldRuntime.target=null;trace.current=[];velocity.current=0;}).finally(()=>{busy.current=false;if(!disposed.current)invalidate();});};
 useFrame((_,delta)=>{
  if(!active||!exploring||!a||!worldRuntime.pose||worldRuntime.realm!==realm)return;const dt=Math.min(.045,delta),pose=worldRuntime.pose,c=live.current,blocked=uiOpen||toolOpen||modalInput.count>0;let forward=blocked?0:input.forward+(keys.current.has('w')||keys.current.has('arrowup')?1:0)-(keys.current.has('s')||keys.current.has('arrowdown')?1:0),turn=blocked?0:input.turn+(keys.current.has('a')||keys.current.has('arrowleft')?1:0)-(keys.current.has('d')||keys.current.has('arrowright')?1:0);const running=keys.current.has('shift')||input.run;if(blocked){velocity.current=0;keys.current.clear();worldRuntime.lookYaw=0;path.current=[];worldRuntime.target=null;}
  if(worldRuntime.target!==target.current){target.current=worldRuntime.target;path.current=target.current?(a.inside_building?[target.current]:walkingPath(c,realm,pose,target.current)??[]):[];}
  if(forward||turn){path.current=[];target.current=null;worldRuntime.target=null;}
  if(!blocked&&path.current.length){const next=path.current[0],dx=next.x-pose.x,dz=next.z-pose.z;if(Math.hypot(dx,dz)<.25)path.current.shift();else{pose.heading=Math.atan2(dx,dz);forward=1;turn=0;}}
  const headingBefore=pose.heading;pose.heading+=worldRuntime.lookYaw;worldRuntime.lookYaw=0;
  pose.heading+=Math.max(-1,Math.min(1,turn))*dt*(a.mode==='drive'?(Math.abs(velocity.current)>.1?1.4:0):2.2);
  const car=a.vehicle_id?c.world.entities.find(e=>e.id===a.vehicle_id&&e.kind==='car'):null,model=car?.kind==='car'?CARS.find(v=>v.id===car.model):null;
  if(a.mode==='drive')velocity.current+=((forward>0?model?.speed??8:forward<0?-3:0)-velocity.current)*Math.min(1,dt*(forward?1.5:4));else velocity.current+=(forward*(running?4.2:2.7)-velocity.current)*Math.min(1,dt*12);
  const speed=velocity.current,next={x:pose.x+Math.sin(pose.heading)*speed*dt,z:pose.z+Math.cos(pose.heading)*speed*dt};
  const building=a.inside_building?c.world.entities.find(e=>e.id===a.inside_building&&e.kind==='building'):null,plan=building?.kind==='building'?building.floors.find(f=>f.index===a.floor):null;
  const free=(p:Point)=>building?.kind==='building'&&plan?interiorFree(plan,building.width,building.depth,toLocal(building,p)):outdoorFree(c,realm,p,a.mode==='drive'?(model?.width??1.4)/2:.24)&& (a.mode!=='drive'||c.world.settings.free_drive||[...roads.edges.values()].some(list=>list.some(({edge})=>pointSegmentDistance(p,roads.nodes.get(edge.from)!,roads.nodes.get(edge.to)!)<=(edge.directed?edge.lanes*1.6:edge.lanes*3)/2+.1)));
  const moved=Math.abs(speed)>.02&&free(next);if(moved){pose.x=next.x;pose.z=next.z;pose.y=building?.kind==='building'?building.y+floorElevation(building,a.floor):heightAt(terrainAt(c,realm),pose.x,pose.z)+(a.mode==='drive'?.12:0);}else if(Math.abs(speed)>.02){velocity.current=0;path.current=[];worldRuntime.target=null;}
  const now=performance.now();if((moved||Math.abs(pose.heading-headingBefore)>.0001)&&now-lastSample.current>100){trace.current.push({x:pose.x,z:pose.z});lastSample.current=now;}
  if(trace.current.length&&(!moved&&!turn||now-lastSave.current>2000))save();worldRuntime.moving=!!moved;worldRuntime.speed=moved?speed:0;
  const x=pose.x+offset[0],z=pose.z+offset[1],first=a.mode==='first',height=first?1.5:a.inside_building?1.9:a.mode==='drive'?3:2.5;let distance=first?.08:a.mode==='drive'?6:worldRuntime.followDistance;
  if(!first)for(let step=.25;step<=distance;step+=.25){const at={x:pose.x-Math.sin(pose.heading)*step,z:pose.z-Math.cos(pose.heading)*step};const clear=building?.kind==='building'&&plan?interiorFree(plan,building.width,building.depth,toLocal(building,at),.08):!c.world.entities.some(e=>e.kind==='building'&&e.status==='active'&&e.realm===realm&&contains(buildingRect(e),at)&&pose.y+height<e.y+buildingHeight(e));if(!clear||heightAt(terrainAt(c,realm),at.x,at.z)>pose.y+height-.2){distance=Math.max(.2,step-.25);break;}}
  const destination=new Vector3(x-Math.sin(pose.heading)*distance,pose.y+height+worldRuntime.lookPitch*2,z-Math.cos(pose.heading)*distance),error=camera.position.distanceTo(destination);camera.position.lerp(destination,c.world.settings.reduced_motion?1:Math.min(1,dt*8));camera.lookAt(x+Math.sin(pose.heading)*2,pose.y+(first?1.5:1),z+Math.cos(pose.heading)*2);
  if(moved||turn||Math.abs(velocity.current)>.02||error>.02||busy.current)invalidate();
 });
 return exploring?<PerspectiveCamera makeDefault fov={a?.mode==='first'?65:52} near={.08} far={2500}/>:null;
}
