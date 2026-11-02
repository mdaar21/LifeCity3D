import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useReducedMotion} from 'framer-motion';
import {Color,ShaderMaterial,Vector3} from 'three';
import {visualEnvironment} from './graphics-profile';
import {useRenderQuality} from './RenderQuality';
/** Technical ocean backdrop; waves never change owned terrain or collision. */
export function CoastalBackdrop({hour=12,weather='clear',active=true,reduced=false}:{hour?:number;weather?:string;active?:boolean;reduced?:boolean}){
 const profile=useRenderQuality(),osReduced=useReducedMotion(),invalidate=useThree(s=>s.invalidate),time=useRef(0),environment=visualEnvironment(hour,weather),angle=(hour-6)/12*Math.PI;
 const material=useMemo(()=>new ShaderMaterial({defines:{WATER_DETAIL:profile.waterDetail},uniforms:{tone:{value:new Color()},horizon:{value:new Color()},sunColor:{value:new Color()},sunDirection:{value:new Vector3()},time:{value:0},storm:{value:0}},vertexShader:`varying vec3 waterPosition;uniform float time;void main(){vec3 p=position;
#if WATER_DETAIL >= 3
p.z+=sin(p.x*.7+time*.8)*.012+sin(p.y*.9-time*.6)*.008;
#endif
vec4 world=modelMatrix*vec4(p,1.);waterPosition=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,fragmentShader:`uniform vec3 tone,horizon,sunColor,sunDirection;uniform float time,storm;varying vec3 waterPosition;
void main(){vec2 p=waterPosition.xz;float distanceToEye=length(cameraPosition-waterPosition);float waveFade=1.-smoothstep(15.,80.,distanceToEye);vec3 view=normalize(cameraPosition-waterPosition);
float a=p.x*1.9+p.y*1.3+time*.75,b=p.y*3.3-p.x*.8-time*.6;
vec2 slope=vec2(cos(a)*.045-cos(b)*.018,cos(a)*.03+cos(b)*.07);
#if WATER_DETAIL >= 2
slope+=vec2(cos(p.x*8.+p.y*4.+time*1.7),sin(p.y*11.-p.x*3.-time*1.3))*.025*(1.-smoothstep(12.,70.,distanceToEye));
#endif
#if WATER_DETAIL >= 4
slope+=vec2(sin(p.x*19.+p.y*13.+time*2.1),cos(p.y*17.-p.x*11.-time*1.8))*.012*(1.-smoothstep(8.,40.,distanceToEye));
#endif
slope*=waveFade;vec3 normal=normalize(vec3(-slope.x,1.,-slope.y));float fresnel=.08+.65*pow(1.-max(0.,dot(normal,view)),4.);
vec3 reflected=reflect(-view,normal);vec3 reflection=mix(horizon,sunColor,.04);
float glint=pow(max(0.,dot(reflected,sunDirection)),WATER_DETAIL>=3?180.:80.);
vec3 color=mix(tone*(.84+(sin(a)*.025+sin(b)*.02)*waveFade),reflection,fresnel);
color+=sunColor*glint*(1.-storm*.7)*.65;
#if WATER_DETAIL >= 3
float foam=smoothstep(.965,1.,sin(a)*.5+sin(b)*.5)*.04*waveFade;color+=vec3(foam);
#endif
float haze=1.-exp(-length(cameraPosition-waterPosition)*.0015);color=mix(color,horizon,haze*.65);
gl_FragColor=vec4(color,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}),[profile.waterDetail]);
 useEffect(()=>{material.uniforms.tone.value.set(environment.water);material.uniforms.horizon.value.set(environment.horizon);material.uniforms.sunColor.value.set(environment.sunColor);material.uniforms.sunDirection.value.set(Math.cos(angle),environment.night?.65:Math.max(.08,Math.sin(angle)),.35).normalize();material.uniforms.storm.value=weather==='rain'?1:0;invalidate();},[material,environment.water,environment.horizon,environment.sunColor,environment.night,angle,weather,invalidate]);
 useEffect(()=>()=>material.dispose(),[material]);
 useEffect(()=>{if(!active||reduced||osReduced)return;const id=setInterval(()=>{if(!document.hidden)invalidate();},1000/profile.effectFps);return()=>clearInterval(id);},[active,reduced,osReduced,profile.effectFps,invalidate]);
 useFrame((_,delta)=>{if(active&&!reduced&&!osReduced&&!document.hidden)time.current+=Math.min(delta,.1);material.uniforms.time.value=time.current;});
 return <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.32,0]} material={material} raycast={()=>{}}><planeGeometry args={[1800,1800,profile.waterDetail>=3?32:1,profile.waterDetail>=3?32:1]}/></mesh>;
}
