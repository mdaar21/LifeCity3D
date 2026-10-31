/** Shared design-book colors. Rendering only: never prices, ownership or geometry bounds. */
export const VISUAL={navy:'#183446',ocean:'#4f8fa9',mint:'#6baa91',cream:'#fff8ec',ivory:'#f6f6f0',gold:'#e9b65c',rose:'#d998af',warning:'#ce6e68',asphalt:'#526b79',curb:'#d7dfd8',water:'#82bfd0',grass:'#9fbc84',earth:'#c8b98f',concrete:'#b8c2bd',steel:'#7c8e98',wood:'#ab8056',glass:'#8ebdcb'} as const;
export function visualSeed(id:string){let n=2166136261;for(let i=0;i<id.length;i++)n=Math.imul(n^id.charCodeAt(i),16777619);return n>>>0;}
