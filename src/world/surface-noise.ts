import {DataTexture,LinearFilter,LinearMipmapLinearFilter,RepeatWrapping,RGBAFormat} from 'three';
function cell(x:number,y:number){const n=Math.sin(((x%16+16)%16)*127.1+((y%16+16)%16)*311.7)*43758.5453;return n-Math.floor(n);}
/** Seamless deterministic value noise, evaluated once on the CPU, not per pixel. */
export function surfaceNoise(x:number,y:number){
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=cell(ix,iy)*(1-sx)+cell(ix+1,iy)*sx,b=cell(ix,iy+1)*(1-sx)+cell(ix+1,iy+1)*sx;
 return a*(1-sy)+b*sy;
}
let cached:DataTexture|undefined;
export function surfaceNoiseMap(){
 if(cached)return cached;
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,n=Math.round(surfaceNoise(x/8,y/8)*255);data[i]=n;data[i+1]=n;data[i+2]=n;data[i+3]=255;}
 cached=new DataTexture(data,size,size,RGBAFormat);cached.wrapS=cached.wrapT=RepeatWrapping;cached.magFilter=LinearFilter;cached.minFilter=LinearMipmapLinearFilter;cached.generateMipmaps=true;cached.needsUpdate=true;
 return cached;
}
