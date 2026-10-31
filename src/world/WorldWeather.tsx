import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useReducedMotion} from 'framer-motion';
import {InstancedMesh,Object3D,Vector3} from 'three';
import type {WorldContext} from '../../supabase/functions/_shared/world-types';
import {visualEnvironment,type graphicsProfile} from './graphics-profile';
export function WorldWeather({context,active,profile,hour}:{context:WorldContext;active:boolean;profile:ReturnType<typeof graphicsProfile>;hour:number}){
 const settings=context.world.settings,weather=settings.weather,osReduced=useReducedMotion(),reduced=!!osReduced||settings.reduced_motion||settings.photosensitive,ref=useRef<InstancedMesh>(null),clouds=useRef<InstancedMesh>(null),invalidate=useThree(s=>s.invalidate),transform=useMemo(()=>new Object3D(),[]),direction=useMemo(()=>new Vector3(),[]),time=useRef(0),count=profile.rainCount;
 useEffect(()=>{invalidate();if(weather!=='rain'||!active||reduced)return;const id=setInterval(()=>{if(!document.hidden)invalidate();},1000/profile.rainFps);return()=>clearInterval(id);},[weather,active,reduced,profile.rainFps,invalidate]);
 useEffect(()=>{if(!clouds.current)return;for(let i=0;i<profile.cloudCount;i++){transform.position.set(Math.sin(i*2)*24,17+i%2,Math.cos(i*2)*20);transform.scale.set(5,1,3);transform.rotation.set(0,i,0);transform.updateMatrix();clouds.current.setMatrixAt(i,transform.matrix);}clouds.current.instanceMatrix.needsUpdate=true;invalidate();},[profile.cloudCount,weather,transform,invalidate]);
 useFrame(({camera},delta)=>{if(!ref.current||weather!=='rain')return;if(active&&!document.hidden&&!reduced)time.current+=Math.min(delta,.1);camera.getWorldDirection(direction);const groundDistance=Math.max(0,-camera.position.y/Math.min(-.1,direction.y)),cx=camera.position.x+direction.x*groundDistance,cz=camera.position.z+direction.z*groundDistance;for(let i=0;i<count;i++){transform.position.set(cx+Math.sin(i*47.2)*20,14-((i*.73+(reduced?0:time.current)*7)%14),cz+Math.cos(i*31.8)*17);transform.scale.set(1,1,1);transform.rotation.set(0,0,-.18);transform.updateMatrix();ref.current.setMatrixAt(i,transform.matrix);}ref.current.instanceMatrix.needsUpdate=true;});
 const environment=visualEnvironment(hour,weather);
 return <>{weather==='rain'&&<instancedMesh ref={ref} args={[undefined,undefined,count]} frustumCulled={false}><boxGeometry args={[.018,.19,.018]}/><meshBasicMaterial color={environment.night?'#9bb7cc':'#e4edf0'} transparent opacity={reduced?.2:.45} depthWrite={false}/></instancedMesh>}{['clouds','rain'].includes(weather)&&<instancedMesh ref={clouds} args={[undefined,undefined,profile.cloudCount]} frustumCulled={false}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color={environment.cloud} roughness={1}/></instancedMesh>}</>;
}
