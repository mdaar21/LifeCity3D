import {useCallback} from 'react';
import type {ThreeElements} from '@react-three/fiber';
import type {MeshStandardMaterial} from 'three';
import {useRenderQuality} from './RenderQuality';
import {surfaceNoiseMap} from './surface-noise';
export type SurfaceKind='stone'|'plaster'|'asphalt'|'grass'|'wood'|'fabric'|'skin'|'glass'|'metal';
type Props=ThreeElements['meshStandardMaterial']&{surface?:SurfaceKind};
/** World-space grain: continuous across merged geometry, no downloaded textures. */
export function SurfaceMaterial({surface='plaster',...props}:Props){
 const {materialDetail}=useRenderQuality();
 const compile=useCallback((shader:Parameters<MeshStandardMaterial['onBeforeCompile']>[0])=>{
  if(!materialDetail||surface==='glass'||surface==='metal')return;
  const scale=surface==='grass'?9:surface==='asphalt'?48:surface==='fabric'?110:surface==='wood'?14:32;
  const amplitude=surface==='grass'?.18:surface==='asphalt'?.12:surface==='skin'?.016:.055;
  const bump=surface==='grass'?.013:surface==='asphalt'?.007:surface==='skin'?.001:.004;
  shader.uniforms.lcGrainMap={value:surfaceNoiseMap()};
  // Skin, clothes and furniture grain move with the object, not through it.
  const coordinates=['fabric','skin','wood'].includes(surface)?'transformed':'(modelMatrix*vec4(transformed,1.)).xyz';
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 lcSurfacePosition;').replace('#include <begin_vertex>',`#include <begin_vertex>\nlcSurfacePosition=${coordinates};`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 lcSurfacePosition;
uniform sampler2D lcGrainMap;
float lcNoise(vec3 p){return texture2D(lcGrainMap,vec2(p.x+p.z*.37,p.y+p.z*.61)*.0625).r;}
float lcGrain(vec3 p){${surface==='wood'?'return .5+.5*sin(p.y*2.+lcNoise(p*.4)*5.+p.x*18.);':surface==='fabric'?'return .5+.25*sin(p.x*2.)+.25*sin(p.y*2.);':'return lcNoise(p);'}}`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float lcFine=lcGrain(lcSurfacePosition*${scale}.);
float lcBroad=lcNoise(lcSurfacePosition*${surface==='grass'?'1.6':'.7'});
diffuseColor.rgb*=1.+(lcFine-.5)*${amplitude}+(lcBroad-.5)*${surface==='grass'?'.22':'.035'};`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(lcFine-.5)*.1,.045,1.);');
  if(materialDetail>=2)shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
float lcHeight=lcFine*${bump};
vec3 lcQ0=dFdx(-vViewPosition),lcQ1=dFdy(-vViewPosition);
vec3 lcR1=cross(lcQ1,normal),lcR2=cross(normal,lcQ0);
float lcDet=dot(lcQ0,lcR1);
normal=normalize(abs(lcDet)*normal-sign(lcDet)*(dFdx(lcHeight)*lcR1+dFdy(lcHeight)*lcR2));`);
 },[materialDetail,surface]);
 const cacheKey=useCallback(()=>`lc-pbr-v3:${surface}:${materialDetail}`,[surface,materialDetail]);
 if(surface==='glass')return <meshPhysicalMaterial key={materialDetail} {...props} roughness={props.roughness??.16} metalness={props.metalness??.18} clearcoat={materialDetail?1:0} clearcoatRoughness={.12} envMapIntensity={1.1}/>;
 return <meshStandardMaterial key={'pbr3'+materialDetail+surface} {...props} onBeforeCompile={compile} customProgramCacheKey={cacheKey}/>;
}
