import {createHash} from 'node:crypto';
import {describe,expect,it} from 'vitest';
import {emptyWorld,previewTransition,worldTransition} from '../../supabase/functions/_shared/world-engine';
import {amount,money,surfaceBlocked,buildingHeight,floorElevation} from '../../supabase/functions/_shared/world-math';
import {BUILDING_CATALOG,isTower} from '../../supabase/functions/_shared/building-catalog';
import {generatePlans,defaultRooms,estimateConstruction,constructionPricing} from '../../supabase/functions/_shared/world-planner';
import {agentsFor,tickAgents} from '../../supabase/functions/_shared/world-simulation';
import {towerGeometry} from '../../src/world/TowerExterior';
import type {Archetype,Building,WorldContext} from '../../supabase/functions/_shared/world-types';
function fixture(realm:'main'|'yuyi'='main'){
 const c:WorldContext={user_id:crypto.randomUUID(),now:'2026-11-02T12:00:00Z',world:emptyWorld(),balances:{MAIN:'1000000000',YUYI_MAD:'1000000000'},fx:{id:crypto.randomUUID(),rate_time:'2026-11-02T10:00:00Z',mad_rate:'2.625',display_rate:'1',currency:'SAR'},legacy:[],legacy_sizes:{main:16,yuyi:16},legacy_versions:{main:1,yuyi:1},eligible_income:'0',income_paid:'0',legitimate_minutes:1200,legitimate_actions:10000,milestones:[],receipt:null};
 const step=(action:string,p:Record<string,unknown>)=>{const r=worldTransition(c,action,{...p,expected_revision:c.world.revision});c.world=previewTransition(c,r);for(const l of r.patch.bill)c.balances[l.wallet]=money(amount(c.balances[l.wallet])-amount(l.paid));for(const l of r.refunds)c.balances[l.wallet]=money(amount(c.balances[l.wallet])+amount(l.amount));return r;};
 const apply=(operation:string,request:Record<string,unknown>={})=>step('world_apply',{operation,request:{realm,...request}});
 const buy=(operation:string,request:Record<string,unknown>={})=>{const q=step('world_quote',{operation,request:{realm,...request}}).quote!;return step('world_commit',{quote_id:q.id,confirmed:true});};
 apply('initialize');const parcel=c.world.entities.find(e=>e.kind==='parcel'&&e.realm===realm)!.id;
 const get=(id:string)=>c.world.entities.find((e):e is Building=>e.kind==='building'&&e.id===id)!;
 const start=(archetype:Archetype,floors:number)=>{const p=BUILDING_CATALOG[archetype],bp=apply('blueprint_generate',{...p,archetype,floors,accessible:isTower(archetype),budget:'1000000000',name:archetype,parcel_id:parcel});return String(buy('building_start',{blueprint_id:bp.result.blueprint_id,parcel_id:parcel,x:1,z:1,name:archetype,contractor:'moss'}).result.building_id);};
 const finish=(id:string)=>{while(get(id).stages.some(s=>!s.paid))buy('building_stage',{building_id:id,stage:get(id).stages.find(s=>!s.paid)!.id});};
 return {c,apply,buy,start,finish,get};
}
describe('living city, connected roads and gradual four-meter skyline',()=>{
 it('keeps exact tile road adjacency valid without permitting overlaps or erasing building clearance',()=>{
  const {c}=fixture();c.legacy.push({id:'paid-road',realm:'main',catalog_id:'road',x:2,z:2,width:1,depth:1});
  expect(surfaceBlocked(c,'main',{x:2,z:3,width:1,depth:1},undefined,0)).toBe(false);
  expect(surfaceBlocked(c,'main',{x:2,z:2,width:1,depth:1},undefined,0)).toBe(true);
  expect(surfaceBlocked(c,'main',{x:2,z:3,width:1,depth:1})).toBe(true);
 });
 it('adds exactly one resident per completed paid home, walks out and returns, and restores deterministic ownership',()=>{
  const f=fixture();expect(agentsFor(f.c,'main')).toEqual([]);const id=f.start('house',1);expect(agentsFor(f.c,'main')).toEqual([]);f.finish(id);
  const agents=agentsFor(f.c,'main');expect(agents).toHaveLength(1);expect(agents[0].home_id).toBe(id);expect(agents[0].points.length).toBeGreaterThan(2);expect(agentsFor(structuredClone(f.c),'main').map(a=>a.id)).toEqual(agents.map(a=>a.id));
  let departed=false,returned=false;const a=agents[0],start={x:a.x,z:a.z};for(let i=0;i<1800;i++){tickAgents(agents,f.c,'main',.1,Date.parse(f.c.now)/1000+i*.1);if(Math.hypot(a.x-start.x,a.z-start.z)>.6)departed=true;if(departed&&a.hidden){returned=true;break;}}
  expect(departed).toBe(true);expect(returned).toBe(true);expect(agentsFor(f.c,'yuyi')).toHaveLength(0);
 });
 it('supports legacy purchased homes too, without adding free entities or duplicate residents',()=>{
  const f=fixture();f.c.legacy.push({id:'old-paid-home',catalog_id:'house',realm:'main',x:3,z:3,width:2,depth:2});const before=structuredClone(f.c.world);const agents=agentsFor(f.c,'main');expect(agents).toHaveLength(1);expect(agents[0].home_id).toBe('old-paid-home');expect(f.c.world).toEqual(before);
 });
 it('enforces38–250 floors, exactly4m per tower floor, monotonic modest additional-floor prices for all eight designs',()=>{
  for(const id of Object.keys(BUILDING_CATALOG).filter(isTower) as Archetype[]){const p=BUILDING_CATALOG[id],make=(floors:number)=>generatePlans({...p,archetype:id,floors,rooms:defaultRooms(id),accessible:true,budget:'1000000000'},{x:0,z:0,width:16,depth:16});
   expect(()=>make(37)).toThrow();expect(()=>make(251)).toThrow();const floors=make(250);expect(floors).toHaveLength(250);expect(floors.every(f=>f.height===4)).toBe(true);expect(floors.reduce((n,f)=>n+f.height,0)).toBe(1000);
   const first=estimateConstruction(12,12,38,'moss',true,undefined,id),next=estimateConstruction(12,12,39,'moss',true,undefined,id),last=estimateConstruction(12,12,250,'moss',true,undefined,id);expect(amount(next)).toBeGreaterThan(amount(first));expect(amount(next)-amount(first)).toBeLessThan(amount(first)/30n);expect(amount(last)).toBeGreaterThan(amount(next));
   const pricing=constructionPricing(12,12,make(38),'moss',id);expect(amount(pricing.tower_floor_price!)).toBe(amount(next)-amount(first));expect(Object.values(pricing.components).reduce((n,v)=>n+amount(v),0n)).toBe(amount(pricing.total));
  }
 });
 it('settles a one-floor tower expansion once while preserving old receipts/roof costs, MAIN/MAD isolation and50% demolition',()=>{
  const f=fixture('yuyi'),id=f.start('tower_glass',38);f.finish(id);const old=structuredClone(f.c.world.components),b=f.get(id),main=f.c.balances.MAIN,before=f.c.balances.YUYI_MAD;expect(buildingHeight(b)).toBe(152);expect(floorElevation(b,37)).toBe(148);expect(()=>worldTransition(f.c,'world_quote',{operation:'floor_demolish',request:{realm:'yuyi',building_id:id,floor:37},expected_revision:f.c.world.revision})).toThrow('FLOOR_LIMIT');
  const r=f.buy('building_extend',{building_id:id,price:0,additional_floor_price:'0.0001'});expect(f.get(id).floors).toHaveLength(39);expect(buildingHeight(f.get(id))).toBe(156);expect(f.get(id).opened_at).toBeTruthy();const rooftop=worldTransition(f.c,'world_quote',{operation:'rooftop_solar',request:{realm:'yuyi',building_id:id},expected_revision:f.c.world.revision}).quote!.patch.upsert.find(e=>e.kind==='node');expect(rooftop?.kind==='node'&&rooftop.y).toBeCloseTo(156.1);const removal=worldTransition(f.c,'world_quote',{operation:'floor_demolish',request:{realm:'yuyi',building_id:id,floor:38},expected_revision:f.c.world.revision}).quote!.patch.upsert.find(e=>e.kind==='building');expect(removal?.kind==='building'&&buildingHeight(removal)).toBe(152);expect(r.patch.bill).toHaveLength(1);expect(amount(before)-amount(f.c.balances.YUYI_MAD)).toBe(amount(r.patch.bill[0].paid));expect(f.c.balances.MAIN).toBe(main);for(const c of old)expect(f.c.world.components.find(p=>p.id===c.id)).toEqual(c);
  const paid=f.c.world.components.filter(c=>c.entity_id===id&&!c.destroyed_at).reduce((n,v)=>n+amount(v.paid),0n),demolition=f.buy('building_demolish',{building_id:id,destroy_furniture_ids:[],confirm_dependents:true});expect(demolition.refunds.reduce((n,r)=>n+amount(r.amount),0n)).toBe(paid/2n);expect(f.c.balances.MAIN).toBe(main);
 });
 it('builds distinct bounded tower geometry at1000m without one React mesh per floor',()=>{
  const signatures=new Set<string>();for(const id of Object.keys(BUILDING_CATALOG).filter(isTower)){const shapes=towerGeometry(id,12,12,1000);let count=0;for(const g of Object.values(shapes)){const p=g.getAttribute('position');count+=p.count;expect([...p.array].every(Number.isFinite)).toBe(true);expect(g.boundingBox!.min.y).toBeGreaterThanOrEqual(-.01);expect(g.boundingBox!.max.y).toBeLessThanOrEqual(1000.01);expect(p.count).toBeLessThan(70000);}signatures.add(createHash('sha256').update(new Uint8Array(shapes.shell.getAttribute('position').array.buffer)).digest('hex'));expect(count).toBeLessThan(100000);for(const g of Object.values(shapes))g.dispose();}expect(signatures.size).toBe(8);
 });
});
