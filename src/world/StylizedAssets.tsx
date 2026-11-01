import {palmGeometry} from './palm-geometry';
import {BoxGeometry,Color,CylinderGeometry,Float32BufferAttribute,IcosahedronGeometry,MeshStandardMaterial,BufferGeometry,DoubleSide} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {VISUAL,visualSeed} from './visual-style';
const cube=new BoxGeometry(1,1,1),materials=new Map<string,MeshStandardMaterial>();
function material(color:string,ghost=false){const key=color+ghost;let m=materials.get(key);if(!m){m=new MeshStandardMaterial({color,roughness:.82,transparent:ghost,opacity:ghost?.55:1});materials.set(key,m);}return m;}
export function AssetBox({at,size,color,ghost=false}:{at:[number,number,number];size:[number,number,number];color:string;ghost?:boolean}){return <mesh geometry={cube} material={material(color,ghost)} position={at} scale={size} castShadow receiveShadow dispose={null}/>;}
const plantCache=new Map<string,BufferGeometry>(),plantMaterial=new MeshStandardMaterial({vertexColors:true,roughness:.95,side:DoubleSide});
function plantGeometry(kind:string,variant:number){const key=kind+variant;if(plantCache.has(key))return plantCache.get(key)!;if(kind==='palm'){const g=palmGeometry('date',false);g.scale(.42,.52,.42);plantCache.set(key,g);return g;}const pieces:BufferGeometry[]=[];
 const part=(geometry:BufferGeometry,x:number,y:number,z:number,sx:number,sy:number,sz:number,tone:string,ry=0,rz=0)=>{const g=geometry.index?geometry.toNonIndexed():geometry.clone();geometry.dispose();g.scale(sx,sy,sz);g.rotateZ(rz);g.rotateY(ry);g.translate(x,y,z);const c=new Color(tone),colors=new Float32Array(g.getAttribute('position').count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}g.setAttribute('color',new Float32BufferAttribute(colors,3));pieces.push(g);};
 if(kind==='pine'){part(new CylinderGeometry(.05,.07,.8,7),0,.4,0,1,1,1,VISUAL.wood);for(let i=0;i<3;i++)part(new CylinderGeometry(0,.43-i*.09,.6,7),0,.8+i*.32,0,1,1,1,['#528573','#669878','#7ca581'][i]);}
 else{part(new CylinderGeometry(.045,.07,.85,7),0,.42,0,1,1,1,VISUAL.wood);const shades=kind==='flowering'?['#d99bb1','#e7b3c2','#c68ba7']:variant===1?['#789b60','#a5b878','#688a57']:['#65956b','#8aae76','#507d63'];for(let i=0;i<4;i++)part(new IcosahedronGeometry(1,1),i?Math.sin(i*2.2)*.21:0,i?1.04:1.32,i?Math.cos(i*2.2)*.17:0,i?.29:.36,i?.34:.42,i?.29:.36,shades[i%3]);}
 if(kind==='shade'||kind==='flowering')for(let i=0;i<12;i++){const angle=i*2.4;part(new IcosahedronGeometry(1,0),Math.sin(angle)*.31,1.05+(i%3)*.14,Math.cos(angle)*.31,.14,.16,.14,kind==='flowering'?(i%2?'#d48aa7':'#e7b0c0'):(i%2?'#779d61':'#94ae73'));}
 const merged=mergeGeometries(pieces);for(const p of pieces)p.dispose();plantCache.set(key,merged);return merged;}
export function StylizedPlant({kind='shade',seed='tree',ghost=false,valid=true}:{kind?:'shade'|'palm'|'flowering'|'pine';seed?:string;ghost?:boolean;valid?:boolean}){const value=visualSeed(seed),scale=.88+(value%9)/100;return <mesh geometry={plantGeometry(kind,value%3)} material={ghost?material(valid?'#6baa91':'#ce6e68',true):plantMaterial} scale={[scale,scale,scale]} rotation={[0,value%628/100,0]} castShadow dispose={null}/>;}
const roofGeometry=(()=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute([-.5,0,-.5,.5,0,-.5,0,1,-.5,-.5,0,.5,0,1,.5,.5,0,.5,-.5,0,-.5,0,1,-.5,-.5,0,.5,0,1,-.5,0,1,.5,-.5,0,.5,.5,0,-.5,.5,0,.5,0,1,-.5,0,1,-.5,.5,0,.5,0,1,.5],3));const a=g.getAttribute('position').array;for(let i=0;i<a.length;i+=9)for(let axis=0;axis<3;axis++){const t=a[i+3+axis];a[i+3+axis]=a[i+6+axis];a[i+6+axis]=t;}g.computeVertexNormals();return g;})();
export function GableRoof({width,depth,height,color,ghost=false}:{width:number;depth:number;height:number;color:string;ghost?:boolean}){return <mesh geometry={roofGeometry} material={material(color,ghost)} scale={[width,height,depth]} castShadow dispose={null}/>;}
const architectureCache=new Map<string,BufferGeometry>(),architectureMaterial=new MeshStandardMaterial({vertexColors:true,roughness:.82});
function architectureGeometry(family:string,w:number,d:number,h:number,night:boolean){
 const key=[family,w,d,h,night].join(':');if(architectureCache.has(key))return architectureCache.get(key)!;const parts:BufferGeometry[]=[];
 const colored=(g:BufferGeometry,tone:string)=>{const c=new Color(tone),colors=new Float32Array(g.getAttribute('position').count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}g.setAttribute('color',new Float32BufferAttribute(colors,3));parts.push(g);};
 const box=(at:[number,number,number],size:[number,number,number],tone:string)=>{const g=cube.toNonIndexed();g.scale(...size);g.translate(...at);colored(g,tone);};
 const tower=family==='tower',apartment=family==='apartment',palace=family==='palace',villa=family==='villa',levels=tower?10:apartment?3:palace?3:villa?2:1;
 box([0,.06,0],[w+.12,.12,d+.12],'#c7c7b5');box([0,h/2+.12,0],[w,h,d],tower?'#bdd1d5':apartment?'#e6c8a4':palace?'#e8dac0':'#f1e4cf');
 for(let i=0;i<levels;i++){
  const floor=h/levels,y=.3+(i+.5)*(h-.15)/levels;
  box([0,y+floor*.45,0],[w+.06,.055,d+.06],'#e4decc');
  for(const side of [-1,1]){
   for(const x of [-.28,.28]){
    const ww=w*(tower?.28:.22),hh=floor*.56,zz=side*(d/2+.025);
    box([w*x,y,zz],[ww+.065,hh+.065,.05],VISUAL.navy);
    box([w*x,y,zz+side*.032],[ww,hh,.025],night?'#f2ce8e':VISUAL.glass);
    box([w*x,y,zz+side*.05],[.025,hh,.02],'#d4decd');
    box([w*x,y-hh/2-.035,zz+side*.035],[ww+.12,.045,.1],VISUAL.ivory);
    if(!tower)box([w*x,y+hh/2+.06,zz+side*.04],[ww+.15,.045,.13],'#c8b18b');
   }
   box([side*(w/2+.018),y,0],[.035,floor*.55,d*.45],night?'#f2ce8e':VISUAL.glass);
   box([side*(w/2+.04),y,0],[.025,floor*.55,.03],VISUAL.ivory);
  }
 }
 for(const x of [-1,1])for(const z of [-1,1])box([x*w*.487,h/2+.15,z*d*.487],[.055,h,.055],'#d1c1a6');
 for(let row=0;row<2;row++)for(let k=0;k<Math.ceil(w/.35);k++)box([-w/2+(k+.5)*w/Math.ceil(w/.35),.16+row*.07,d/2+.02],[.008,.06,.01],'#f0e5cf');

 box([0,.43,d/2+.025],[Math.min(.35,w*.24),.62,.055],VISUAL.wood);box([0,.86,d/2+.09],[w*.4,.065,.2],tower?VISUAL.navy:VISUAL.ocean);
 if(family==='home'){const roof=roofGeometry.clone();roof.scale(w+.12,.48,d+.12);roof.translate(0,h+.13,0);colored(roof,'#bd795e');}
 else{box([0,h+.16,0],[w+.1,.12,d+.1],tower?VISUAL.navy:VISUAL.ivory);box([0,h+.38,0],[w*.6,.32,d*.55],tower?VISUAL.ocean:VISUAL.cream);if(villa){for(const x of [-1,1])for(const z of [-1,1])box([x*w*.32,h+.42,z*d*.3],[.04,.55,.04],VISUAL.wood);for(let i=0;i<8;i++)box([-w*.36+i*w*.103,h+.7,0],[.035,.045,d*.72],VISUAL.wood);}if(palace)for(const side of [-1,1])box([side*w*.35,h+.45,0],[w*.17,.5,d*.28],VISUAL.earth);}
 // Roofs have no UVs; this material uses only vertex colors. Keep merged attributes uniform.
 for(const p of parts)p.deleteAttribute('uv');const merged=mergeGeometries(parts);for(const p of parts)p.dispose();architectureCache.set(key,merged);return merged;
}
export function ArchitectureAsset({family,width:w,depth:d,height:h,ghost=false,valid=true,night=false}:{family:'home'|'villa'|'apartment'|'tower'|'palace';width:number;depth:number;height:number;ghost?:boolean;valid?:boolean;night?:boolean}){
 return <mesh geometry={architectureGeometry(family,w,d,h,night)} material={ghost?material(valid?VISUAL.mint:VISUAL.warning,true):architectureMaterial} castShadow receiveShadow dispose={null}/>;
}
