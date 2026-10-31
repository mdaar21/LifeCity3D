import {useEffect,useMemo,useRef,useState} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Color,DirectionalLight,Fog,HemisphereLight,Vector3} from 'three';
import type {WorldContext} from '../../supabase/functions/_shared/world-types';
import {worldHour} from '../../supabase/functions/_shared/world-environment';
import {visualEnvironment,type graphicsProfile} from './graphics-profile';
export function useVisualHour(context:WorldContext,active:boolean){
 const anchor=useMemo(()=>({now:Date.parse(context.now),at:performance.now()}),[context.now]),[,tick]=useState(0),settings=context.world.settings;
 useEffect(()=>{if(!active||settings.clock==='fixed'||settings.clock==='real'&&settings.hour!==null)return;const id=setInterval(()=>{if(!document.hidden)tick(x=>x+1);},settings.clock==='game'?5000:60000);return()=>clearInterval(id);},[active,settings.clock,settings.hour]);
 return worldHour({...context,now:new Date(anchor.now+Math.max(0,performance.now()-anchor.at)).toISOString()});
}
export function WorldAtmosphere({hour,weather,profile}:{hour:number;weather:string;profile:ReturnType<typeof graphicsProfile>}){
 const scene=useThree(s=>s.scene),environment=visualEnvironment(hour,weather),sun=useRef<DirectionalLight>(null),hemisphere=useRef<HemisphereLight>(null),fog=useRef<Fog>(null),direction=useMemo(()=>new Vector3(),[]);
 useEffect(()=>{const original=scene.background;scene.background=new Color(environment.sky);return()=>{scene.background=original;};},[scene,environment.sky]);
 useFrame(({camera})=>{if(!fog.current)return;camera.getWorldDirection(direction);const distance=Math.min(140,Math.max(12,Math.abs(camera.position.y/Math.min(-.1,direction.y))));fog.current.near=weather==='fog'?distance*.8:distance+35;fog.current.far=fog.current.near+Math.min(environment.fog,profile.far);});
 const angle=(hour-6)/12*Math.PI;
 return <><fog ref={fog} attach="fog" args={[environment.sky,40,200]}/><ambientLight intensity={environment.ambient}/><hemisphereLight ref={hemisphere} args={[environment.sky,environment.ground,environment.night?.65:1.05]}/><directionalLight ref={sun} position={[Math.cos(angle)*23,environment.night?22:Math.max(8,Math.sin(angle)*30),10]} color={environment.sunColor} intensity={environment.sun} castShadow={profile.shadows} shadow-mapSize={[profile.shadowSize,profile.shadowSize]} shadow-camera-left={-80} shadow-camera-right={80} shadow-camera-top={80} shadow-camera-bottom={-80} shadow-normalBias={.04}/></>;
}
