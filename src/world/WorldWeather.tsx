import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {InstancedMesh,Object3D} from 'three';
import type {WorldContext} from '../../supabase/functions/_shared/world-types';
const transform=new Object3D();
export function WorldWeather({context,active}:{context:WorldContext;active:boolean}){
 const settings=context.world.settings,weather=settings.weather,ref=useRef<InstancedMesh>(null),invalidate=useThree(s=>s.invalidate),count=settings.quality==='low'?120:280;
 useEffect(()=>{invalidate();},[weather,invalidate]);
 useFrame(({clock})=>{if(!ref.current||weather!=='rain')return;const reduced=settings.reduced_motion,time=reduced?0:clock.elapsedTime;for(let i=0;i<count;i++){transform.position.set(Math.sin(i*47.2)*22,12-((i*.73+time*7)%12),Math.cos(i*31.8)*18);transform.scale.set(1,1,1);transform.rotation.z=-.18;transform.updateMatrix();ref.current.setMatrixAt(i,transform.matrix);}ref.current.instanceMatrix.needsUpdate=true;if(active&&!document.hidden&&!reduced)invalidate();});
 return <>{weather==='rain'&&<instancedMesh ref={ref} args={[undefined,undefined,count]} frustumCulled={false}><boxGeometry args={[.018,.22,.018]}/><meshBasicMaterial color="#b7d0d3" transparent opacity={.55}/></instancedMesh>}{weather==='clouds'&&Array.from({length:5},(_,i)=><mesh key={i} position={[Math.sin(i*2)*20,16+i%2,Math.cos(i*2)*18]} scale={[5,1,3]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#d5e0da" roughness={1}/></mesh>)}<fog attach="fog" args={[weather==='fog'?'#c6d3cd':weather==='rain'?'#9bafaa':'#dce9e1',weather==='fog'?12:weather==='rain'?35:110,weather==='fog'?65:weather==='rain'?120:300]}/></>;
}
