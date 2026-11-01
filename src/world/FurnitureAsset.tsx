import type {} from '@react-three/fiber';
import {BoxGeometry,BufferGeometry,Color,CylinderGeometry,IcosahedronGeometry,Float32BufferAttribute,MeshStandardMaterial} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {Furniture} from '../../supabase/functions/_shared/world-types';
import {MATERIALS} from '../../supabase/functions/_shared/world-planner';
const shapes=new Map<string,BufferGeometry>(),materials=new Map<string,MeshStandardMaterial>();
/** Detail is part of the purchased furnishing. No extra item or ownership is created. */
export function furnitureGeometry(type:string,w:number,d:number,color:string){
 const key=[type,w,d,color].join(':');if(shapes.has(key))return shapes.get(key)!;const parts:BufferGeometry[]=[];
 const part=(g:BufferGeometry,c:string,x:number,y:number,z:number)=>{const p=g.index?g.toNonIndexed():g.clone();g.dispose();p.translate(x,y,z);const tone=new Color(c),rgb=new Float32Array(p.attributes.position.count*3);for(let i=0;i<rgb.length;i+=3){rgb[i]=tone.r;rgb[i+1]=tone.g;rgb[i+2]=tone.b;}p.setAttribute('color',new Float32BufferAttribute(rgb,3));p.deleteAttribute('uv');parts.push(p);};
 const box=(x:number,y:number,z:number,ww:number,h:number,dd:number,c=color)=>part(new BoxGeometry(ww,h,dd),c,x,y,z);
 const legs=(height:number)=>{for(const x of [-1,1])for(const z of [-1,1])box(x*w*.38,height/2,z*d*.34,.055,height,.055,'#536166');};
 if(type==='bed'){box(0,.22,0,w,.3,d);box(0,.44,0,w-.06,.2,d-.04,'#e8dfcd');box(0,.71,-d*.45,w,.9,.09);box(0,.56,d*.18,w-.04,.055,d*.6,'#8ba89b');for(const x of [-1,1])box(x*w*.24,.59,-d*.31,w*.4,.14,d*.22,'#f7edda');legs(.12);}
 else if(type==='sofa'){legs(.18);box(0,.32,0,w,.35,d*.95);box(0,.66,-d*.38,w,.65,d*.22);for(const x of [-1,1])box(x*(w/2-.07),.5,0,.14,.55,d);for(let i=0;i<3;i++){box((i-1)*w*.285,.54,d*.06,w*.27,.13,d*.65,'#c6baa3');box((i-1)*w*.285,.77,-d*.23,w*.26,.34,.1,i===1?'#739c8c':'#d7c7ad');}}
 else if(type==='chair'){legs(.44);box(0,.48,0,w,.09,d);box(0,.75,-d*.44,w,.55,.06);for(const x of [-1,1])box(x*w*.38,.7,-d*.44,.04,.6,.05);}
 else if(type==='shelf'){for(const x of [-1,1])box(x*(w/2-.035),.85,0,.07,1.7,d);for(const y of [.08,.6,1.15,1.65])box(0,y,0,w,.07,d);box(0,.85,-d*.46,w,1.7,.035);}
 else if(type==='counter'){box(0,.45,0,w,.85,d);box(0,.9,0,w,.08,d,'#d8d9cb');for(let i=0;i<3;i++){box((i-1)*w*.32,.46,d/2-.02,w*.29,.65,.025,'#b69a73');box((i-1)*w*.32,.67,d/2,.09,.025,.025,'#586565');}}
 else if(type==='plant'){part(new CylinderGeometry(w*.35,w*.25,.35,10),'#b9976c',0,.175,0);for(let i=0;i<7;i++){const g=new IcosahedronGeometry(1,0);g.scale(w*.22,.25,d*.22);g.rotateZ(Math.sin(i)*.65);part(g,i%2?'#739654':'#5b8157',Math.sin(i*2)*w*.21,.47+(i%3)*.1,Math.cos(i*2)*d*.2);}}
 else{legs(.67);box(0,.72,0,w,.1,d);box(0,.66,0,w*.9,.035,d*.9,'#665c4b');}
 const geometry=mergeGeometries(parts)!;for(const g of parts)g.dispose();geometry.computeBoundingBox();const bounds=geometry.boundingBox!;geometry.scale(Math.min(1,w*.5/Math.max(Math.abs(bounds.min.x),Math.abs(bounds.max.x))),1,Math.min(1,d*.5/Math.max(Math.abs(bounds.min.z),Math.abs(bounds.max.z))));shapes.set(key,geometry);return geometry;
}
export function FurnitureAsset({item:f}:{item:Furniture}){
 const finish=MATERIALS.find(m=>m.id===f.material)??MATERIALS.find(m=>m.id==='wood')!,key=finish.id;
 if(!materials.has(key))materials.set(key,new MeshStandardMaterial({vertexColors:true,roughness:finish.roughness,metalness:finish.metalness}));
 return <mesh name="owned-furniture-detail" geometry={furnitureGeometry(f.type,f.width,f.depth,finish.color)} material={materials.get(key)} castShadow receiveShadow dispose={null}/>;
}
