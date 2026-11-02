import {useMemo,useEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Mesh,ShaderMaterial} from 'three';
import type {Avatar,Realm} from '../../supabase/functions/_shared/world-types';
import {worldRuntime} from './useWorldUI';
/** Soft foot contact remains on the ground during the transient visual jump. */
export function FootContact({avatar,realm}:{avatar:Avatar;realm:Realm}){
 const ref=useRef<Mesh>(null),material=useMemo(()=>new ShaderMaterial({transparent:true,depthWrite:false,uniforms:{strength:{value:.2}},vertexShader:'varying vec2 coord;void main(){coord=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float strength;varying vec2 coord;void main(){float a=pow(max(0.,1.-dot(coord,coord)),2.)*strength;gl_FragColor=vec4(.025,.045,.04,a);}' }),[]);
 useEffect(()=>()=>material.dispose(),[material]);
 useFrame(()=>{if(!ref.current)return;const live=worldRuntime.realm===realm,p=live&&worldRuntime.pose?worldRuntime.pose:avatar.pose,h=live?worldRuntime.jump.height:0;ref.current.position.set(p.x,p.y+.012,p.z);ref.current.scale.setScalar(1+h*.4);material.uniforms.strength.value=.24/(1+h*1.5);});
 return <mesh ref={ref} rotation={[-Math.PI/2,0,0]} visible={avatar.mode!=='drive'&&avatar.mode!=='first'} material={material} raycast={()=>{}}><planeGeometry args={[.65,.85]}/></mesh>;
}
