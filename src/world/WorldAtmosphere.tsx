import {useEffect,useMemo,useRef,useState} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Color,DirectionalLight,Fog,HemisphereLight,Object3D,Vector3} from 'three';
import type {WorldContext} from '../../supabase/functions/_shared/world-types';
import {worldHour} from '../../supabase/functions/_shared/world-environment';
import {visualEnvironment,type graphicsProfile} from './graphics-profile';
export function useVisualHour(context:WorldContext,active:boolean){
 const anchor=useMemo(()=>({now:Date.parse(context.now),at:performance.now()}),[context.now]),[,tick]=useState(0),settings=context.world.settings;
 useEffect(()=>{if(!active||settings.clock==='fixed'||settings.clock==='real'&&settings.hour!==null)return;const id=setInterval(()=>{if(!document.hidden)tick(x=>x+1);},settings.clock==='game'?5000:60000);return()=>clearInterval(id);},[active,settings.clock,settings.hour]);
 return worldHour({...context,now:new Date(anchor.now+Math.max(0,performance.now()-anchor.at)).toISOString()});
}
export function WorldAtmosphere({hour,weather,profile,center=[0,0,0],span=32}:{hour:number;weather:string;profile:ReturnType<typeof graphicsProfile>;center?:[number,number,number];span?:number}){
 const scene=useThree(s=>s.scene),environment=visualEnvironment(hour,weather),sun=useRef<DirectionalLight>(null),sunTarget=useRef<Object3D>(null),hemisphere=useRef<HemisphereLight>(null),fog=useRef<Fog>(null),direction=useMemo(()=>new Vector3(),[]);
 useEffect(()=>{const original=scene.background;scene.background=new Color(environment.sky);return()=>{scene.background=original;};},[scene,environment.sky]);
 useFrame(({camera})=>{if(!fog.current)return;camera.getWorldDirection(direction);const distance=Math.min(140,Math.max(12,Math.abs(camera.position.y/Math.min(-.1,direction.y))));fog.current.near=weather==='fog'?distance*.8:distance+35;fog.current.far=fog.current.near+Math.min(environment.fog,profile.far);});
 useEffect(()=>{if(sun.current&&sunTarget.current)sun.current.target=sunTarget.current;},[]);
 const angle=(hour-6)/12*Math.PI,extent=Math.max(14,Math.min(75,span*1.1));
 useEffect(()=>{sun.current?.shadow.camera.updateProjectionMatrix();},[extent]);
 return <><fog ref={fog} attach="fog" args={[environment.sky,40,200]}/><ambientLight intensity={environment.ambient}/><hemisphereLight ref={hemisphere} args={[environment.sky,environment.ground,environment.night?.65:1.05]}/><group position={center}><object3D ref={sunTarget}/><directionalLight ref={sun} position={[Math.cos(angle)*23,environment.night?22:Math.max(8,Math.sin(angle)*30),10]} color={environment.sunColor} intensity={environment.sun} castShadow={profile.shadows} shadow-mapSize={[profile.shadowSize,profile.shadowSize]} shadow-camera-left={-extent} shadow-camera-right={extent} shadow-camera-top={extent} shadow-camera-bottom={-extent} shadow-normalBias={.025}/></group></>;
}
