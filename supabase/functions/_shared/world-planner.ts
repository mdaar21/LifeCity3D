import type {Archetype,Blueprint,FloorPlan,Point,Rect,Room,RoomUse} from './world-types.ts';
import {amount,contains,distance,fail,overlap,priced} from './world-math.ts';
export const CONTRACTORS=[
 {id:'moss',name_ar:'بُناة الغابة',name_en:'Moss Builders',price:100,effort:100,quality:2},
 {id:'dune',name_ar:'عمران الكثبان',name_en:'Dune Works',price:90,effort:125,quality:1},
 {id:'sky',name_ar:'روّاد الأفق',name_en:'Skyward Guild',price:120,effort:75,quality:3}
] as const;
export const MATERIALS=[
 {id:'plaster',ar:'لياسة ودهان',en:'Plaster',cents:40,color:'#e8e1d3',roughness:.9,metalness:0},
 {id:'wood',ar:'خشب',en:'Wood',cents:90,color:'#986c43',roughness:.8,metalness:0},
 {id:'brick',ar:'طوب',en:'Brick',cents:70,color:'#b56f53',roughness:1,metalness:0},
 {id:'concrete',ar:'خرسانة مصقولة',en:'Polished concrete',cents:60,color:'#a1aaa6',roughness:.45,metalness:.02},
 {id:'stone',ar:'حجر',en:'Stone',cents:110,color:'#c4ba9c',roughness:.9,metalness:0},
 {id:'ceramic',ar:'سيراميك',en:'Ceramic',cents:95,color:'#b4ccca',roughness:.25,metalness:0},
 {id:'marble',ar:'حجر رخامي',en:'Marble-like stone',cents:150,color:'#f0ece0',roughness:.2,metalness:.03},
 {id:'metal',ar:'معدن',en:'Metal',cents:130,color:'#89979a',roughness:.3,metalness:.7},
 {id:'glass',ar:'زجاج',en:'Glass',cents:140,color:'#a5d5df',roughness:.1,metalness:.1},
 {id:'roof',ar:'قرميد',en:'Roof tiles',cents:80,color:'#6e7861',roughness:.9,metalness:0}
] as const;
export const ARCHETYPES:Archetype[]=['house','villa','restaurant','mall','hotel','resort','school','university','clinic','hospital','garage','museum','office'];
export const ROOM_USES:RoomUse[]=['bedroom','living','kitchen','bathroom','shop','dining','cinema','guest','reception','classroom','waiting','treatment','parking','exhibit','office'];
export interface RoomRequest {name:string;use:RoomUse;area:number}
export interface PlanRequest {width:number;depth:number;floors:number;rooms:RoomRequest[];accessible:boolean;archetype:Archetype;budget:string}
export function wallLength(f:FloorPlan,width:number,depth:number):number{return (width+depth)*2+f.rooms.reduce((sum,r)=>sum+r.depth+(r.z>0?r.width:0),0);}
export function defaultRooms(kind:Archetype):RoomRequest[]{
 const uses:RoomUse[]=kind==='mall'?['shop','shop','dining','bathroom']:['hotel','resort'].includes(kind)?['guest','guest','reception','bathroom']:['school','university'].includes(kind)?['classroom','classroom','office','bathroom']:['clinic','hospital'].includes(kind)?['waiting','treatment','office','bathroom']:kind==='restaurant'?['dining','kitchen','bathroom']:kind==='garage'?['parking','parking']:kind==='museum'?['exhibit','exhibit']:kind==='office'?['office','office','reception']:['living','bedroom','kitchen','bathroom'];
 return uses.map((use,i)=>({name:use+' '+(i+1),use,area:use==='bathroom'?4:8}));
}
export function validatePlan(plan:FloorPlan,width:number,depth:number){
 const outer={x:0,z:0,width,depth};if(plan.height<2.7||plan.height>4||!contains(outer,plan.entry))return fail('INVALID_FLOOR_PLAN');
 const obstacles=[plan.corridor,...(plan.stairs?[plan.stairs]:[]),...(plan.elevator?[plan.elevator]:[])];
 for(const [i,room] of plan.rooms.entries()){
  if(room.width<1.2||room.depth<1.5||!contains(outer,room)||!contains(outer,{x:room.x+room.width,z:room.z+room.depth})||room.width*room.depth<2)return fail('ROOMS_DO_NOT_FIT');
  if(obstacles.some(o=>overlap(room,o,-.001))||plan.rooms.slice(0,i).some(o=>overlap(room,o,-.001)))return fail('ROOM_OVERLAP');
  if(!contains(plan.corridor,room.door,.0)||Math.min(distance(room.door,{x:room.x,z:room.door.z}),distance(room.door,{x:room.x+room.width,z:room.door.z}))>.02||room.door.z<room.z+.45||room.door.z>room.z+room.depth-.45)return fail('ROOM_DOOR_DISCONNECTED');
 }
 return true;
}
export function generatePlans(p:PlanRequest,parcel:Rect):FloorPlan[]{
 if(!ARCHETYPES.includes(p.archetype)||p.width<4||p.depth<5||p.floors<1||p.floors>12||!Number.isInteger(p.floors))return fail('INVALID_DIMENSIONS');
 if(p.width+2>parcel.width||p.depth+2>parcel.depth)return fail('PLAN_EXCEEDS_PARCEL');
 if(p.rooms.length<2||p.rooms.length>10||p.rooms.some(r=>r===null||typeof r!=='object'||typeof r.name!=='string'||typeof r.use!=='string'||!ROOM_USES.includes(r.use)||r.name.length<1||r.name.length>60||!Number.isFinite(r.area)||r.area<2||r.area>100))return fail('INVALID_ROOM_REQUEST');
 const corridorWidth=Math.min(2,p.width/3),wing=(p.width-corridorWidth)/2;
 const plans:FloorPlan[]=[];
 for(let index=0;index<p.floors;index++){
  const corridor={x:wing,z:0,width:corridorWidth,depth:p.depth};
  const stairs={x:wing+corridorWidth,z:0,width:wing,depth:3.6};
  const elevator=p.accessible&&p.floors>1?{x:0,z:0,width:wing,depth:p.archetype==='garage'?4:1.6}:null;
  const rooms:Room[]=[];
  for(const side of [0,1]){
   const requests=p.rooms.filter((_,i)=>i%2===side);if(!requests.length)continue;
   const offset=side===1?(stairs?.depth??0):(elevator?.depth??0),available=p.depth-offset,total=requests.reduce((s,r)=>s+r.area,0);
   if(total>available*wing+.001)return fail('ROOMS_DO_NOT_FIT');
   let z=offset;
   for(const request of requests){const d=available*request.area/total,x=side===0?0:wing+corridorWidth;rooms.push({id:crypto.randomUUID(),x,z,width:wing,depth:d,name:request.name,use:request.use,door:{x:side===0?wing:wing+corridorWidth,z:z+d/2},material:'plaster',capacity:request.use==='parking'?1:Math.max(1,Math.floor(wing*d/(request.use==='guest'?8:4)))});z+=d;}
  }
  const floor:FloorPlan={index,height:3,rooms,corridor,stairs,elevator,entry:{x:p.width/2,z:0},area:p.width*p.depth};validatePlan(floor,p.width,p.depth);plans.push(floor);
 }
 const estimated=estimateConstruction(p.width,p.depth,p.floors,'moss',p.accessible,plans);if(amount(p.budget)<amount(estimated))return fail('PLAN_EXCEEDS_BUDGET');return plans;
}
export function estimateConstruction(width:number,depth:number,floors:number,contractor:string,accessible=false,plans?:FloorPlan[]):string{
 const firm=CONTRACTORS.find(f=>f.id===contractor);if(!firm)return fail('CONTRACTOR_NOT_FOUND');const a=width*depth;let value=amount(priced(a,75,firm.price))+amount(priced(1,500,firm.price))+amount(priced(a*floors,50,firm.price))+amount(priced(a,60,firm.price))+amount(priced(a*floors,40,firm.price));
 for(let i=0;i<floors;i++)value+=amount(priced(a,150,firm.price*(100+i*15),10000))+amount(priced(plans?.[i]?wallLength(plans[i],width,depth):(width+depth)*2,50,firm.price))+amount(priced(1,1000,firm.price))+((plans?!!plans[i]?.elevator:accessible&&floors>1)?amount(priced(1,2000,firm.price)):0n);
 const n=value<0n?-value:value;return `${n/10000n}.${(n%10000n).toString().padStart(4,'0')}`;
}
export function editBlueprint(b:Blueprint,index:number,roomId:string,rect:Rect,name:string){const next=structuredClone(b);const floor=next.floors.find(f=>f.index===index),room=floor?.rooms.find(r=>r.id===roomId);if(!floor||!room)return fail('NOT_FOUND');Object.assign(room,rect,{name});room.door={x:room.x<floor.corridor.x?room.x+room.width:room.x,z:room.z+room.depth/2};validatePlan(floor,next.width,next.depth);next.estimated_cost=estimateConstruction(next.width,next.depth,next.floors.length,'moss',next.accessible,next.floors);next.version++;return next;}
export function localRoomAt(plan:FloorPlan,p:Point){return plan.rooms.find(r=>contains(r,p))??null;}
