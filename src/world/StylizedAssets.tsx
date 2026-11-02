import {SurfaceMaterial,type SurfaceKind} from './SurfaceMaterial';
import {useRenderQuality} from './RenderQuality';
import {premiumArchitecture,type ArchitectureFamily} from './premium-architecture';
import {palmGeometry} from './palm-geometry';
import {BoxGeometry,Color,CylinderGeometry,Float32BufferAttribute,IcosahedronGeometry,MeshStandardMaterial,BufferGeometry,DoubleSide} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {VISUAL,visualSeed} from './visual-style';
const cube=new BoxGeometry(1,1,1),materials=new Map<string,MeshStandardMaterial>();
function material(color:string,ghost=false){const key=color+ghost;let m=materials.get(key);if(!m){m=new MeshStandardMaterial({color,roughness:.82,transparent:ghost,opacity:ghost?.55:1});materials.set(key,m);}return m;}
export function AssetBox({at,size,color,ghost=false,surface='plaster'}:{at:[number,number,number];size:[number,number,number];color:string;ghost?:boolean;surface?:SurfaceKind}){return <mesh geometry={cube} position={at} scale={size} castShadow receiveShadow dispose={null}><SurfaceMaterial surface={surface} color={color} roughness={surface==='asphalt'?.94:.8} transparent={ghost} opacity={ghost?.55:1}/></mesh>;}
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
const architectureCache=new Map<string,ReturnType<typeof premiumArchitecture>>();
function architectureGeometry(family:string,w:number,d:number,h:number,night:boolean,low:boolean){
 const key=[family,w,d,h,night,low].join(':');if(architectureCache.has(key))return architectureCache.get(key)!;const familyMap:Record<string,ArchitectureFamily>={home:'house',villa:'villa',apartment:'apartment',palace:'palace',tower:'office'};
 const count=family==='tower'?10:family==='apartment'||family==='palace'?3:family==='villa'?2:1;
 const shapes=premiumArchitecture({low,family:familyMap[family],width:w,depth:d,style:family==='villa'?'coastal':family==='palace'?'desert':'forest',floors:Array.from({length:count},(_,index)=>({index,height:h/count,rooms:[],corridor:{x:w*.4,z:0,width:w*.2,depth:d},stairs:null,elevator:null})),finished:true,roofPaid:true,glassAt:()=>night?'#e5c68e':'#82aeb9'});
 for(const geometry of Object.values(shapes))geometry.translate(-w/2,0,-d/2);architectureCache.set(key,shapes);return shapes;
}
export function ArchitectureAsset({family,width:w,depth:d,height:h,ghost=false,valid=true,night=false}:{family:'home'|'villa'|'apartment'|'tower'|'palace';width:number;depth:number;height:number;ghost?:boolean;valid?:boolean;night?:boolean}){
 const profile=useRenderQuality(),shapes=architectureGeometry(family,w,d,h,night,profile.level==='low');
 return <group>{Object.entries(shapes).map(([key,geometry])=>geometry.getAttribute('position').count>0&&<mesh key={key} geometry={geometry} castShadow={key!=='glass'} receiveShadow dispose={null}><SurfaceMaterial surface={key==='glass'?'glass':key==='roof'?'stone':'plaster'} vertexColors={!ghost} color={ghost?(valid?VISUAL.mint:VISUAL.warning):'#ffffff'} roughness={key==='glass'?.16:.82} metalness={key==='glass'?.18:0} transparent={ghost} opacity={ghost?.55:1} emissive={night&&key==='glass'?'#e5c68e':'#000000'} emissiveIntensity={.2}/></mesh>)}</group>;
}
