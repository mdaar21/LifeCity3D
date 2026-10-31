import {useEffect,useMemo} from 'react';
import {CanvasTexture,SRGBColorSpace} from 'three';
/** Original canvas lettering on physical signs; no downloaded art or floating measurements. */
export function TextSurface({text,width,height,position,rotation=[0,0,0],background='#e8e3ce',ink='#2b4537'}:{text:string;width:number;height:number;position:[number,number,number];rotation?:[number,number,number];background?:string;ink?:string}){
 const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');if(ctx){ctx.fillStyle=background;ctx.fillRect(0,0,512,128);ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction=/[\u0600-\u06ff]/.test(text)?'rtl':'ltr';let size=52;ctx.font=`600 ${size}px Arial, sans-serif`;while(ctx.measureText(text).width>480&&size>18){size-=2;ctx.font=`600 ${size}px Arial, sans-serif`;}ctx.fillText(text.slice(0,80),256,67);}const t=new CanvasTexture(canvas);t.colorSpace=SRGBColorSpace;return t;},[text,background,ink]);
 useEffect(()=>()=>texture.dispose(),[texture]);return <mesh position={position} rotation={rotation}><planeGeometry args={[width,height]}/><meshStandardMaterial map={texture} roughness={.8}/></mesh>;
}
