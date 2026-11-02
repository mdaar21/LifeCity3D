import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {CapsuleGeometry,SphereGeometry,BoxGeometry,Group} from 'three';
import type {Appearance} from '../../supabase/functions/_shared/world-types';
import {worldRuntime} from './useWorldUI';
const capsule=new CapsuleGeometry(.5,1,3,8),sphere=new SphereGeometry(1,12,8),cube=new BoxGeometry(1,1,1);
/** Articulated original character, driven in the render loop without React gesture updates. */
export function HumanFigure({appearance:a,moving=false,live=false,motionSpeed,liveRealm}:{appearance:Appearance;moving?:boolean;live?:boolean;motionSpeed?:()=>number;liveRealm?:string}){
 const body=useRef<Group>(null),left=useRef<Group>(null),right=useRef<Group>(null),armL=useRef<Group>(null),armR=useRef<Group>(null),kneeL=useRef<Group>(null),kneeR=useRef<Group>(null),elbowL=useRef<Group>(null),elbowR=useRef<Group>(null),motion=useRef(0),phase=useRef(0);
 useFrame(({clock},delta)=>{const isLive=live&&(!liveRealm||worldRuntime.realm===liveRealm),dt=Math.min(delta,.1),blend=1-Math.exp(-dt*18),speed=isLive?Math.abs(worldRuntime.speed):motionSpeed?motionSpeed():moving?1.2:0;motion.current+=(speed-motion.current)*(1-Math.exp(-dt*12));
 const amount=Math.min(1,motion.current/2.7),running=motion.current>3.1,airborne=isLive&&!worldRuntime.jump.grounded,back=isLive&&worldRuntime.moveForward<-.05?-1:1,side=isLive?worldRuntime.moveSide:0;
 if(motion.current>.04)phase.current+=dt*motion.current*(running?3.4:3.1);const wave=Math.sin(phase.current),stride=wave*(running?.65:.48)*amount,breath=Math.sin(clock.elapsedTime*1.8)*.004;
 for(const [leg,knee,arm,elbow,sign]of [[left,kneeL,armL,elbowL,1],[right,kneeR,armR,elbowR,-1]] as const){
  if(leg.current){leg.current.rotation.x=airborne?-.28:stride*sign*back*(Math.abs(side)>.8?.45:1);leg.current.rotation.z=airborne?sign*.05:stride*sign*side*.3;}
  if(knee.current)knee.current.rotation.x+=((airborne?.85:Math.max(0,-wave*sign*back)*(running?.8:.5)*amount)-knee.current.rotation.x)*blend;
  if(arm.current){arm.current.rotation.x=airborne?-.6:-stride*sign*.85-.04;arm.current.rotation.z=sign*(airborne?.18:.045+Math.abs(side)*amount*.08);}
  if(elbow.current)elbow.current.rotation.x+=((airborne?-.65:running?-.85:-.15-amount*.15)-elbow.current.rotation.x)*blend;
 }
 if(body.current){body.current.position.y=breath+(airborne?0:Math.abs(Math.sin(phase.current*2))*Math.min(.025,motion.current*.006))-(isLive?worldRuntime.jump.landing*.07:0);body.current.rotation.z=airborne?0:Math.sin(phase.current)*.015*amount-side*amount*.045;body.current.rotation.x=airborne?-.025:(running?.1:.04)*amount*back;}
 });
 const part=(position:[number,number,number],scale:[number,number,number],color:string,round=true)=><mesh geometry={round?capsule:cube} position={position} scale={scale} castShadow><meshStandardMaterial color={color} roughness={.78}/></mesh>;
 const ball=(position:[number,number,number],scale:[number,number,number],color:string)=><mesh geometry={sphere} position={position} scale={scale} castShadow><meshStandardMaterial color={color} roughness={.72}/></mesh>;
 return <group ref={body}>
  {part([0,1.08,0],[.42,.28,.23],a.top)}{part([0,.82,0],[.36,.12,.19],a.bottom)}
  {part([0,1.39,0],[.085,.065,.085],a.skin)}{ball([0,1.62,.015],[.19,.225,.17],a.skin)}
  {[-1,1].map(side=><group key={side}>
   {ball([side*.192,1.61,.008],[.035,.063,.04],a.skin)}{ball([side*.07,1.65,.17],[.021,.025,.012],'#25302d')}
   {part([side*.07,1.69,.166],[.045,.012,.012],a.hair_color,false)}
   <group ref={side<0?left:right} position={[side*.112,.79,0]}>
    {part([0,-.19,0],[.105,.19,.108],a.bottom)}<group ref={side<0?kneeL:kneeR} position={[0,-.37,0]}>
    {part([0,-.175,0],[.083,.18,.09],a.bottom)}{part([0,-.35,.055],[.19,.09,.31],a.shoes,false)}{part([0,-.395,.055],[.195,.025,.315],'#d0cec2',false)}</group>
   </group>
   <group ref={side<0?armL:armR} position={[side*.245,1.28,0]}>
    {part([side*.012,-.15,0],[.095,.16,.1],a.top)}<group ref={side<0?elbowL:elbowR} position={[side*.015,-.3,0]} rotation={[-.13,0,0]}>
    {part([0,-.12,0],[.065,.13,.067],a.outfit==='formal'?a.top:a.skin)}{ball([0,-.27,.012],[.065,.08,.045],a.skin)}</group>
   </group>
  </group>)}
  {ball([0,1.59,.183],[.035,.045,.032],a.skin)}{part([0,1.525,.165],[.07,.012,.012],'#956d5a',false)}
  {a.hair!=='none'&&<>{ball([0,1.78,-.015],[.2,a.hair==='curly'?.13:.095,.18],a.hair_color)}{ball([0,1.67,-.12],[.18,a.hair==='long'?.27:.12,.09],a.hair_color)}{a.hair==='curly'&&[-1,0,1].map(i=><group key={i}>{ball([i*.105,1.82,.05],[.08,.065,.09],a.hair_color)}</group>)}</>}
  {a.outfit==='builder'&&<>{part([0,1.08,.135],[.4,.42,.025],'#d2a54c',false)}{part([0,1.08,.15],[.38,.035,.012],'#eef0cf',false)}</>}
  {a.outfit==='formal'&&<>{part([0,1.16,.14],[.11,.3,.025],'#eee8dc',false)}{part([0,1.16,.16],[.035,.23,.018],'#c3a66c',false)}</>}
  {a.accessory==='cap'&&<>{ball([0,1.82,0],[.205,.09,.18],a.top)}{part([0,1.8,.17],[.34,.035,.24],a.top,false)}</>}
  {a.accessory==='glasses'&&[-1,1].map(s=><group key={s}>{part([s*.075,1.65,.19],[.125,.075,.026],'#344c54',false)}</group>)}
  {a.accessory==='backpack'&&part([0,1.09,-.19],[.33,.39,.17],'#a98558',false)}
 </group>;
}
