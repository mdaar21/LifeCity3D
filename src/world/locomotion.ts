export interface LocomotionInput {speed:number;phase:number;forward:number;side:number;airborne:boolean;verticalSpeed:number;landing:number}
/** Continuous gait blend and planted-heel compensation; no game-state writes. */
export function locomotionPose({speed,phase,forward,side,airborne,verticalSpeed,landing}:LocomotionInput){
 const amount=Math.min(1,Math.max(0,speed)/2.7),run=Math.max(0,Math.min(1,(speed-2.7)/1.5)),back=forward<-.05?-1:1,strafe=Math.min(1,Math.abs(side)),wave=Math.sin(phase),stride=(.5+run*.28)*amount;
 const legs=([1,-1] as const).map(sign=>{
  const swing=Math.max(0,wave*sign*back),hip=airborne?-.18-Math.max(0,verticalSpeed)/6*.22:-wave*sign*stride*back*(1-strafe*.42),knee=airborne?.32+Math.max(0,verticalSpeed)/6*.68:swing*(.58+run*.55)*amount;
  return {hip,knee,ankle:airborne?-.12:-(hip+knee)*.65,splay:airborne?sign*.06:-wave*sign*stride*side*.35,arm:airborne?-.35-Math.max(0,verticalSpeed)/6*.5:wave*sign*stride*.85-.04,elbow:airborne?-.7:-.16-run*.7-amount*.12};
 });
 return {legs,bob:airborne?0:Math.abs(Math.sin(phase*2))*(.018+run*.012)*amount-landing*.095,lean:airborne?-.035:(.035+run*.085)*amount*back,roll:airborne?0:wave*.012*amount-side*amount*.035,twist:airborne?0:Math.cos(phase)*amount*(.035+run*.025)};
}
