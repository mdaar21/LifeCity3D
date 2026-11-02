import {useEffect,useMemo} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {HalfFloatType,PerspectiveCamera,Vector2,WebGLRenderTarget} from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {useRenderQuality} from './RenderQuality';
/** One render owner. Previews and low/medium profiles use Fiber's normal path. */
export function RenderEffects(){
 const profile=useRenderQuality();
 return profile.ao?<ComposedEffects bloom={profile.bloom} scale={profile.aoScale}/>:null;
}
function ComposedEffects({bloom,scale}:{bloom:boolean;scale:number}){
 const {gl,scene,camera,size,viewport,invalidate}=useThree();
 const pipeline=useMemo(()=>{
  const target=new WebGLRenderTarget(1,1,{type:HalfFloatType,samples:Math.min(4,gl.capabilities.maxSamples)}),composer=new EffectComposer(gl,target);
  const render=new RenderPass(scene,camera),ao=new SSAOPass(scene,camera,1,1,bloom?16:8),output=new OutputPass();
  ao.ssaoMaterial.defines.PERSPECTIVE_CAMERA=camera instanceof PerspectiveCamera?1:0;
  ao.kernelRadius=.7;ao.minDistance=.035/Math.max(1,camera.far-camera.near);ao.maxDistance=2/Math.max(1,camera.far-camera.near);
  composer.addPass(render);composer.addPass(ao);
  const glow=bloom?new UnrealBloomPass(new Vector2(1,1),.14,.45,1.35):null;
  if(glow)composer.addPass(glow);composer.addPass(output);
  return {composer,ao,render,glow,output};
 },[gl,scene,camera,bloom]);
 useEffect(()=>{
  pipeline.composer.setPixelRatio(viewport.dpr);pipeline.composer.setSize(size.width,size.height);
  pipeline.ao.setSize(Math.max(1,Math.round(size.width*viewport.dpr*scale)),Math.max(1,Math.round(size.height*viewport.dpr*scale)));invalidate();
 },[pipeline,size.width,size.height,viewport.dpr,scale,invalidate]);
 useEffect(()=>()=>{pipeline.composer.dispose();pipeline.ao.dispose();pipeline.ao.ssaoMaterial.dispose();pipeline.ao.noiseTexture?.dispose();pipeline.render.dispose();pipeline.glow?.dispose();pipeline.output.dispose();},[pipeline]);
 useEffect(()=>{const previous=gl.info.autoReset;gl.info.autoReset=false;return()=>{gl.info.autoReset=previous;};},[gl]);
 useFrame(()=>gl.info.reset(),-100);
 useFrame((_,delta)=>{
  // Orthographic zoom, walking, pinch and floor inspection can all change these.
  pipeline.ao.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(camera.projectionMatrix);
  pipeline.ao.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(camera.projectionMatrixInverse);
  pipeline.composer.render(Math.min(delta,.1));
 },1);
 return null;
}
