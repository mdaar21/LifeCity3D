import {useEffect,useMemo,useState} from 'react';
import {BoxGeometry,BufferGeometry,Color,CylinderGeometry,Float32BufferAttribute,IcosahedronGeometry,MeshStandardMaterial} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {VEGETATION,CROPS,farmProgress} from '../../supabase/functions/_shared/world-horticulture';
import type {Decoration} from '../../supabase/functions/_shared/world-types';
import {AssetBox} from './StylizedAssets';
const cache=new Map<string,BufferGeometry>(),material=new MeshStandardMaterial({vertexColors:true,roughness:.9});
function geometry(id:string){if(cache.has(id))return cache.get(id)!;const species=VEGETATION.find(v=>v.id===id)??VEGETATION[0],family=species.family,parts:BufferGeometry[]=[];
 const part=(g:BufferGeometry,x:number,y:number,z:number,sx:number,sy:number,sz:number,tone:string,ry=0,rz=0)=>{const n=g.index?g.toNonIndexed():g.clone();g.dispose();n.scale(sx,sy,sz);n.rotateZ(rz);n.rotateY(ry);n.translate(x,y,z);const c=new Color(tone),colors=new Float32Array(n.getAttribute('position').count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}n.setAttribute('color',new Float32BufferAttribute(colors,3));n.deleteAttribute('uv');parts.push(n);};
 const ball=(x:number,y:number,z:number,sx:number,sy:number,sz:number,tone:string)=>part(new IcosahedronGeometry(1,1),x,y,z,sx,sy,sz,tone);
 const trunk=(height:number,r=.07,x=0,y=height/2,z=0,lean=0)=>part(new CylinderGeometry(r*.75,r,height,7),x,y,z,1,1,1,'#a5835b',0,lean);
 if(['date','fan','coconut','royal'].includes(family)){
  const h=family==='royal'?3.1:family==='coconut'?2.7:family==='date'?2.2:1.6;
  if(family==='coconut'){trunk(h*.55,.07,-.12,h*.275,0,-.1);trunk(h*.48,.06,.03,h*.75,0,-.24);}else trunk(h,family==='royal'?.12:.09);
  if(family==='date')for(let i=0;i<7;i++)part(new CylinderGeometry(.1,.1,.045,7),0,.3+i*.25,0,1,1,1,'#866d4c');
  if(family==='royal')part(new CylinderGeometry(.09,.11,.5,8),0,h-.1,0,1,1,1,'#72995d');
  for(let i=0;i<8;i++){const angle=i*Math.PI/4,x=Math.sin(angle),z=Math.cos(angle);if(family==='fan')for(let j=-2;j<=2;j++)part(new IcosahedronGeometry(1,0),x*.42+Math.cos(angle)*j*.08,h+.08,z*.42-Math.sin(angle)*j*.08,.1,.045,.4,'#769d64',angle+j*.22);else part(new IcosahedronGeometry(1,0),x*.38,h+(i%2)*.1,z*.38,.13,.085,family==='coconut'?.8:.62,i%2?'#82aa67':'#5c905c',angle,.12);}
  if(family==='date'||family==='coconut')for(let i=0;i<3;i++)ball(Math.sin(i*2)*.16,h-.3,Math.cos(i*2)*.16,.1,.18,.1,family==='date'?'#b58046':'#9a7047');
 }else if(family==='cypress'){trunk(.6);for(let i=0;i<3;i++)part(new CylinderGeometry(0,.32-i*.07,1.2,8),0,1+i*.45,0,1,1,1,['#527b63','#638b6c','#779d76'][i]);}
 else if(family==='hedge'){part(new BoxGeometry(1,.65,.45),0,.35,0,1,1,1,'#71955e');for(let i=0;i<4;i++)ball(-.4+i*.27,.67,0,.2,.15,.23,i%2?'#8ea976':'#779c64');}
 else if(family==='agave'){for(let i=0;i<10;i++)part(new IcosahedronGeometry(1,0),Math.sin(i)*.18,.3,Math.cos(i)*.18,.065,.48,.09,i%2?'#7ca78d':'#528577',i,-.65);}
 else if(family==='shrub'||family==='bougainvillea'){for(let i=0;i<5;i++){ball(Math.sin(i*2)*.25,.35+(i%2)*.15,Math.cos(i*2)*.2,.27,.3,.26,'#679660');ball(Math.sin(i*2)*.3,.55+(i%2)*.16,Math.cos(i*2)*.25,.12,.11,.12,family==='shrub'?'#eed5cf':'#c57caa');}}
 else{trunk(1.15,.075);const tones=family==='blossom'?['#daa1b7','#ecc1ca','#cc8fa9']:family==='purple'?['#a79ac9','#c7b4de','#8f8fba']:family==='olive'?['#8b9e79','#a9b695','#7d967a']:['#739b61','#96b378','#608a57'];for(let i=0;i<4;i++)ball(Math.sin(i*2)*.28,1.3+(i%2)*.25,Math.cos(i*2)*.25,.43,.45,.42,tones[i%3]);if(['orange','lemon','olive'].includes(family))for(let i=0;i<7;i++)ball(Math.sin(i*2.1)*.7,1.12+(i%3)*.17,Math.cos(i*2.1)*.7,family==='olive'?.045:.105,family==='lemon'?.13:.095,family==='olive'?.045:.09,family==='orange'?'#e5a154':family==='lemon'?'#e8cd69':'#526f51');}
 const merged=mergeGeometries(parts);for(const p of parts)p.dispose();merged.computeBoundingBox();const b=merged.boundingBox!,w=b.max.x-b.min.x,d=b.max.z-b.min.z;merged.scale(species.width*.94/w,1,species.depth*.94/d);cache.set(id,merged);return merged;
}
export function BotanicalPlant({species,scale=1}:{species:string;scale?:number}){return <mesh geometry={geometry(species)} material={material} scale={scale} castShadow receiveShadow dispose={null}/>;}
export function useGardenTime(serverNow:string,active=true){const anchor=useMemo(()=>({time:Date.parse(serverNow),start:performance.now()}),[serverNow]),[,tick]=useState(0);useEffect(()=>{if(!active)return;const id=setInterval(()=>{if(!document.hidden)tick(v=>v+1);},30000);return()=>clearInterval(id);},[active]);return new Date(anchor.time+Math.max(0,performance.now()-anchor.start)).toISOString();}
function cropGeometry(id:string,mature:boolean){const key='crop:'+id+':'+mature;if(cache.has(key))return cache.get(key)!;const parts:BufferGeometry[]=[];
 const part=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string,fruit=false)=>{const source=fruit?new IcosahedronGeometry(1,0):new BoxGeometry(1,1,1),g=source.index?source.toNonIndexed():source.clone();source.dispose();g.scale(sx,sy,sz);g.translate(x,y,z);const c=new Color(color),rgb=new Float32Array(g.getAttribute('position').count*3);for(let i=0;i<rgb.length;i+=3){rgb[i]=c.r;rgb[i+1]=c.g;rgb[i+2]=c.b;}g.setAttribute('color',new Float32BufferAttribute(rgb,3));g.deleteAttribute('uv');parts.push(g);};
 for(let i=0;i<9;i++){const x=(i%3-1)*.6,z=(Math.floor(i/3)-1)*.6,wheat=id==='wheat',carrot=id==='carrot',berry=id==='strawberry',h=wheat?.6:berry?.2:.4;part(x,h/2,z,.035,h,.035,wheat?'#b1ab6b':'#729864');for(let j=0;j<3;j++)part(x+Math.sin(j*2.1)*.1,h*.4+j*.04,z+Math.cos(j*2.1)*.1,.2,.07,.15,'#7eab72');if(mature){if(wheat)for(let k=0;k<4;k++)part(x+(k%2?.035:-.035),h+k*.06,z,.07,.12,.06,'#ddc27a');else if(id==='lavender')for(let k=0;k<3;k++)part(x+.06,h+k*.055,z,.08,.1,.08,'#b19fcf',true);else if(carrot)part(x,.035,z,.08,.18,.08,'#db9a5e',true);else for(let k=0;k<(berry?3:2);k++)part(x+Math.sin(k*3)*.09,h+(k%2)*.07,z+Math.cos(k*3)*.08,berry?.055:.09,.08,.07,berry?'#c77979':'#d39071',true);}}
 const merged=mergeGeometries(parts);for(const p of parts)p.dispose();cache.set(key,merged);return merged;
}
export function FarmModel({entity:e,now}:{entity:Decoration;now:string}){
 const farm=e.farm;if(!farm)return null;const crop=CROPS.find(v=>v.id===farm.crop?.id),state=farmProgress(farm,now),visible=!!crop&&state.stage!=='harvested',growth=.2+state.progress*.8;
 return <group><AssetBox at={[0,.06,0]} size={[e.width,.12,e.depth]} color="#a48158"/>{[-1,1].map(side=><AssetBox key={side} at={[side*(e.width/2-.05),.12,0]} size={[.1,.18,e.depth]} color="#c4ab7e"/>)}{Array.from({length:3},(_,i)=><AssetBox key={i} at={[0,.13,(i-1)*e.depth*.27]} size={[e.width*.9,.07,.1]} color="#735c42"/>)}
 {visible&&crop&&(farm.plot==='orchard'?Array.from({length:4},(_,i)=><group key={i} position={[(i%2-.5)*1.8,.15,(Math.floor(i/2)-.5)*1.8]}><BotanicalPlant species={crop.id==='orchard_dates'?'date_palm':crop.id==='orchard_lemon'?'lemon_tree':'orange_tree'} scale={growth*.62}/></group>):<mesh position={[0,.15,0]} scale={[1,growth,1]} geometry={cropGeometry(crop.id,state.progress>=.65)} material={material} castShadow dispose={null}/>)}
 </group>;
}
