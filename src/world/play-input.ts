/** Camera-relative axes. Positive side input is left; diagonal speed is normalized.
 * Looking along +z makes Three's screen-right direction -x at yaw0. */
export function walkingVector(forward:number,left:number,yaw:number){const length=Math.max(1,Math.hypot(forward,left));return {x:(Math.sin(yaw)*forward+Math.cos(yaw)*left)/length,z:(Math.cos(yaw)*forward-Math.sin(yaw)*left)/length};}
export const damping=(rate:number,delta:number)=>1-Math.exp(-rate*Math.max(0,Math.min(delta,.1)));
export const zoomDistance=(distance:number,delta:number)=>Math.max(1.8,Math.min(18,distance*Math.exp(Math.max(-300,Math.min(300,delta))*.0015)));
/** Physical keys keep WASD usable while the player's keyboard is set to Arabic. */
export function movementKey(event:Pick<KeyboardEvent,'code'|'key'>){
 const physical:Record<string,string>={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',ArrowUp:'arrowup',ArrowDown:'arrowdown',ArrowLeft:'arrowleft',ArrowRight:'arrowright',ShiftLeft:'shift',ShiftRight:'shift',Space:'jump'};
 if(physical[event.code])return physical[event.code];
 const key=event.key.toLowerCase();return key===' '?'jump':['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(key)?key:null;
}
export interface JumpState {height:number;velocity:number;grounded:boolean;landing:number}
export const standingJump=():JumpState=>({height:0,velocity:0,grounded:true,landing:0});
/** Render-time vertical physics. Owned floors and horizontal collisions stay authoritative. */
export function stepJump(state:JumpState,requested:boolean,delta:number):JumpState{
 const dt=Math.max(0,Math.min(delta,.1)),takeoff=requested&&state.grounded;
 const velocity=(takeoff?6:state.velocity)-18*dt;
 if(state.grounded&&!takeoff)return {...state,landing:Math.max(0,state.landing-dt*5)};
 const height=state.height+(takeoff?6:state.velocity)*dt-9*dt*dt;
 return height<=0?{height:0,velocity:0,grounded:true,landing:1}:{height,velocity,grounded:false,landing:0};
}
