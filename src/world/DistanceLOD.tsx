import {useRef,type ReactNode} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Group,Vector3} from 'three';
import {useRenderQuality} from './RenderQuality';
/** Switch visibility without React updates or an extra animation loop. */
export function DistanceLOD({near,far,distance,forceNear=false}:{near:ReactNode;far:ReactNode;distance:number;forceNear?:boolean}){
 const root=useRef<Group>(null),high=useRef<Group>(null),low=useRef<Group>(null),point=useRef(new Vector3()),camera=useThree(s=>s.camera),quality=useRenderQuality();
 useFrame(()=>{if(!root.current||!high.current||!low.current)return;root.current.getWorldPosition(point.current);const reach=distance*(quality.level==='ultra'?1.6:quality.level==='high'?1.2:1),show=forceNear||quality.level!=='low'&&camera.position.distanceToSquared(point.current)<reach*reach;high.current.visible=show;low.current.visible=!show;});
 return <group ref={root}><group ref={high}>{near}</group><group ref={low} visible={false}>{far}</group></group>;
}
