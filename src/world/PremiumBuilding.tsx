import {useMemo,useEffect} from 'react';
import {DoubleSide} from 'three';
import type {Building} from '../../supabase/functions/_shared/world-types';
import {premiumArchitecture,type ArchitectureFamily} from './premium-architecture';
import {buildingSurface} from './ArchitecturalDetails';
import {constructionVisualState} from './construction-visual-state';
import {TextSurface} from './TextSurface';
import {DistanceLOD} from './DistanceLOD';
export function PremiumBuilding({building:b,night,powered,ghost=false,selected=false}:{building:Building;night:boolean;powered:boolean;ghost?:boolean;selected?:boolean}){
 const state=constructionVisualState(b),roof=buildingSurface(b,'roof',null),walls=buildingSurface(b,'walls',null);
 const shapes=useMemo(()=>{
  const input={family:b.archetype as ArchitectureFamily,width:b.width,depth:b.depth,floors:state.paidFloors,style:b.style??'forest' as const,finished:state.finished,roofPaid:state.roof,wallAt:(floor:number)=>state.finished?buildingSurface(b,'walls',floor).color:'#a5aba2',glassAt:(floor:number)=>b.materials.some(m=>m.surface==='windows')?buildingSurface(b,'windows',floor).color:night&&powered?'#e3c38c':'#82aeb9',doorColor:buildingSurface(b,'doors',0).color,roofColor:roof.color};
  return {high:premiumArchitecture(input),low:premiumArchitecture({...input,low:true})};
 },[b,state.paidFloors,state.finished,state.roof,night,powered,roof.color]);
 useEffect(()=>()=>{for(const set of Object.values(shapes))for(const g of Object.values(set))g.dispose();},[shapes]);
 const model=(set:typeof shapes.high)=><group>{Object.entries(set).map(([key,geometry])=>geometry.getAttribute('position').count>0&&<mesh key={key} name={'architecture-'+key} geometry={geometry} castShadow receiveShadow dispose={null}><meshStandardMaterial vertexColors side={DoubleSide} roughness={key==='glass'?.24:key==='roof'?roof.roughness:walls.roughness} metalness={key==='glass'?.22:key==='roof'?roof.metalness:walls.metalness} emissive={key==='glass'&&night&&powered&&state.finished?'#ddc592':'#000000'} emissiveIntensity={.28} transparent={ghost} opacity={ghost?.34:1}/></mesh>)}</group>;
 return <group name={'premium-'+b.archetype}>{b.opened_at&&!['house','villa'].includes(b.archetype)&&<TextSurface text={b.name} width={Math.min(2.1,b.width*.35)} height={.28} position={[b.width/2,2.45,-.07]} rotation={[0,Math.PI,0]}/>}<DistanceLOD near={model(shapes.high)} far={model(shapes.low)} distance={Math.max(b.width,b.depth)*8+state.height*2} forceNear={selected||ghost}/></group>;
}
