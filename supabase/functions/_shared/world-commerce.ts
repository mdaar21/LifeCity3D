import type {Building,Furniture,Realm,WorldContext,WorldPatch,WorldTools} from './world-types.ts';
import {amount,contains,fail,integer,money,numeric,overlap,owned,priced,text} from './world-math.ts';
import {worldHour} from './world-environment.ts';
import {entrance,graph,metrics,passiveRemaining,shortestPath,travel} from './world-networks.ts';
export const FURNITURE=[
 {id:'bed',ar:'سرير',en:'Bed',width:1.5,depth:2,price:3500},
 {id:'chair',ar:'كرسي',en:'Chair',width:.5,depth:.5,price:800},
 {id:'table',ar:'طاولة',en:'Table',width:1.2,depth:.8,price:1800},
 {id:'sofa',ar:'أريكة',en:'Sofa',width:2,depth:.8,price:4500},
 {id:'counter',ar:'منضدة',en:'Counter',width:1.5,depth:.7,price:2500},
 {id:'plant',ar:'نبات داخلي',en:'Indoor plant',width:.5,depth:.5,price:600},
 {id:'shelf',ar:'رف',en:'Shelf',width:1,depth:.4,price:1200}
] as const;
function furnished(c:WorldContext,p:Record<string,unknown>,f:Furniture,realm:Realm){
 const b=owned(c,p.building_id,'building',realm),floor=integer(p,'floor',-4,11),plan=b.floors.find(v=>v.index===floor),room=plan?.rooms.find(v=>v.id===p.room_id);
 if(!room||!b.stages.some(s=>s.type==='floor'&&s.floor===floor&&s.paid))return fail('FLOOR_NOT_BUILT');
 const rotation=integer(p,'rotation',0,270);if(rotation%90)return fail('INVALID_ROTATION');const w=rotation%180?f.depth:f.width,d=rotation%180?f.width:f.depth;
 const pos={x:numeric(p,'x',0,b.width),z:numeric(p,'z',0,b.depth),width:w,depth:d};
 if(!contains(room,pos,.08)||!contains(room,{x:pos.x+w,z:pos.z+d},.08)||overlap(pos,{x:room.door.x-.6,z:room.door.z-.6,width:1.2,depth:1.2}))return fail('FURNITURE_BLOCKS_ACCESS');
 if(c.world.entities.some(v=>v.kind==='furniture'&&v.id!==f.id&&v.status==='active'&&v.building_id===b.id&&v.floor===floor&&overlap(pos,{x:v.x,z:v.z,width:v.rotation%180?v.depth:v.width,depth:v.rotation%180?v.width:v.depth})))return fail('WORLD_COLLISION');
 Object.assign(f,{building_id:b.id,room_id:room.id,floor,rotation,x:pos.x,z:pos.z,status:'active'});
}
export function recoverFurniture(c:WorldContext,q:WorldPatch,b:Building,floor:number|null,p:Record<string,unknown>,t:WorldTools){
 const furniture=c.world.entities.filter((e):e is Furniture=>e.kind==='furniture'&&e.status==='active'&&e.building_id===b.id&&(floor===null||e.floor===floor));
 const discard=p.destroy_furniture_ids??[];if(!Array.isArray(discard)||discard.some(id=>!furniture.some(f=>f.id===id)))return fail('INVALID_FURNITURE_SELECTION');
 for(const f of furniture)if(discard.includes(f.id)){t.destroy(c,q,f.id);q.retire.push(f.id);}else q.upsert.push({...structuredClone(f),status:'stored',building_id:null,room_id:null,version:f.version+1});
 q.result.furniture_kept=furniture.filter(f=>!discard.includes(f.id)).map(f=>f.id);q.result.furniture_destroyed=discard;
}
function rate(value:unknown,max=25):string{const s=String(value??'');const n=amount(s);if(n<0n||n>BigInt(max)*10000n)return fail('INVALID_PRICE');return money(n);}
export function commerce(c:WorldContext,op:string,p:Record<string,unknown>,q:WorldPatch,realm:Realm,t:WorldTools):boolean{
 if(op==='tenant_save'){
  const b=structuredClone(owned(c,p.building_id,'building',realm));if(b.archetype!=='mall'||!b.opened_at)return fail('OPEN_MALL_REQUIRED');
  const room=b.floors.flatMap(f=>f.rooms).find(v=>v.id===p.room_id);if(!room||!['shop','dining','cinema'].includes(room.use))return fail('INVALID_TENANT_SPACE');
  if(!['retail','food','cinema'].includes(String(p.type)))return fail('INVALID_PAYLOAD');const old=b.tenants.find(v=>v.room_id===room.id);b.tenants=b.tenants.filter(v=>v!==old);b.tenants.push({id:old?.id??crypto.randomUUID(),room_id:room.id,name:text(p,'name',60),type:p.type as 'retail'|'food'|'cinema',rent_per_hour:rate(p.rent_per_hour,10)});b.version++;q.upsert.push(b);q.result={tenants:b.tenants.length};
 }else if(op==='hotel_room'){
  const b=structuredClone(owned(c,p.building_id,'building',realm));if(!b.hotel)return fail('HOTEL_REQUIRED');const room=b.hotel.rooms.find(v=>v.room_id===p.room_id);if(!room||!['standard','suite'].includes(String(p.type)))return fail('INVALID_ROOM');room.type=p.type as 'standard'|'suite';room.rate=rate(p.rate,10);b.version++;q.upsert.push(b);q.result={room};
 }else if(op==='staff_set'){
  const b=structuredClone(owned(c,p.building_id,'building',realm)),staff=integer(p,'staff',0,20);if(staff>b.staff)t.bill(c,q,b,'staff:'+crypto.randomUUID(),'Staff training',priced(staff-b.staff,300));b.staff=staff;b.version++;q.upsert.push(b);q.result={staff,capacity:b.capacity,maintenance:'Staff productivity is bounded; no recurring automatic wallet debit'};
 }else if(op==='restaurant_menu'){
  const b=structuredClone(owned(c,p.building_id,'building',realm));if(b.archetype!=='restaurant')return fail('RESTAURANT_REQUIRED');if(!Array.isArray(p.menu)||p.menu.length>24)return fail('INVALID_MENU');
  const menu=p.menu.map(v=>{if(!v||typeof v!=='object')return fail('INVALID_MENU');const r=v as Record<string,unknown>;return {id:crypto.randomUUID(),name:text(r,'name',50),category:text(r,'category',30),price:rate(r.price,20)};});
  b.restaurant={menu,opens:integer(p,'opens',0,23),closes:integer(p,'closes',0,23),served:b.restaurant?.served??0,satisfaction:b.restaurant?.satisfaction??0};b.version++;q.upsert.push(b);q.result={items:menu.length};
 }else if(op==='furniture_buy'){
  const item=FURNITURE.find(v=>v.id===p.type);if(!item)return fail('FURNITURE_NOT_FOUND');const f:Furniture={...t.base(c,realm,'furniture',item.ar),kind:'furniture',type:item.id,building_id:null,room_id:null,floor:0,x:0,z:0,rotation:0,width:item.width,depth:item.depth,material:'wood',status:'stored'};
  t.bill(c,q,f,'body','Movable '+item.en,priced(1,item.price));q.upsert.push(f);q.result={furniture_id:f.id,stored:true};
 }else if(op==='furniture_place'||op==='furniture_store'){
  const f=structuredClone(owned(c,p.furniture_id,'furniture',realm,true));if(op==='furniture_place')furnished(c,p,f,realm);else{f.status='stored';f.building_id=null;f.room_id=null;}f.version++;q.upsert.push(f);q.result={furniture_id:f.id,status:f.status};
 }else if(op==='furniture_demolish'){
  const f=owned(c,p.furniture_id,'furniture',realm,true);t.destroy(c,q,f.id);q.retire.push(f.id);q.result={furniture_id:f.id};
 }else if(op==='simulation_tick'){
  // One shared allowance across all entities. No offline compounding: at most 30 minutes.
  const power=graph(c,realm,'power'),hour=worldHour(c),solar=[...power.nodes.values()].filter(n=>n.role==='solar');
  for(const node of power.nodes.values()){if(node.role!=='battery')continue;const elapsed=Math.max(0,Math.min(1800,(Date.parse(c.now)-Date.parse(node.last_tick_at))/1000));if(elapsed<10)continue;const production=solar.filter(n=>shortestPath(power,n.id,node.id)).reduce((a,n)=>a+n.capacity*Math.max(0,Math.sin((hour-6)*Math.PI/12)),0),load=[...power.nodes.values()].filter(n=>['consumer','streetlight'].includes(n.role)&&shortestPath(power,node.id,n.id)).reduce((a,n)=>a+n.demand,0),energy=Math.max(0,Math.min(node.capacity*2,node.energy+(production-load)*elapsed/3600));q.upsert.push({...structuredClone(node),energy:Math.round(energy*1000)/1000,last_tick_at:c.now,version:node.version+1});}
  const m=metrics(c,realm),buildings=c.world.entities.filter((v):v is Building=>v.kind==='building'&&v.realm===realm&&v.status==='active'&&!!v.opened_at),homes=buildings.filter(b=>['house','villa'].includes(b.archetype));let gross=0n;
  for(const original of buildings){const b=structuredClone(original),elapsed=Math.max(0,Math.min(1800,(Date.parse(c.now)-Date.parse(b.last_income_at))/1000));if(elapsed<10)continue;
   const reachable=homes.filter(h=>travel(c,realm,entrance(h),entrance(b))!==null).length,service=(!c.world.settings.infrastructure||m.powered.includes(b.id)&&m.watered.includes(b.id)&&m.sewage.includes(b.id))&&b.staff>0;
   const comfort=Math.max(25,m.score??50);let hourly=0n;
   if(service&&reachable){if(b.archetype==='mall')hourly=b.tenants.reduce((a,v)=>a+amount(v.rent_per_hour),0n);
    if(b.hotel){const beds=b.hotel.rooms.length,seed=Math.floor(Date.parse(c.now)/300000)+b.id.charCodeAt(0),occupied=Math.min(beds,reachable,Math.floor((seed%5+1)*beds/5));b.hotel.occupied=occupied;b.hotel.arrivals+=Math.max(0,occupied-original.hotel!.occupied);b.hotel.last_tick_at=c.now;hourly=b.hotel.rooms.slice(0,occupied).reduce((a,r)=>a+amount(r.rate),0n);}
    if(b.restaurant){const hour=worldHour(c),open=b.restaurant.opens<=b.restaurant.closes?hour>=b.restaurant.opens&&hour<b.restaurant.closes:hour>=b.restaurant.opens||hour<b.restaurant.closes;const seats=c.world.entities.filter(v=>v.kind==='furniture'&&v.building_id===b.id&&v.type==='chair'&&v.status==='active').length;
     if(open&&b.restaurant.menu.length&&seats){const customers=Math.min(seats,reachable,b.staff*2);b.restaurant.served+=Math.floor(customers*elapsed/300);b.restaurant.satisfaction=comfort;hourly=b.restaurant.menu.reduce((a,v)=>a+amount(v.price),0n)/BigInt(b.restaurant.menu.length)*BigInt(customers);}}
   }else if(b.hotel)b.hotel.occupied=0;
   // Yuyi is funded by explicit MAD grants only; its businesses are visual, never mint MAD/MAIN.
   if(realm==='main')gross+=hourly*BigInt(Math.floor(elapsed))*BigInt(comfort)/(3600n*100n);
   b.last_income_at=c.now;b.version++;q.upsert.push(b);
  }
  const allowance=passiveRemaining(c.eligible_income,c.income_paid),profit=(gross<allowance?gross:allowance)/100n*100n;
  if(profit>0n)q.income={amount:money(profit/100n*100n)};q.result={gross:money(gross),income:money(profit/100n*100n),remaining:money(allowance-profit),eligible_last_24h:c.eligible_income,cap_policy:'20% of eligible real-life earnings in 24 hours, at most 60 SAR-equivalent total; all businesses share this allowance',metrics:m};
 }else return false;return true;
}
