import {useEffect,useMemo} from 'react';
import {BoxGeometry,BufferGeometry,CylinderGeometry,PlaneGeometry,DoubleSide,Float32BufferAttribute,Color} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {Building} from '../../supabase/functions/_shared/world-types';
import {BUILDING_CATALOG} from '../../supabase/functions/_shared/building-catalog';
import {Box} from './WorldGeometry';
import {MATERIALS} from '../../supabase/functions/_shared/world-planner';
import {buildingSurface} from './ArchitecturalDetails';
export function towerGeometry(kind:string,w:number,d:number,height:number,finish?:{wallAt:(floor:number)=>string;windowsAt:(floor:number)=>string;roof:string}){
 const solids:BufferGeometry[]=[],details:BufferGeometry[]=[];
 const add=(g:BufferGeometry,list:BufferGeometry[],color:string,x:number,y:number,z:number,angle=0)=>{g.rotateY(angle);g.translate(x,y,z);const c=new Color(color),n=g.getAttribute('position').count;g.setAttribute('color',new Float32BufferAttribute(Array.from({length:n},()=>[c.r,c.g,c.b]).flat(),3));list.push(g);};
 const profile=(t:number)=>kind==='tower_steps'?1-Math.floor(t*6)*.09:kind==='tower_spire'?1-.7*t:kind==='tower_sail'?.32+Math.sin(t*Math.PI*.9)*.65:kind==='tower_crown'?.85+.1*Math.cos(t*Math.PI*2):1;
 const slices=Math.min(250,Math.max(1,Math.ceil(height/4))),h=height/slices,baseWall=BUILDING_CATALOG[kind as Building['archetype']].wall;
 for(let i=0;i<slices;i++){const wall=finish?.wallAt(i)??baseWall,t=(i+.5)/slices,f=profile(t),angle=kind==='tower_twist'?t*Math.PI*.75:0;
  if(kind==='tower_round')add(new CylinderGeometry(Math.min(w,d)*.45,Math.min(w,d)*.45,h,16),solids,wall,w/2,(i+.5)*h,d/2);
  else if(kind==='tower_twin')for(const side of [-1,1])add(new BoxGeometry(w*.36,h,d*.72),solids,wall,w/2+side*w*.27,(i+.5)*h,d/2);
  else add(new BoxGeometry(w*f*(angle?.7:.94),h,d*f*(angle?.7:.94)),solids,wall,w/2,(i+.5)*h,d/2,angle);
  const band=Math.min(.12,h*.08);add(new BoxGeometry(w*f*.98,band,d*f*.98),details,'#d3d9d2',w/2,(i+1)*h-band/2,d/2,angle);
 }
 // Facade details are sampled independently of floor count, keeping 250-floor towers bounded.
 const rows=Math.min(250,Math.ceil(height/4));for(let i=0;i<rows;i++){const t=(i+.5)/rows,f=profile(t),y=(i+.5)*height/rows;
 for(const side of [-1,1])for(const panel of [-1,1]){
  if(kind==='tower_round'){const angle=(side<0?Math.PI:0)+panel*.6,r=Math.min(w,d)*.455;add(new PlaneGeometry(.65,Math.min(2.4,height/rows*.65)),details,finish?.windowsAt(i)??(i%7===0?'#ecd39c':'#42697f'),w/2+Math.sin(angle)*r,y,d/2+Math.cos(angle)*r,angle);}
  else if(kind==='tower_twist'){const angle=t*Math.PI*.75,lx=panel*w*.17,lz=side*d*.355;add(new PlaneGeometry(w*.14,Math.min(2.4,height/rows*.7)),details,finish?.windowsAt(i)??'#477287',w/2+Math.cos(angle)*lx+Math.sin(angle)*lz,y,d/2-Math.sin(angle)*lx+Math.cos(angle)*lz,angle);}
  else {const z=d/2+side*d*f*.475;add(new PlaneGeometry(w*.14,Math.min(2.4,height/rows*.7)),details,finish?.windowsAt(i)??(i%7===0?'#e5c68c':'#477287'),w/2+panel*w*f*.24,y,z);}
 }
 }
 if(kind==='tower_twin')for(const t of [.35,.72])add(new BoxGeometry(w*.52,.8,d*.25),details,'#d5ddd6',w/2,height*t,d/2);
 if(kind==='tower_crown')for(let i=0;i<7;i++)add(new BoxGeometry(w*.1,.7,d*.7),details,finish?.roof??'#ddc58d',w*(.14+i*.12),height-.45,d/2);
 else add(new BoxGeometry(w*profile(1)*.8,.6,d*profile(1)*.8),details,finish?.roof??'#c7d9d8',w/2,height-.3,d/2);
 const merge=(list:BufferGeometry[])=>{const result=mergeGeometries(list,false)!;for(const g of list)g.dispose();result.computeBoundingBox();return result;};return {shell:merge(solids),details:merge(details)};
}
export function TowerExterior({building:b,night,ghost=false,powered=true}:{building:Building;night:boolean;ghost?:boolean;powered?:boolean}){
 const paid=b.stages.filter(s=>s.type==='floor'&&s.paid),height=Math.max(0,...paid.map(s=>((s.floor??0)+1)*4)),frame=b.stages.some(s=>s.type==='frame'&&s.paid),modelHeight=Math.max(.3,height);
 const walls=buildingSurface(b,'walls',null),roof=buildingSurface(b,'roof',null),doors=buildingSurface(b,'doors',0);
 const {archetype,width,depth,materials}=b;
 const geometry=useMemo(()=>{const color=(surface:string,floor:number,fallback:string)=>{const assignment=[...materials].reverse().find(m=>m.surface===surface&&(m.floor===null||m.floor===floor)&&m.room_id===null);return MATERIALS.find(m=>m.id===assignment?.material)?.color??fallback;};return towerGeometry(archetype,width,depth,modelHeight,{wallAt:floor=>color('walls',floor,BUILDING_CATALOG[archetype].wall),windowsAt:floor=>color('windows',floor,floor%7===0?'#e5c68c':'#477287'),roof:roof.color});},[archetype,width,depth,modelHeight,materials,roof.color]);
 useEffect(()=>()=>{geometry.shell.dispose();geometry.details.dispose();},[geometry]);
 return <group name={'tower-'+b.archetype}>
  <Box at={[b.width/2,.1,b.depth/2]} size={[b.width,.2,b.depth]} color="#849f9a"/>
  {frame&&height<3&&<Box at={[b.width/2,b.floors.length*2,b.depth/2]} size={[b.width*.72,b.floors.length*4,b.depth*.72]} color="#a3b4ad" opacity={.25}/>}
  {height>0&&<><mesh geometry={geometry.shell} castShadow receiveShadow><meshStandardMaterial vertexColors color={b.opened_at?'#ffffff':'#b7bfc0'} metalness={b.materials.some(m=>m.surface==='walls')?walls.metalness:.25} roughness={b.materials.some(m=>m.surface==='walls')?walls.roughness:.3} transparent={ghost} opacity={ghost?.35:1}/></mesh><mesh geometry={geometry.details} castShadow><meshStandardMaterial vertexColors side={DoubleSide} emissive={night&&powered&&b.opened_at?'#a3894f':'#000000'} emissiveIntensity={.18} roughness={.4} transparent={ghost} opacity={ghost?.35:1}/></mesh><Box at={[b.width/2,1.4,-.04]} size={[Math.min(3,b.width*.3),2.8,.15]} color={doors.color}/></>}
 </group>;
}
