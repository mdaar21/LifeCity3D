import {useEffect,useMemo} from 'react';
import {ExtrudeGeometry,Shape} from 'three';
import {SurfaceMaterial} from './SurfaceMaterial';
import {useRenderQuality} from './RenderQuality';
/** Bevelled original bodywork; the purchased model's footprint is unchanged. */
export function VehicleBody({width:w,length:l,paint,tint}:{width:number;length:number;paint:string;tint:number}){
 const profile=useRenderQuality();
 const geometry=useMemo(()=>{
  const s=new Shape();s.moveTo(-l*.48,.31);s.lineTo(-l*.48,.56);s.lineTo(-l*.39,.65);s.lineTo(-l*.19,.7);s.lineTo(-l*.07,1.08);s.lineTo(l*.19,1.08);s.lineTo(l*.33,.7);s.lineTo(l*.46,.62);s.lineTo(l*.48,.31);s.closePath();
  const g=new ExtrudeGeometry(s,{depth:w*.89,steps:1,bevelEnabled:true,bevelSize:.04,bevelThickness:.035,bevelSegments:profile.materialDetail>=2?3:1,curveSegments:1});g.rotateY(Math.PI/2);g.translate(-w*.445,0,0);return g;
 },[w,l,profile.materialDetail]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 const panel=(at:[number,number,number],size:[number,number,number],color:string,glass=false)=><mesh position={at} castShadow={!glass} receiveShadow><boxGeometry args={size}/><SurfaceMaterial surface={glass?'glass':'metal'} color={color} roughness={glass?.13:.3} metalness={glass?.2:.4}/></mesh>;
 return <><mesh geometry={geometry} castShadow receiveShadow><SurfaceMaterial surface="metal" color={paint} roughness={.25} metalness={.4}/></mesh>
 <group position={[0,.875,l*.12]} rotation={[.55,0,0]}>{panel([0,0,0],[w*.78,.37,.025],tint>.4?'#405960':'#72969f',true)}</group>
 <group position={[0,.875,-l*.26]} rotation={[-.61,0,0]}>{panel([0,0,0],[w*.78,.32,.025],'#68868e',true)}</group>
 {[-1,1].map(side=><group key={side}>{panel([side*w*.457,.89,-l*.055],[.025,.29,l*.29],'#64858c',true)}{panel([side*w*.47,.89,-l*.055],[.032,.32,.045],paint)}{profile.materialDetail>0&&<>{panel([side*w*.54,.78,l*.12],[.16,.09,.15],paint)}{panel([side*w*.46,.67,-l*.09],[.015,.022,.13],'#b4c3c1')}{panel([side*w*.465,.32,0],[.022,.045,l*.72],'#364749')}</>}</group>)}
 {panel([0,.38,l*.485],[w*.7,.12,.05],'#354b51')}{panel([0,.35,-l*.485],[w*.75,.09,.05],'#354b51')}
 </>;
}
