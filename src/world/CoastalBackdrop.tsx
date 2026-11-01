import {useEffect,useMemo} from 'react';
import {Color,ShaderMaterial} from 'three';
import {visualEnvironment} from './graphics-profile';
/** A technical ocean backdrop only; never an owned item or seeded city entity. */
export function CoastalBackdrop({hour=12,weather='clear'}:{hour?:number;weather?:string}){
 const water=visualEnvironment(hour,weather).water;
 const material=useMemo(()=>new ShaderMaterial({uniforms:{tone:{value:new Color(water)}},vertexShader:`varying vec3 waterPosition;void main(){vec4 world=modelMatrix*vec4(position,1.);waterPosition=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,fragmentShader:`uniform vec3 tone;varying vec3 waterPosition;void main(){vec2 p=waterPosition.xz;float ripple=sin(p.x*3.9+sin(p.y*1.9))*.012+sin(p.y*5.5+p.x*.7)*.008;float crest=pow(max(0.,sin(p.y*8.3+sin(p.x*2.2)*1.4)),36.)*.025;vec3 color=tone*(.87+ripple)+vec3(crest);gl_FragColor=vec4(color,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`}),[water]);
 useEffect(()=>()=>material.dispose(),[material]);
 return <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.32,0]} material={material} raycast={()=>{}}><planeGeometry args={[220,220]}/></mesh>;
}
