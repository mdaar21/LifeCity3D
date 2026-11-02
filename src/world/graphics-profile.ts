export type GraphicsLevel='low'|'medium'|'high'|'ultra';
export type GraphicsPreset='auto'|GraphicsLevel;
export const GRAPHICS_PRESETS:GraphicsPreset[]=['auto','low','medium','high','ultra'];
/** Avoid multiplying a large desktop screen into an unbounded effects buffer. */
export function boundedDpr(requested:number,width:number,height:number){return Math.min(requested,Math.sqrt(2_600_000/Math.max(1,width*height)));}
const levels={
 low:{dpr:1,shadows:false,shadowSize:512,rainCount:48,rainFps:15,cloudCount:3,far:180,materialDetail:0,foliageDetail:0,waterDetail:1,effectFps:15,ao:false,bloom:false,aoScale:.5,environmentSize:64},
 medium:{dpr:1.25,shadows:true,shadowSize:1024,rainCount:96,rainFps:24,cloudCount:5,far:300,materialDetail:1,foliageDetail:1,waterDetail:2,effectFps:24,ao:false,bloom:false,aoScale:.5,environmentSize:128},
 high:{dpr:1.5,shadows:true,shadowSize:2048,rainCount:160,rainFps:24,cloudCount:7,far:450,materialDetail:2,foliageDetail:2,waterDetail:3,effectFps:30,ao:true,bloom:false,aoScale:.5,environmentSize:256},
 ultra:{dpr:2,shadows:true,shadowSize:2048,rainCount:220,rainFps:30,cloudCount:9,far:650,materialDetail:3,foliageDetail:2,waterDetail:4,effectFps:30,ao:true,bloom:true,aoScale:.65,environmentSize:256},
} as const;
export function graphicsProfile(preset:GraphicsPreset,_worldQuality:'low'|'standard'='low',device:{mobile?:boolean;memory?:number;cores?:number}={}){
 const constrained=device.mobile||!!device.memory&&device.memory<=4||!!device.cores&&device.cores<=4;
 const level=preset==='auto'?(constrained?'low':'medium'):preset;
 return {level,...levels[level]};
}
export function visualEnvironment(hour:number,weather:string){
 const h=((hour%24)+24)%24,night=h<6||h>=19,golden=!night&&(h<7.5||h>=16.5),wet=weather==='rain';
 return {night,golden,sky:night?'#142b43':wet?'#a2bbc6':weather==='fog'?'#c3d4d8':golden?'#8eafc3':'#78b1d5',horizon:night?'#50617a':golden?'#f4c8a2':wet?'#c8d6d9':'#e1edec',ambient:night?.48:wet?.85:golden?.5:.45,sun:night?.55:wet?.9:golden?2.8:3.1,sunColor:night?'#adc9e5':golden?'#ffd2a1':'#fff4dc',ground:night?'#394d50':'#71846b',cloud:night?'#52677a':wet?'#b8c8cc':golden?'#f3e4d5':'#f0f4e9',fog:weather==='fog'?55:wet?110:300,water:night?'#163e55':wet?'#527f91':golden?'#548f9d':'#257d9a'};
}
