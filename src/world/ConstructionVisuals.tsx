import {InstancedBlocks,type BlockInstance} from './InstancedBlocks';
import {HumanFigure} from './HumanFigure';
import {DEFAULT_APPEARANCE} from '../../supabase/functions/_shared/world-motion';
import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useReducedMotion} from 'framer-motion';
import type {Group} from 'three';
import type {Building} from '../../supabase/functions/_shared/world-types';
import {VISUAL} from './visual-style';
import {constructionVisualState} from './construction-visual-state';
/** Paid worksite state; equipment is temporary and never becomes owned inventory. */
export function ConstructionVisuals({building:b,reducedMotion=false,details=true}:{building:Building;reducedMotion?:boolean;details?:boolean}){
 const state=constructionVisualState(b),boom=useRef<Group>(null),osReduced=useReducedMotion(),w=b.width,d=b.depth,h=state.height;
 const shapes=useMemo(()=>{const blocks:BlockInstance[]=[],arm:BlockInstance[]=[],add=(at:BlockInstance['at'],size:BlockInstance['size'],color:string)=>blocks.push({at,size,color});if(!state.active)return {blocks,arm};add([w/2,.035,d/2],[w,.07,d],VISUAL.concrete);
  if(!state.frame)for(const x of [.35,w-.35])for(const z of [.35,d-.35]){add([x,.3,z],[.4,.6,.4],VISUAL.concrete);for(const dx of [-.1,.1])add([x+dx,.85,z],[.035,.75,.035],'#8b7463');}
  if(state.frame){const n=Math.min(40,Math.ceil(h/3));for(let i=0;i<n;i++){const y=(i+1)*h/n-.16;add([w/2,y,0],[w,.24,.22],VISUAL.concrete);add([w/2,y,d],[w,.24,.22],VISUAL.concrete);add([0,y,d/2],[.22,.24,d],VISUAL.concrete);add([w,y,d/2],[.22,.24,d],VISUAL.concrete);}for(const x of [0,w])for(const z of [0,d])add([x,h/2,z],[.16,h,.16],VISUAL.concrete);}
  if(details){const x=w-.6,z=d-.6;add([x,h/2+1,z],[.25,h+2,.25],VISUAL.gold);const n=Math.min(64,Math.ceil((h+2)/1.2));for(let i=0;i<n;i++){const y=(i+.5)*(h+2)/n;add([x,y,z],[.5,.06,.5],VISUAL.gold);add([x+.18,y,z],[.045,(h+2)/n,.045],'#cb984b');}for(const zz of [-.28,d+.28]){for(const xx of [.4,w/2,w-.4])add([xx,Math.min(h,6)/2,zz],[.05,Math.min(h,6),.05],VISUAL.steel);for(let i=0;i<Math.min(3,Math.ceil(h/2));i++)add([w/2,1+i*2,zz],[w,.07,.33],VISUAL.wood);}arm.push({at:[-w*.18,0,0],size:[w*.85,.16,.25],color:VISUAL.gold},{at:[.65,-.25,0],size:[.8,.5,.6],color:VISUAL.navy},{at:[-w*.5,-1.1,0],size:[.025,2.1,.025],color:VISUAL.steel},{at:[-w*.5,-2.2,0],size:[.2,.22,.12],color:VISUAL.gold});}
  return {blocks,arm};
 },[w,d,h,state.active,state.frame,details]);
 useFrame(({clock})=>{if(boom.current&&!reducedMotion&&!osReduced)boom.current.rotation.y=Math.sin(clock.elapsedTime*.12)*.08;});
 if(!state.active)return null;
 return <group name="paid-construction-site"><InstancedBlocks blocks={shapes.blocks}/>{details&&<>{[.2,.75].map((ratio,i)=><group key={ratio} position={[w*ratio,0,d+.55]} rotation={[0,i?-.5:.7,0]}><HumanFigure appearance={{...DEFAULT_APPEARANCE,outfit:'builder',accessory:'cap',top:i?'#56879a':'#a4824f'}}/></group>)}<group position={[w-.6,h+2,d-.6]} ref={boom}><InstancedBlocks blocks={shapes.arm}/></group></>}</group>;
}
