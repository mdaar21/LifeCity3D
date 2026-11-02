import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {CapsuleGeometry,SphereGeometry,BoxGeometry,Group} from 'three';
import type {Appearance} from '../../supabase/functions/_shared/world-types';
import {worldRuntime} from './useWorldUI';
import {SurfaceMaterial} from './SurfaceMaterial';
import {useRenderQuality} from './RenderQuality';
import {locomotionPose} from './locomotion';
const capsuleLow=new CapsuleGeometry(.5,1,3,8),sphereLow=new SphereGeometry(1,12,8),capsuleHigh=new CapsuleGeometry(.5,1,6,12),sphereHigh=new SphereGeometry(1,24,16),cube=new BoxGeometry(1,1,1);
/** Articulated original character, driven in the render loop without React gesture updates. */
export function HumanFigure({appearance:a,moving=false,live=false,motionSpeed,liveRealm}:{appearance:Appearance;moving?:boolean;live?:boolean;motionSpeed?:()=>number;liveRealm?:string}){
 const profile=useRenderQuality(),capsule=profile.foliageDetail>=2?capsuleHigh:capsuleLow,sphere=profile.foliageDetail>=2?sphereHigh:sphereLow;
 const body=useRef<Group>(null),left=useRef<Group>(null),right=useRef<Group>(null),armL=useRef<Group>(null),armR=useRef<Group>(null),kneeL=useRef<Group>(null),kneeR=useRef<Group>(null),elbowL=useRef<Group>(null),elbowR=useRef<Group>(null),footL=useRef<Group>(null),footR=useRef<Group>(null),motion=useRef(0),phase=useRef(0);
 useFrame(({clock},delta)=>{const isLive=live&&(!liveRealm||worldRuntime.realm===liveRealm),dt=Math.min(delta,.1),blend=1-Math.exp(-dt*18),speed=isLive?Math.abs(worldRuntime.speed):motionSpeed?motionSpeed():moving?1.2:0;motion.current+=(speed-motion.current)*(1-Math.exp(-dt*12));
 const amount=Math.min(1,motion.current/2.7),run=Math.max(0,Math.min(1,(motion.current-2.7)/1.5)),airborne=isLive&&!worldRuntime.jump.grounded,side=isLive?worldRuntime.moveSide:0;
 if(motion.current>.04)phase.current+=dt*(7.8+run*2.7)*amount;
 const pose=locomotionPose({speed:motion.current,phase:phase.current,forward:isLive?worldRuntime.moveForward:1,side,airborne,verticalSpeed:isLive?worldRuntime.jump.velocity:0,landing:isLive?worldRuntime.jump.landing:0});
 for(const [index,[leg,knee,arm,elbow,foot,sign]]of ([[left,kneeL,armL,elbowL,footL,1],[right,kneeR,armR,elbowR,footR,-1]] as const).entries()){
  const target=pose.legs[index];
  if(leg.current){leg.current.rotation.x+=(target.hip-leg.current.rotation.x)*blend;leg.current.rotation.z+=(target.splay-leg.current.rotation.z)*blend;}
  if(knee.current)knee.current.rotation.x+=(target.knee-knee.current.rotation.x)*blend;
  if(foot.current)foot.current.rotation.x+=(target.ankle-foot.current.rotation.x)*blend;
  if(arm.current){arm.current.rotation.x+=(target.arm-arm.current.rotation.x)*blend;arm.current.rotation.z+=(sign*(airborne?.18:.045+Math.abs(side)*amount*.08)-arm.current.rotation.z)*blend;}
  if(elbow.current)elbow.current.rotation.x+=(target.elbow-elbow.current.rotation.x)*blend;
 }
 if(body.current){body.current.position.y+=(pose.bob+Math.sin(clock.elapsedTime*1.8)*.003-body.current.position.y)*blend;body.current.rotation.z+=(pose.roll-body.current.rotation.z)*blend;body.current.rotation.x+=(pose.lean-body.current.rotation.x)*blend;body.current.rotation.y+=(pose.twist-body.current.rotation.y)*blend;}
 });
 const part=(position:[number,number,number],scale:[number,number,number],color:string,round=true)=><mesh geometry={round?capsule:cube} position={position} scale={scale} castShadow receiveShadow><SurfaceMaterial surface={color===a.skin?'skin':'fabric'} color={color} roughness={color===a.skin?.62:.86}/></mesh>;
 const ball=(position:[number,number,number],scale:[number,number,number],color:string)=><mesh geometry={sphere} position={position} scale={scale} castShadow receiveShadow><SurfaceMaterial surface={color===a.skin?'skin':'fabric'} color={color} roughness={.66}/></mesh>;
 return <group ref={body}>
  {part([0,1.08,0],[.45,.28,.23],a.top)}{part([0,.82,0],[.38,.12,.19],a.bottom)}
  {part([0,1.39,0],[.085,.065,.085],a.skin)}{ball([0,1.62,.015],[.145,.19,.14],a.skin)}
  {[-1,1].map(side=><group key={side}>
   {ball([side*.15,1.61,.008],[.027,.05,.031],a.skin)}{ball([side*.058,1.65,.153],[.016,.021,.01],'#25302d')}
   {part([side*.058,1.686,.145],[.037,.01,.01],a.hair_color,false)}
   <group ref={side<0?left:right} position={[side*.112,.79,0]}>
    {part([0,-.19,0],[.12,.19,.115],a.bottom)}<group ref={side<0?kneeL:kneeR} position={[0,-.37,0]}>
    {part([0,-.175,0],[.1,.18,.1],a.bottom)}<group ref={side<0?footL:footR} position={[0,-.35,0]}>{part([0,0,.055],[.19,.09,.31],a.shoes,false)}{part([0,-.045,.055],[.195,.025,.315],'#d0cec2',false)}{profile.materialDetail>0&&[0,1,2].map(i=><group key={i}>{part([0,.048,.04+i*.035],[.09,.009,.012],'#d7d7c9',false)}</group>)}</group></group>
   </group>
   <group ref={side<0?armL:armR} position={[side*.245,1.28,0]}>
    {part([side*.012,-.15,0],[.095,.16,.1],a.top)}<group ref={side<0?elbowL:elbowR} position={[side*.015,-.3,0]} rotation={[-.13,0,0]}>
    {part([0,-.12,0],[.065,.13,.067],a.outfit==='formal'?a.top:a.skin)}{ball([0,-.27,.012],[.065,.08,.045],a.skin)}</group>
   </group>
  </group>)}
  {ball([0,1.59,.153],[.028,.038,.028],a.skin)}{part([0,1.525,.136],[.055,.01,.01],'#956d5a',false)}
  {a.hair!=='none'&&<>{ball([0,1.78,-.015],[.16,a.hair==='curly'?.11:.085,.145],a.hair_color)}{ball([0,1.67,-.105],[.145,a.hair==='long'?.25:.105,.075],a.hair_color)}{a.hair==='curly'&&[-1,0,1].map(i=><group key={i}>{ball([i*.085,1.81,.04],[.068,.058,.075],a.hair_color)}</group>)}</>}
  {a.outfit==='builder'&&<>{part([0,1.08,.135],[.4,.42,.025],'#d2a54c',false)}{part([0,1.08,.15],[.38,.035,.012],'#eef0cf',false)}</>}
  {a.outfit==='formal'&&<>{part([0,1.16,.14],[.11,.3,.025],'#eee8dc',false)}{part([0,1.16,.16],[.035,.23,.018],'#c3a66c',false)}</>}
  {a.accessory==='cap'&&<>{ball([0,1.82,0],[.165,.085,.15],a.top)}{part([0,1.8,.14],[.29,.035,.2],a.top,false)}</>}
  {a.accessory==='glasses'&&[-1,1].map(s=><group key={s}>{part([s*.06,1.65,.164],[.108,.065,.024],'#344c54',false)}</group>)}
  {a.accessory==='backpack'&&part([0,1.09,-.19],[.33,.39,.17],'#a98558',false)}
  {profile.materialDetail>0&&<>{part([0,1.31,.12],[.18,.045,.03],a.top,false)}{part([0,.86,.127],[.3,.014,.01],a.top,false)}{[-1,1].map(s=><group key={s}>{part([s*.17,1.02,.124],[.012,.25,.006],a.top,false)}</group>)}</>}
 </group>;
}
