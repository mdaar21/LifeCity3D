import {useMemo,useRef,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import {Group,Vector3} from 'three';
/** Lower only the camera-facing walls. Coordinates stay local even on rotated buildings. */
export function AdaptiveCutaway({enabled,width,depth,children}:{enabled:boolean;width:number;depth:number;children:ReactNode[]}){
 const root=useRef<Group>(null),point=useMemo(()=>new Vector3(),[]);
 useFrame(({camera})=>{if(!root.current)return;const walls=root.current.children;if(!enabled){for(const w of walls)w.scale.y=1;return;}root.current.worldToLocal(camera.getWorldPosition(point));const scales=[point.z<depth/2?.24:1,point.z>=depth/2?.24:1,point.x<width/2?.24:1,point.x>=width/2?.24:1];walls.forEach((wall,i)=>{wall.scale.y=scales[i];});});
 return <group ref={root}>{children.map((child,i)=><group key={i}>{child}</group>)}</group>;
}
