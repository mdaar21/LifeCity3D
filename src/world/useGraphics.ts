import {create} from 'zustand';
import {useEffect,useState} from 'react';
import {GRAPHICS_PRESETS,graphicsProfile,type GraphicsPreset} from './graphics-profile';
const key='lifecity-render-preferences-v1';
function initial():GraphicsPreset{try{const value=localStorage.getItem(key);return GRAPHICS_PRESETS.includes(value as GraphicsPreset)?value as GraphicsPreset:'auto';}catch{return 'auto';}}
export const useGraphics=create<{preset:GraphicsPreset;setPreset:(preset:GraphicsPreset)=>void}>(set=>({preset:initial(),setPreset:preset=>{if(!GRAPHICS_PRESETS.includes(preset))return;set({preset});try{localStorage.setItem(key,preset);}catch{/* Local visual preferences never affect game saves. */}}}));
export function useGraphicsProfile(quality:'low'|'standard'='low'){
 const preset=useGraphics(s=>s.preset),[mobile,setMobile]=useState(()=>typeof window!=='undefined'&&window.innerWidth<768);
 useEffect(()=>{if(!window.matchMedia)return;const media=window.matchMedia('(max-width:767px)'),changed=()=>setMobile(media.matches);media.addEventListener('change',changed);return()=>media.removeEventListener('change',changed);},[]);
 const device=typeof navigator==='undefined'?{}:{mobile,memory:(navigator as Navigator&{deviceMemory?:number}).deviceMemory,cores:navigator.hardwareConcurrency};return graphicsProfile(preset,quality,device);
}
