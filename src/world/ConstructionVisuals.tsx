import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useReducedMotion} from 'framer-motion';
import type {Group} from 'three';
import type {Building} from '../../supabase/functions/_shared/world-types';
import {AssetBox} from './StylizedAssets';
import {VISUAL} from './visual-style';
import {constructionVisualState} from './construction-visual-state';
/** Temporary worksite equipment belongs to the paid construction's visual state, not inventory. */
export function ConstructionVisuals({building:b,reducedMotion=false,details=true}:{building:Building;reducedMotion?:boolean;details?:boolean}){
 const state=constructionVisualState(b),boom=useRef<Group>(null),osReduced=useReducedMotion();
 useFrame(({clock})=>{if(boom.current&&!reducedMotion&&!osReduced)boom.current.rotation.y=Math.sin(clock.elapsedTime*.12)*.08;});
 if(!state.active)return null;const w=b.width,d=b.depth,h=state.height,box=(at:[number,number,number],size:[number,number,number],color:string,key?:string)=><AssetBox key={key} at={at} size={size} color={color}/>;
 return <group>
  {!state.frame&&[.35,w-.35].flatMap(x=>[.35,d-.35].map(z=><group key={x+':'+z}>{box([x,.3,z],[.4,.6,.4],VISUAL.concrete)}{[-.1,.1].map(t=>box([x+t,.85,z],[.035,.75,.035],'#8b7463',String(t)))}</group>))}
  {state.frame&&Array.from({length:Math.ceil(h/3)},(_,i)=><group key={i} position={[0,(i+1)*3-.16,0]}>{box([w/2,0,0],[w,.24,.22],VISUAL.concrete)}{box([w/2,0,d],[w,.24,.22],VISUAL.concrete)}{box([0,0,d/2],[.22,.24,d],VISUAL.concrete)}{box([w,0,d/2],[.22,.24,d],VISUAL.concrete)}</group>)}
  {details&&<>
   <group position={[w-.6,0,d-.6]}>{box([0,h/2+1,0],[.25,h+2,.25],VISUAL.gold)}{Array.from({length:Math.ceil((h+2)/1.2)},(_,i)=><group key={i} position={[0,i*1.2+.5,0]}>{box([0,0,0],[.5,.06,.5],VISUAL.gold)}<group rotation={[0,0,.36]}>{box([0,.5,0],[.045,1.1,.045],'#cb984b')}</group></group>)}<group position={[0,h+2,0]} ref={boom}>{box([-w*.18,0,0],[w*.85,.16,.25],VISUAL.gold)}{box([.65,-.25,0],[.8,.5,.6],VISUAL.navy)}{box([-w*.5,-1.1,0],[.025,2.1,.025],VISUAL.steel)}{box([-w*.5,-2.2,0],[.2,.22,.12],VISUAL.gold)}</group></group>
   {[0,d].map(z=><group key={z} position={[0,0,z+(z? .28:-.28)]}>{[.4,w/2,w-.4].map(x=>box([x,Math.min(h,6)/2,0],[.05,Math.min(h,6),.05],VISUAL.steel,String(x)))}{Array.from({length:Math.min(3,Math.ceil(h/2))},(_,i)=>box([w/2,1+i*2,0],[w,.07,.33],VISUAL.wood,String(i)))}</group>)}
  </>}
 </group>;
}
