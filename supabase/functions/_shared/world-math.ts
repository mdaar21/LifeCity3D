import type {Point,Rect,Realm,Terrain,WorldContext,WorldEntity,Building} from './world-types.ts';
export const WORLD_LIMIT=64;
export class WorldError extends Error{constructor(public code:string){super(code);}}
export const fail=(code:string):never=>{throw new WorldError(code);};
export function amount(value:string|number):bigint{const s=String(value);const m=/^(-?)(\d{1,13})(?:\.(\d{1,4}))?$/.exec(s);if(!m)return fail('INVALID_AMOUNT');return BigInt(m[1]+m[2]+(m[3]??'').padEnd(4,'0'));}
export function money(value:bigint):string{const sign=value<0n?'-':'';const n=value<0n?-value:value;return `${sign}${n/10000n}.${(n%10000n).toString().padStart(4,'0')}`;}
export function rateParts(rate:string){const m=/^(\d{1,12})(?:\.(\d{1,12}))?$/.exec(rate);if(!m)return fail('FX_UNAVAILABLE');return {n:BigInt(m[1]+(m[2]??'')),d:10n**BigInt((m[2]??'').length)};}
export function converted(canonical:string,rate:string):string{const {n,d}=rateParts(rate);if(n<=0n)return fail('FX_UNAVAILABLE');const scaled=amount(canonical)*n;return money(((scaled+50n*d)/(100n*d))*100n);}
export function priced(quantity:number,centsPerUnit:number,factor=100,factorScale=100):string{if(!Number.isFinite(quantity)||quantity<0||quantity>1e7)return fail('INVALID_DIMENSIONS');const hundredths=BigInt(Math.ceil(Math.round(quantity*1000000)/10000)),denominator=100n*BigInt(factorScale);return money(((hundredths*BigInt(centsPerUnit)*BigInt(factor)+denominator-1n)/denominator)*100n);}
export function integer(p:Record<string,unknown>,key:string,min:number,max:number){const n=p[key];if(typeof n!=='number'||!Number.isInteger(n)||n<min||n>max)return fail('INVALID_PAYLOAD');return n;}
export function numeric(p:Record<string,unknown>,key:string,min:number,max:number){const n=p[key];if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)return fail('INVALID_PAYLOAD');return Math.round(n*100)/100;}
export function text(p:Record<string,unknown>,key:string,max=80){const v=p[key];if(typeof v!=='string'||!v.trim()||v.trim().length>max)return fail('INVALID_PAYLOAD');return v.trim();}
export function color(v:unknown){if(typeof v!=='string'||!/^#[0-9a-f]{6}$/i.test(v))return fail('INVALID_COLOR');return v;}
export function area(poly:Point[]):number{if(poly.length<3||poly.length>16)return fail('INVALID_PARCEL');let n=0;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];n+=a.x*b.z-b.x*a.z;}return Math.round(Math.abs(n)*50)/100;}
export function bounds(poly:Point[]):Rect{const x=Math.min(...poly.map(p=>p.x)),z=Math.min(...poly.map(p=>p.z));return {x,z,width:Math.max(...poly.map(p=>p.x))-x,depth:Math.max(...poly.map(p=>p.z))-z};}
export function polygon(r:Rect):Point[]{return [{x:r.x,z:r.z},{x:r.x+r.width,z:r.z},{x:r.x+r.width,z:r.z+r.depth},{x:r.x,z:r.z+r.depth}];}
export const contains=(r:Rect,p:Point,margin=0)=>p.x>=r.x+margin-1e-7&&p.z>=r.z+margin-1e-7&&p.x<=r.x+r.width-margin+1e-7&&p.z<=r.z+r.depth-margin+1e-7;
export const overlap=(a:Rect,b:Rect,padding=0)=>a.x<b.x+b.width+padding&&a.x+a.width+padding>b.x&&a.z<b.z+b.depth+padding&&a.z+a.depth+padding>b.z;
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
export function owned<K extends WorldEntity['kind']>(c:WorldContext,id:unknown,kind:K,realm?:Realm,stored=false):Extract<WorldEntity,{kind:K}>{const entity=c.world.entities.find(e=>e.id===id&&e.kind===kind&&(e.status==='active'||stored&&e.status==='stored')&&(!realm||e.realm===realm));if(!entity)return fail('NOT_OWNED');return entity as Extract<WorldEntity,{kind:K}>;}
export function terrainAt(c:WorldContext,realm:Realm):Terrain|undefined{return c.world.entities.find(e=>e.kind==='terrain'&&e.realm===realm&&e.status==='active') as Terrain|undefined;}
export function heightAt(t:Terrain|undefined,x:number,z:number):number{if(!t)return 0;const side=t.side,ix=Math.max(0,Math.min(side-1,Math.floor(x))),iz=Math.max(0,Math.min(side-1,Math.floor(z)));const fx=Math.max(0,Math.min(1,x-ix)),fz=Math.max(0,Math.min(1,z-iz)),stride=side+1;const a=t.heights_cm[iz*stride+ix]??0,b=t.heights_cm[iz*stride+ix+1]??0,d=t.heights_cm[(iz+1)*stride+ix]??0,e=t.heights_cm[(iz+1)*stride+ix+1]??0;return ((a*(1-fx)+b*fx)*(1-fz)+(d*(1-fx)+e*fx)*fz)/100;}
export function flatHeight(c:WorldContext,realm:Realm,r:Rect){const t=terrainAt(c,realm),heights:number[]=[];const xs=[r.x,...Array.from({length:Math.floor(r.width)},(_,i)=>Math.ceil(r.x)+i).filter(x=>x>r.x&&x<r.x+r.width),r.x+r.width],zs=[r.z,...Array.from({length:Math.floor(r.depth)},(_,i)=>Math.ceil(r.z)+i).filter(z=>z>r.z&&z<r.z+r.depth),r.z+r.depth];for(const x of xs)for(const z of zs)heights.push(heightAt(t,x,z));if(Math.max(...heights)-Math.min(...heights)>.12||Math.min(...heights)<-.05)return fail('FOUNDATION_NOT_FLAT');return heights.reduce((a,b)=>a+b,0)/heights.length;}
export function buildingRect(b:Building):Rect{return {x:b.x,z:b.z,width:b.rotation===90?b.depth:b.width,depth:b.rotation===90?b.width:b.depth};}
export function pointOnOwnedLand(c:WorldContext,realm:Realm,p:Point):boolean{return c.world.entities.some(e=>e.kind==='parcel'&&e.realm===realm&&e.status==='active'&&contains(bounds(e.polygon),p));}
export function surfaceBlocked(c:WorldContext,realm:Realm,r:Rect,ignore?:string):boolean{
 if(c.legacy.some(e=>e.realm===realm&&overlap(r,e,.15)))return true;
 for(const e of c.world.entities){if(e.realm!==realm||e.id===ignore||e.status!=='active')continue;if(e.kind==='building'&&overlap(r,buildingRect(e),.15)||e.kind==='decoration'&&overlap(r,e,.1))return true;
  if(e.kind==='node'&&e.y>=heightAt(terrainAt(c,realm),e.x,e.z)-.2&&contains({x:r.x-.4,z:r.z-.4,width:r.width+.8,depth:r.depth+.8},e))return true;
  if(e.kind==='edge'&&e.depth>=0){const a=c.world.entities.find(v=>v.id===e.from),b=c.world.entities.find(v=>v.id===e.to);if(a?.kind==='node'&&b?.kind==='node'&&segmentHitsRect(a,b,r,e.network==='road'?(e.directed?e.lanes*1.6:e.lanes*3)/2:.2))return true;}
 }return false;
}
export function segmentHitsRect(a:Point,b:Point,r:Rect,padding=0){let low=0,high=1;const dx=b.x-a.x,dz=b.z-a.z;for(const [p,q]of [[-dx,a.x-r.x+padding],[dx,r.x+r.width+padding-a.x],[-dz,a.z-r.z+padding],[dz,r.z+r.depth+padding-a.z]]){if(Math.abs(p)<1e-10){if(q<0)return false;continue;}const t=q/p;if(p<0)low=Math.max(low,t);else high=Math.min(high,t);if(low>high)return false;}return true;}
export function pointSegmentDistance(p:Point,a:Point,b:Point){const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/l)):0;return distance(p,{x:a.x+dx*t,z:a.z+dz*t});}
