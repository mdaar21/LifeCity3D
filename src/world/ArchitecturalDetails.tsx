import {useEffect,useMemo} from 'react';
import {BoxGeometry,BufferGeometry,Matrix4} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {Building} from '../../supabase/functions/_shared/world-types';
import {MATERIALS} from '../../supabase/functions/_shared/world-planner';
import {VISUAL} from './visual-style';

type Finish=Omit<typeof MATERIALS[number],'color'|'roughness'|'metalness'>&{color:string;roughness:number;metalness:number};
export function buildingSurface(b:Building,type:string,floor:number|null,room:string|null=null):Finish {
 const assignment=[...b.materials].reverse().find(m=>m.surface===type&&(m.floor===floor||m.floor===null)&&(!m.room_id||m.room_id===room));
 const chosen=MATERIALS.find(v=>v.id===assignment?.material);
 if(chosen)return {...chosen,roughness:Math.max(.04,chosen.roughness-(Math.max(1,assignment!.quality)-1)*.08)};
 const fallback=MATERIALS.find(v=>v.id===(type==='roof'?'roof':type==='stairs'?'concrete':'plaster'))!;
 return {...fallback,color:b.style==='desert'?(type==='roof'?'#ae7f57':'#d5b88c'):b.style==='coastal'?(type==='roof'?'#6d9da7':'#e2e7d9'):fallback.color};
}
interface Surface {color:string;roughness:number;metalness:number;emissive?:boolean}
/** Structural detail belongs to the paid finish. Batches share one draw per material;
 * no extra saved assets, collision bounds, lamps, furniture or economy are invented. */
export function ArchitecturalDetails({building:b,night,powered}:{building:Building;night:boolean;powered:boolean}) {
 const batches=useMemo(()=>{
  const groups=new Map<string,{surface:Surface;parts:BufferGeometry[]}>();
  for(const {index:floor} of b.floors.filter(f=>b.stages.some(s=>s.type==='floor'&&s.floor===f.index&&s.paid))){
  const windows=buildingSurface(b,'windows',floor),doors=buildingSurface(b,'doors',floor);
  const hasWindows=b.materials.some(m=>m.surface==='windows'&&(m.floor===null||m.floor===floor));
  const commercial=['office','mall','hotel','resort','hospital','university'].includes(b.archetype);
  const accent=b.style==='desert'?'#a77c53':b.style==='coastal'?VISUAL.ocean:VISUAL.wood;
  const panes:Surface={color:night&&powered?'#edcd94':hasWindows&&windows.id==='glass'?windows.color:VISUAL.glass,roughness:hasWindows&&windows.id==='glass'?windows.roughness:.25,metalness:hasWindows&&windows.id==='glass'?windows.metalness:.16,emissive:night&&powered};
  const trim:Surface={color:VISUAL.ivory,roughness:.6,metalness:.05};
  const frame:Surface={color:VISUAL.navy,roughness:.5,metalness:.25};
  const windowFrame:Surface=hasWindows&&windows.id!=='glass'?{color:windows.color,roughness:windows.roughness,metalness:windows.metalness}:frame;
  const add=(position:[number,number,number],size:[number,number,number],surface:Surface,turn=0)=>{
   const key=JSON.stringify(surface);let g=groups.get(key);if(!g){g={surface,parts:[]};groups.set(key,g);}
   const geometry=new BoxGeometry(...size);geometry.applyMatrix4(new Matrix4().makeRotationY(turn));geometry.translate(position[0],position[1]+floor*3,position[2]);g.parts.push(geometry);
  };
  const wood={color:accent,roughness:.8,metalness:0},metal={color:VISUAL.steel,roughness:.4,metalness:.45};
  // Four readable elevations: inset glazing, mullions, sills and floor bands.
  for(let side=0;side<4;side++){
   const length=side<2?b.width:b.depth,count=Math.max(2,Math.min(6,Math.floor(length/2.5))),bay=length/count;
   const box=(u:number,y:number,out:number,w:number,h:number,d:number,s:Surface)=>{
    const position:[number,number,number]=side===0?[u,y,-out]:side===1?[b.width-u,y,b.depth+out]:side===2?[-out,y,b.depth-u]:[b.width+out,y,u];
    add(position,[w,h,d],s,side<2?0:Math.PI/2);
   };
   box(length/2,.24,.04,length,.2,.1,wood);box(length/2,.1,.055,length,.045,.13,trim);box(length/2,2.86,.04,length,.12,.1,trim);
   for(let i=0;i<count;i++){
    const u=(i+.5)*bay;
    if(floor===0&&(side===0&&Math.abs(u-length/2)<1||side===3&&b.archetype==='garage'&&Math.abs(u-length/2)<1.8))continue;
    const w=Math.min(bay-.35,commercial?2.2:1.55),h=commercial?1.9:1.65,y=commercial?1.52:1.6;
    box(u,y,.07,w+.14,h+.14,.12,windowFrame);box(u,y,.14,w,h,.04,panes);
    box(u,y,.17,.045,h,.025,hasWindows?windowFrame:trim);box(u,y+.18,.17,w,.035,.03,windowFrame);box(u,y-h/2-.08,.13,w+.22,.1,.2,trim);
    if(commercial)box(u,2.65,.09,w+.2,.06,.18,metal);
    else box(u,2.42,.09,w+.25,.08,.25,wood);
   }
   // Masonry joints belong to the ground-floor finish, within the existing wall.
   if(floor===0){for(let row=0;row<2;row++)for(let k=1;k<length;k+=1.1)box(k+(row%2)*.28,.34+row*.16,.065,.018,.14,.012,trim);box(length/2,.5,.065,length,.018,.012,trim);}
  }
  // Corner reveals and a real material-bearing door inside the existing opening.
  for(const x of [0,b.width])for(const z of [0,b.depth])add([x,1.5,z],[.13,3,.13],trim);
  if(floor===0){
   add([b.width/2,1.04,-.075],[.94,2.08,.075],{color:doors.color,roughness:doors.roughness,metalness:doors.metalness});
   add([b.width/2+.32,1.02,-.13],[.055,.23,.035],metal);
   add([b.width/2,2.17,-.1],[1.14,.1,.16],frame);
   if(b.archetype==='garage')for(const z of [b.depth/2-1.55,b.depth/2+1.55])add([b.width+.02,1.35,z],[.12,2.7,.12],frame);
  }
  if(floor===Math.max(...b.floors.map(f=>f.index))&&b.stages.some(s=>s.type==='roof'&&s.paid)){
   // Thin coping is integrated into the installed roof, never an extra object.
   for(const z of [.08,b.depth-.08])add([b.width/2,3.11,z],[b.width-.06,.18,.16],trim);
   for(const x of [.08,b.width-.08])add([x,3.11,b.depth/2],[.16,.18,b.depth-.06],trim);
  }
  }
  return [...groups.values()].map(({surface,parts})=>{
   const geometry=mergeGeometries(parts)!;for(const part of parts)part.dispose();return {surface,geometry};
  });
 },[b,night,powered]);
 useEffect(()=>()=>{for(const batch of batches)batch.geometry.dispose();},[batches]);
 return <group name="paid-architectural-finish">{batches.map(({surface,geometry},i)=><mesh key={i} geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={surface.color} roughness={surface.roughness} metalness={surface.metalness} emissive={surface.emissive?surface.color:'#000000'} emissiveIntensity={surface.emissive?.4:0}/></mesh>)}</group>;
}
