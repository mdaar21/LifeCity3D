import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {BackSide,Color,DataTexture,EquirectangularReflectionMapping,FloatType,Mesh,PMREMGenerator,RGBAFormat,ShaderMaterial,Vector3} from 'three';
import {visualEnvironment} from './graphics-profile';
import {useRenderQuality} from './RenderQuality';
/** Original sky and HDR image-based lighting, generated locally once per light change. */
export function SkyEnvironment({hour,weather}:{hour:number;weather:string}){
 const {gl,scene,invalidate}=useThree(),profile=useRenderQuality(),dome=useRef<Mesh>(null),bucket=Math.round(hour*4)/4;
 const env=useMemo(()=>visualEnvironment(bucket,weather),[bucket,weather]);
 const sky=useMemo(()=>new Color(env.sky),[env.sky]),horizon=useMemo(()=>new Color(env.horizon),[env.horizon]),ground=useMemo(()=>new Color(env.ground).multiplyScalar(.35),[env.ground]);
 const direction=useMemo(()=>{const angle=(bucket-6)/12*Math.PI;return new Vector3(Math.cos(angle),env.night?.65:Math.max(.08,Math.sin(angle)),.35).normalize();},[bucket,env.night]);
 const material=useMemo(()=>new ShaderMaterial({side:BackSide,depthWrite:false,depthTest:false,uniforms:{sky:{value:sky},horizon:{value:horizon},sun:{value:direction},night:{value:env.night?1:0}},vertexShader:'varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}',fragmentShader:`uniform vec3 sky,horizon,sun;uniform float night;varying vec3 skyDirection;void main(){vec3 d=normalize(skyDirection);float h=pow(clamp(d.y,0.,1.),.55);vec3 c=mix(horizon,sky,h);float alignment=max(0.,dot(d,sun));c+=vec3(1.,.85,.65)*pow(alignment,96.)*.1;c+=mix(vec3(3.,2.3,1.4),vec3(.7,.8,1.),night)*smoothstep(.9995,.9999,alignment);gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`}),[sky,horizon,direction,env.night]);
 useEffect(()=>()=>material.dispose(),[material]);
 useEffect(()=>{
  const width=profile.environmentSize*2,height=profile.environmentSize,data=new Float32Array(width*height*4),color=new Color(),ray=new Vector3();
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const theta=(y+.5)/height*Math.PI,phi=(x+.5)/width*Math.PI*2;ray.set(-Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi));
   color.copy(ray.y<0?ground:horizon).lerp(ray.y<0?horizon:sky,ray.y<0?Math.pow(1+ray.y,8):Math.pow(ray.y,.55));
   const sun=Math.pow(Math.max(0,ray.dot(direction)),700)*(env.night?.4:weather==='rain'?.8:7);color.r+=sun;color.g+=sun*.88;color.b+=sun*.68;
   const i=(y*width+x)*4;data[i]=color.r;data[i+1]=color.g;data[i+2]=color.b;data[i+3]=1;
  }
  const input=new DataTexture(data,width,height,RGBAFormat,FloatType);input.mapping=EquirectangularReflectionMapping;input.needsUpdate=true;
  const generator=new PMREMGenerator(gl),target=generator.fromEquirectangular(input),previous=scene.environment,oldIntensity=scene.environmentIntensity;
  scene.environment=target.texture;scene.environmentIntensity=env.night?.6:.55;invalidate();input.dispose();generator.dispose();
  return()=>{scene.environment=previous;scene.environmentIntensity=oldIntensity;target.dispose();};
 },[gl,scene,profile.environmentSize,sky,horizon,ground,direction,env.night,weather,invalidate]);
 useFrame(({camera})=>{dome.current?.position.copy(camera.position);});
 return <mesh ref={dome} material={material} renderOrder={-1000} frustumCulled={false} raycast={()=>{}}><sphereGeometry args={[1800,24,12]}/></mesh>;
}
