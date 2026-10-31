export type GraphicsPreset='auto'|'low'|'medium'|'high';
export const GRAPHICS_PRESETS:GraphicsPreset[]=['auto','low','medium','high'];
export function graphicsProfile(preset:GraphicsPreset,worldQuality:'low'|'standard'='low',device:{mobile?:boolean;memory?:number;cores?:number}={}){
 const constrained=device.mobile||!!device.memory&&device.memory<=4||!!device.cores&&device.cores<=4;
 const level=preset==='auto'?(constrained||worldQuality==='low'?'low':'medium'):preset;
 return {level,dpr:level==='low'?1:level==='medium'?1.25:1.5,shadows:level!=='low',shadowSize:level==='high'?2048:1024,rainCount:level==='low'?48:level==='medium'?96:160,rainFps:level==='low'?15:24,cloudCount:level==='low'?3:5,far:level==='low'?160:300};
}
export function visualEnvironment(hour:number,weather:string){
 const h=((hour%24)+24)%24,night=h<6||h>=19,golden=!night&&(h<7.5||h>=16.5),wet=weather==='rain';
 return {night,golden,sky:night?'#182f43':wet?'#adc3c9':weather==='fog'?'#cfdddc':golden?'#efd3bc':'#c7e1e4',ambient:night?.48:wet?.95:golden?1.05:1.2,sun:night?.3:wet?.9:golden?1.5:2,sunColor:night?'#adc9e5':golden?'#ffd2a1':'#fff4dc',ground:night?'#506d6c':'#6f8d75',cloud:night?'#52677a':wet?'#b8c8cc':golden?'#f3e4d5':'#f0f4e9',fog:weather==='fog'?55:wet?110:250,water:night?'#426e85':wet?'#759ca9':golden?'#9fc3c7':'#82bfd0'};
}
