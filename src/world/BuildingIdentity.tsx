import type {} from '@react-three/fiber';
import {useEffect,useMemo} from 'react';
import {BoxGeometry,BufferGeometry,Color,CylinderGeometry,Float32BufferAttribute,MeshStandardMaterial,SphereGeometry} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {Archetype,Building} from '../../supabase/functions/_shared/world-types';
import {BUILDING_CATALOG} from '../../supabase/functions/_shared/building-catalog';
import {buildingSurface} from './ArchitecturalDetails';

/** Original architectural skins only. Never adds furniture, usable floors or
 * entities. Roof and facade batches are shown only after those stages are paid. */
export function identityGeometry(kind:Archetype,w:number,d:number,floors:number,roofColor:string,wallColor:string){
 const roofs:BufferGeometry[]=[],fronts:BufferGeometry[]=[],y=floors*3,p=BUILDING_CATALOG[kind];
 const add=(list:BufferGeometry[],shape:BufferGeometry,color:string,x:number,yy:number,z:number)=>{const g=shape.index?shape.toNonIndexed():shape.clone();shape.dispose();g.translate(x,yy,z);g.deleteAttribute('uv');const c=new Color(color),rgb=new Float32Array(g.attributes.position.count*3);for(let i=0;i<rgb.length;i+=3){rgb[i]=c.r;rgb[i+1]=c.g;rgb[i+2]=c.b;}g.setAttribute('color',new Float32BufferAttribute(rgb,3));list.push(g);};
 const box=(list:BufferGeometry[],x:number,yy:number,z:number,ww:number,h:number,dd:number,c:string)=>add(list,new BoxGeometry(ww,h,dd),c,x,yy,z);
 const cylinder=(list:BufferGeometry[],x:number,yy:number,z:number,r:number,h:number,c:string,top=r)=>add(list,new CylinderGeometry(top,r,h,12),c,x,yy,z);
 const gable=(x:number,z:number,ww:number,dd:number,h:number,offset=.08)=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute([-ww/2,0,-dd/2,ww/2,0,-dd/2,0,h,-dd/2,-ww/2,0,dd/2,ww/2,0,dd/2,0,h,dd/2],3));g.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]);g.computeVertexNormals();add(roofs,g,roofColor,x,y+offset,z);};
 const band=(color:string,height:number)=>box(fronts,w/2,height,-.13,w,.22,.17,color);
 const canopy=(width:number,color:string)=>{box(fronts,w/2,2.35,-.22,width,.16,.6,color);};
 if(kind==='house')gable(w/2,d/2,w,d,.95);
 if(kind==='villa'){gable(w*.25,d/2,w*.5,d,.85);gable(w*.75,d*.54,w*.5,d*.9,1.25);canopy(w*.28,wallColor);for(const x of [w*.32,w*.68])box(fronts,x,1.13,-.25,.19,2.26,.19,wallColor);}
 if(kind==='restaurant'){canopy(w*.84,'#547e64');for(let i=0;i<10;i++)box(fronts,w*.08+w*.084*(i+.5),2.36,-.25,w*.042,.18,.64,i%2?'#e8d7b3':'#547e64');box(roofs,w*.72,y+.5,d*.7,.7,.8,.8,'#96715a');box(roofs,w*.72,y+.93,d*.7,.94,.12,1,'#765f4d');band('#b98b55',2.75);}
 if(kind==='school'){band('#658995',2.77);box(roofs,w/2,y+.75,d*.16,2.4,1.5,2.3,wallColor);gable(w/2,d*.16,2.6,2.5,.45,1.5);const clock=new CylinderGeometry(.58,.58,.05,24);clock.rotateX(Math.PI/2);add(roofs,clock,'#f0e6c8',w/2,y+.85,d*.16-1.18);box(roofs,w/2,y+.96,d*.16-1.22,.04,.3,.02,'#36505b');box(roofs,w/2+.09,y+.85,d*.16-1.22,.25,.04,.02,'#36505b');canopy(w*.38,'#658995');}
 if(kind==='university'){for(const x of [w*.2,w*.35,w*.65,w*.8])cylinder(fronts,x,1.35,-.21,.15,2.7,wallColor);box(fronts,w/2,2.83,-.18,w*.76,.3,.52,wallColor);cylinder(roofs,w/2,y+.32,d*.32,1.2,.6,roofColor);add(roofs,new SphereGeometry(1.2,16,8,0,Math.PI*2,0,Math.PI/2),roofColor,w/2,y+.61,d*.32);}
 if(kind==='clinic'){canopy(w*.5,'#6b9f92');box(fronts,w*.78,2,-.19,.65,.16,.08,'#518e78');box(fronts,w*.78,2,-.19,.16,.65,.09,'#518e78');band('#88b2a5',.5);box(roofs,w*.72,y+.25,d*.7,1.3,.5,1.1,'#8fa6a0');}
 if(kind==='hospital'){for(const x of [w*.12,w*.88])box(fronts,x,y/2,-.15,.38,y,.2,'#6b929f');canopy(w*.44,'#648da2');box(roofs,w/2,y+.035,d/2,2.7,.05,.7,'#eff4e9');box(roofs,w/2,y+.04,d/2,.7,.06,2.7,'#eff4e9');box(fronts,w*.79,2.2,-.2,.7,.18,.08,'#538473');box(fronts,w*.79,2.2,-.21,.18,.7,.1,'#538473');box(roofs,w*.17,y+.35,d*.7,1.3,.7,1.6,roofColor);}
 if(kind==='garage'){const z=d/2;box(fronts,w+.03,1.12,z,.07,2.2,2.86,'#7d8b8b');for(let i=0;i<9;i++)box(fronts,w+.075,.16+i*.24,z,.05,.025,2.84,'#aeb9b1');band('#aab07f',2.6);for(let i=0;i<4;i++)box(roofs,w*(i+1)/5,y+.2,d/2,.18,.4,d*.85,roofColor);}
 if(kind==='museum'){for(let i=0;i<6;i++)cylinder(fronts,w*(.15+i*.14),1.37,-.21,.16,2.74,wallColor);box(fronts,w/2,2.8,-.18,w*.86,.25,.55,wallColor);gable(w/2,d*.18,w*.9,d*.36,1.05);}
 if(kind==='mall'){band('#6e9da6',2.82);canopy(w*.84,'#779da2');const dome=new SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2);dome.scale(w*.24,.95,d*.26);add(roofs,dome,'#9dc3c7',w/2,y+.1,d/2);for(const x of [w*.12,w*.88])box(fronts,x,y/2,-.15,.3,y,.22,'#74949d');}
 if(kind==='hotel'){for(let f=0;f<floors;f++)for(const x of [w*.2,w*.5,w*.8]){box(fronts,x,f*3+.85,-.2,w*.22,.08,.55,wallColor);box(fronts,x,f*3+1.2,-.43,w*.22,.06,.045,'#73979d');}for(let i=0;i<3;i++)box(roofs,w/2,y+.14+i*.22,d*.58,w*(.8-i*.15),.24,d*(.6-i*.13),roofColor);}
 if(kind==='resort'){gable(w*.23,d/2,w*.46,d*.94,1);gable(w*.77,d/2,w*.46,d*.94,1);for(let i=0;i<9;i++)box(roofs,w/2,y+.5,d*(.1+i*.1),w*.18,.12,.12,'#a5835b');for(const x of [w*.12,w*.88])box(fronts,x,1.35,-.21,.22,2.7,.22,'#a5835b');canopy(w*.86,'#a5835b');}
 if(kind==='office'){for(let i=0;i<6;i++)box(fronts,w*(.08+i*.168),y/2,-.15,.1,y,.18,'#698e9b');for(let i=0;i<5;i++)box(roofs,w*(.12+i*.19),y+.2+i*.12,d/2,w*.12,.4+i*.24,d*.76,roofColor);}
 // Every type has a roof batch; empty-front homes use a discreet entrance sill.
 if(!roofs.length)box(roofs,w/2,y+.11,d/2,w*.94,.2,d*.94,roofColor);
 if(!fronts.length)box(fronts,w/2,.12,-.12,1.5,.2,.4,wallColor);
 const merge=(parts:BufferGeometry[])=>{const result=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());return result;};
 return {roof:merge(roofs),facade:merge(fronts),family:p.group};
}
export function BuildingIdentity({building:b,showRoof,showFacade}:{building:Building;showRoof:boolean;showFacade:boolean}){
 const roof=buildingSurface(b,'roof',null),walls=buildingSurface(b,'walls',null),floors=Math.max(0,...b.floors.map(f=>f.index))+1;
 const shapes=useMemo(()=>identityGeometry(b.archetype,b.width,b.depth,floors,roof.color,walls.color),[b.archetype,b.width,b.depth,floors,roof.color,walls.color]);
 const materials=useMemo(()=>[new MeshStandardMaterial({vertexColors:true,roughness:roof.roughness,metalness:roof.metalness}),new MeshStandardMaterial({vertexColors:true,roughness:walls.roughness,metalness:walls.metalness})],[roof.roughness,roof.metalness,walls.roughness,walls.metalness]);
 useEffect(()=>()=>{shapes.roof.dispose();shapes.facade.dispose();},[shapes]);useEffect(()=>()=>materials.forEach(m=>m.dispose()),[materials]);
 return <group name={'architecture-'+b.archetype}>{showRoof&&<mesh geometry={shapes.roof} material={materials[0]} castShadow receiveShadow dispose={null}/>}{showFacade&&<mesh geometry={shapes.facade} material={materials[1]} castShadow receiveShadow dispose={null}/>}</group>;
}
