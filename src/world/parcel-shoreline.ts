import type {Point,Terrain} from '../../supabase/functions/_shared/world-types';
import {heightAt} from '../../supabase/functions/_shared/world-math';
/** Side faces only: never cap a paid excavation or cover an interior/basement. */
export function shorelineVertices(polygon:Point[],terrain?:Terrain){
 const vertices:number[]=[];
 for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)));for(let j=0;j<steps;j++){
  const point=(t:number)=>{const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=heightAt(terrain,x,z)-.01;return {x,z,y,bottom:Math.min(-.58,y-.58)};},p=point(j/steps),q=point((j+1)/steps);
  vertices.push(p.x,p.y,p.z,q.x,q.y,q.z,p.x,p.bottom,p.z,q.x,q.y,q.z,q.x,q.bottom,q.z,p.x,p.bottom,p.z);
 }}return vertices;
}
