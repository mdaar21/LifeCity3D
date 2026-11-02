import {useRenderData} from './useRenderData';
import {useMemo,useEffect} from 'react';
import {DoubleSide} from 'three';
import type {Building} from '../../supabase/functions/_shared/world-types';
import {premiumArchitecture,type ArchitectureFamily} from './premium-architecture';
import {buildingSurface} from './ArchitecturalDetails';
import {constructionVisualState} from './construction-visual-state';
import {TextSurface} from './TextSurface';
import {DistanceLOD} from './DistanceLOD';
import {SurfaceMaterial} from './SurfaceMaterial';
export function PremiumBuilding({building:b,night,powered,ghost=false,selected=false}:{building:Building;night:boolean;powered:boolean;ghost?:boolean;selected?:boolean}){
 const state=constructionVisualState(b),roof=buildingSurface(b,'roof',null),walls=buildingSurface(b,'walls',null);
 const input=useRenderData({family:b.archetype as ArchitectureFamily,width:b.width,depth:b.depth,floors:state.paidFloors,style:b.style??'forest' as const,finished:state.finished,roofPaid:state.roof,wallColors:Object.fromEntries(state.paidFloors.map(f=>[f.index,state.finished?buildingSurface(b,'walls',f.index).color:'#a5aba2'])),glassColors:Object.fromEntries(state.paidFloors.map(f=>[f.index,b.materials.some(m=>m.surface==='windows')?buildingSurface(b,'windows',f.index).color:night&&powered?'#e3c38c':'#82aeb9'])),doorColor:buildingSurface(b,'doors',0).color,roofColor:roof.color});
 const shapes=useMemo(()=>{const value={...input,wallAt:(floor:number)=>input.wallColors[floor],glassAt:(floor:number)=>input.glassColors[floor]};return {high:premiumArchitecture(value),low:premiumArchitecture({...value,low:true})};},[input]);
 useEffect(()=>()=>{for(const set of Object.values(shapes))for(const g of Object.values(set))g.dispose();},[shapes]);
 const model=(set:typeof shapes.high)=><group>{Object.entries(set).map(([key,geometry])=>geometry.getAttribute('position').count>0&&<mesh key={key} name={'architecture-'+key} geometry={geometry} castShadow={key!=='glass'} receiveShadow dispose={null}><SurfaceMaterial surface={key==='glass'?'glass':key==='roof'?'stone':'plaster'} vertexColors side={DoubleSide} roughness={key==='glass'?.16:key==='roof'?roof.roughness:walls.roughness} metalness={key==='glass'?.18:key==='roof'?roof.metalness:walls.metalness} emissive={key==='glass'&&night&&powered&&state.finished?'#ddc592':'#000000'} emissiveIntensity={.28} transparent={ghost} opacity={ghost?.34:1}/></mesh>)}</group>;
 return <group name={'premium-'+b.archetype}>{b.opened_at&&!['house','villa'].includes(b.archetype)&&<TextSurface text={b.name} width={Math.min(2.1,b.width*.35)} height={.28} position={[b.width/2,2.45,-.07]} rotation={[0,Math.PI,0]}/>}<DistanceLOD near={model(shapes.high)} far={model(shapes.low)} distance={Math.max(b.width,b.depth)*8+state.height*2} forceNear={selected||ghost}/></group>;
}
