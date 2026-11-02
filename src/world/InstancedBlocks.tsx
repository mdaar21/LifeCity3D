import {useLayoutEffect,useRef} from 'react';
import {BoxGeometry,Color,InstancedMesh,Matrix4,MeshStandardMaterial,Quaternion,Vector3} from 'three';
export interface BlockInstance{at:[number,number,number];size:[number,number,number];color:string}
const geometry=new BoxGeometry(1,1,1),material=new MeshStandardMaterial({roughness:.78});
/** One shared draw for repeated structural members, including their colors. */
export function InstancedBlocks({blocks}:{blocks:BlockInstance[]}){
 const ref=useRef<InstancedMesh>(null);
 useLayoutEffect(()=>{const mesh=ref.current;if(!mesh)return;const matrix=new Matrix4(),q=new Quaternion(),position=new Vector3(),scale=new Vector3(),color=new Color();blocks.forEach((b,i)=>{matrix.compose(position.set(...b.at),q,scale.set(...b.size));mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,color.set(b.color));});mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();},[blocks]);
 return blocks.length?<instancedMesh key={blocks.length} ref={ref} args={[geometry,material,blocks.length]} castShadow receiveShadow dispose={null}/>:null;
}
