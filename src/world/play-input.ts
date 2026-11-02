/** Camera-relative axes. Positive side input is left; diagonal speed is normalized.
 * Looking along +z makes Three's screen-right direction -x at yaw0. */
export function walkingVector(forward:number,left:number,yaw:number){const length=Math.max(1,Math.hypot(forward,left));return {x:(Math.sin(yaw)*forward+Math.cos(yaw)*left)/length,z:(Math.cos(yaw)*forward-Math.sin(yaw)*left)/length};}
export const damping=(rate:number,delta:number)=>1-Math.exp(-rate*Math.max(0,Math.min(delta,.1)));
export const zoomDistance=(distance:number,delta:number)=>Math.max(1.8,Math.min(18,distance*Math.exp(Math.max(-300,Math.min(300,delta))*.0015)));
