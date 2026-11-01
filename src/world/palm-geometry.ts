import {BufferGeometry,Color,CylinderGeometry,Float32BufferAttribute,Vector3,Quaternion} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
/** One vertex-colour mesh per owned plant; both detail levels keep its paid footprint. */
export function palmGeometry(family:string,detail:boolean){
 const parts:BufferGeometry[]=[],height=family==='royal'?3.6:family==='coconut'?3.2:family==='date'?2.9:2.1;
 const add=(g:BufferGeometry,color:string)=>{const p=g.index?g.toNonIndexed():g.clone();g.dispose();const c=new Color(color),rgb=new Float32Array(p.attributes.position.count*3);for(let i=0;i<rgb.length;i+=3){rgb[i]=c.r;rgb[i+1]=c.g;rgb[i+2]=c.b;}p.setAttribute('color',new Float32BufferAttribute(rgb,3));p.deleteAttribute('uv');parts.push(p);};
 const stick=(a:Vector3,b:Vector3,r:number,color:string)=>{const g=new CylinderGeometry(r*.8,r,a.distanceTo(b),5);g.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),b.clone().sub(a).normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());add(g,color);};
 const lean=family==='coconut'?.3:.05;
 for(let j=0;j<8;j++){const y=j*height/8;stick(new Vector3(lean*(j/8)**2,y,0),new Vector3(lean*((j+1)/8)**2,y+height/8,0),family==='royal'?.11:.08,j%2?'#a68b61':'#947951');}
 const top=new Vector3(lean,height,0),count=detail?12:8,steps=detail?15:9;
 for(let i=0;i<count;i++){
  const angle=i*Math.PI*2/count,dx=Math.cos(angle),dz=Math.sin(angle),fan=family==='fan',length=fan?1.05:family==='coconut'?1.55:1.3;
  const point=(t:number)=>new Vector3(top.x+dx*length*t,height+Math.sin(t*Math.PI)*.32-t*t*.42,top.z+dz*length*t);
  const mid=point(.5),end=point(1);stick(top,mid,.018,'#6c8b43');stick(mid,end,.012,'#67843f');
  for(let j=1;j<=steps;j++){
   const t=j/(steps+1),p=point(t),span=(fan?.48:.22+.36*Math.sin(t*Math.PI))*(1-t*.3);
   for(const side of [-1,1]){const tx=-dz*side,tz=dx*side,verts=[p.x,p.y,p.z,p.x+tx*span*.6+dx*.12,p.y-.025,p.z+tz*span*.6+dz*.12,p.x+tx*span,p.y-.13,p.z+tz*span,p.x+dx*.12,p.y-.025,p.z+dz*.12];const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(verts,3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();add(g,['#49734a','#64894c','#82a159'][(i+j)%3]);}
  }
 }
 const merged=mergeGeometries(parts)!;for(const part of parts)part.dispose();return merged;
}
