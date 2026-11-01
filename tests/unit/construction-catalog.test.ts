import {describe,it,expect} from 'vitest';
import {BUILDING_CATALOG} from '../../supabase/functions/_shared/building-catalog';
import {constructionPricing,constructionQuotedTotals,defaultRooms,generatePlans,estimateConstruction} from '../../supabase/functions/_shared/world-planner';
import {amount,money,priced} from '../../supabase/functions/_shared/world-math';
import {emptyWorld,worldTransition,previewTransition} from '../../supabase/functions/_shared/world-engine';
import type {Archetype,Building,WorldContext} from '../../supabase/functions/_shared/world-types';
import {identityGeometry} from '../../src/world/BuildingIdentity';

function fixture(realm:'main'|'yuyi'='main'){
 const c:WorldContext={user_id:crypto.randomUUID(),now:'2026-11-01T12:00:00Z',world:emptyWorld(),balances:{MAIN:'1000000.0000',YUYI_MAD:'1000000.0000'},fx:{id:crypto.randomUUID(),rate_time:'2026-11-01T10:00:00Z',mad_rate:'2.625',display_rate:'1',currency:'SAR'},legacy:[],legacy_sizes:{main:16,yuyi:16},legacy_versions:{main:1,yuyi:1},eligible_income:'0',income_paid:'0',legitimate_minutes:1200,legitimate_actions:100,milestones:[],receipt:null};
 const step=(action:string,p:Record<string,unknown>)=>{const result=worldTransition(c,action,{...p,expected_revision:c.world.revision});c.world=previewTransition(c,result);for(const l of result.patch.bill)c.balances[l.wallet]=money(amount(c.balances[l.wallet])-amount(l.paid));for(const r of result.refunds)c.balances[r.wallet]=money(amount(c.balances[r.wallet])+amount(r.amount));return result;};
 const apply=(operation:string,request:Record<string,unknown>)=>step('world_apply',{operation,request:{realm,...request}});
 const quote=(operation:string,request:Record<string,unknown>)=>step('world_quote',{operation,request:{realm,...request}}).quote!;
 const commit=(q:ReturnType<typeof quote>)=>step('world_commit',{quote_id:q.id,confirmed:true});
 apply('initialize',{});const parcel=c.world.entities.find(e=>e.kind==='parcel'&&e.realm===realm)!;
 const start=(kind:Archetype)=>{const p=BUILDING_CATALOG[kind],plan=apply('blueprint_generate',{...p,archetype:kind,floors:1,budget:'1000000',name:kind,parcel_id:parcel.id});const q=quote('building_start',{blueprint_id:plan.result.blueprint_id,parcel_id:parcel.id,name:kind,x:1,z:1,pricing:{version:2,total:'0.0100'},price:1});commit(q);return q.patch.result.building_id as string;};
 const get=(id:string)=>c.world.entities.find((e):e is Building=>e.kind==='building'&&e.id===id)!;
 const finish=(id:string)=>{while(get(id).stages.some(v=>!v.paid)){const stage=get(id).stages.find(v=>!v.paid)!;commit(quote('building_stage',{building_id:id,stage:stage.id,price:0}));}};
 return {c,apply,quote,commit,start,get,finish};
}
describe('authoritative complete construction catalog',()=>{
 it('prices the small house at800 and every other basic type higher, with exact payable totals',()=>{
  expect(BUILDING_CATALOG.house.price).toBe(800);
  for(const [id,p] of Object.entries(BUILDING_CATALOG))for(const floors of [1,2,3])for(const contractor of ['moss','dune','sky']){
   const plans=generatePlans({...p,archetype:id as Archetype,floors,rooms:defaultRooms(id as Archetype),accessible:false,budget:'1000000'},{x:0,z:0,width:64,depth:64}),schedule=constructionPricing(p.width,p.depth,plans,contractor,id as Archetype);
   expect(Object.values(schedule.components).reduce((sum,v)=>sum+amount(v),0n)).toBe(amount(schedule.total));expect(Object.values(schedule.components).every(v=>amount(v)>0n&&amount(v)%100n===0n)).toBe(true);
   if(contractor==='moss'&&floors===1)expect(schedule.total).toBe(p.price+'.0000');
   if(id!=='house')expect(p.price).toBeGreaterThan(800);
  }
 });
 it('settles every actual stage at the advertised complete cost, ignores injected prices and refunds exactly50%',()=>{
  for(const id of Object.keys(BUILDING_CATALOG) as Archetype[]){const f=fixture(),before=f.c.balances.MAIN,b=f.start(id);f.finish(b);expect(amount(before)-amount(f.c.balances.MAIN)).toBe(BigInt(BUILDING_CATALOG[id].price)*10000n);expect(f.get(b).pricing!.total).toBe(BUILDING_CATALOG[id].price+'.0000');const paid=structuredClone(f.c.world.components);const q=f.quote('building_demolish',{building_id:b,destroy_furniture_ids:[],confirm_dependents:true});expect(q.refunds.reduce((n,l)=>n+amount(l.amount),0n)).toBe(BigInt(BUILDING_CATALOG[id].price)*5000n);f.commit(q);for(const part of paid)expect(f.c.world.components.find(c=>c.id===part.id)?.paid).toBe(part.paid);}
 });
 it('keeps existing partially paid buildings on their legacy rates and original cost bases',()=>{
  const f=fixture(),id=f.start('school'),b=f.get(id);delete b.pricing;const original=structuredClone(f.c.world.components),frame=f.quote('building_stage',{building_id:id,stage:'frame'});expect(frame.patch.bill.reduce((n,l)=>n+amount(l.canonical),0n)).toBe(amount(priced(b.width*b.depth,50,100)));f.commit(frame);for(const part of original)expect(f.c.world.components.find(c=>c.id===part.id)).toEqual(part);
 });
 it('keeps MAIN separate when new construction and refunds use dated MAD conversion',()=>{
  const f=fixture('yuyi'),main=f.c.balances.MAIN,mad=f.c.balances.YUYI_MAD,id=f.start('house');f.finish(id);expect(amount(mad)-amount(f.c.balances.YUYI_MAD)).toBe(amount(constructionQuotedTotals(f.get(id).pricing!,f.c.fx!.mad_rate).total));expect(f.c.balances.MAIN).toBe(main);expect(f.c.world.components.every(p=>p.wallet==='YUYI_MAD'&&p.fx_id===f.c.fx!.id)).toBe(true);const q=f.quote('building_demolish',{building_id:id,destroy_furniture_ids:[],confirm_dependents:true});expect(q.refunds.every(r=>r.wallet==='YUYI_MAD')).toBe(true);f.commit(q);expect(f.c.balances.MAIN).toBe(main);
 });
 it('increases with area/floors, honors contractor choices and prevents undersized bargain schools',()=>{
  expect(estimateConstruction(12,12,1,'moss',false,undefined,'school')).toBe('6500.0000');expect(estimateConstruction(4,5,1,'moss',false,undefined,'school')).toBe('6500.0000');expect(estimateConstruction(12,12,2,'moss',false,undefined,'school')).toBe('11180.0000');expect(amount(estimateConstruction(14,14,1,'moss',false,undefined,'school'))).toBeGreaterThan(65000000n);expect(estimateConstruction(8,12,1,'dune',false,undefined,'house')).toBe('720.0000');
 });
 it('gives all13 types different geometry, bounded to their architecture and a mobile triangle budget',()=>{
  const signatures=new Set<string>();for(const id of Object.keys(BUILDING_CATALOG) as Archetype[]){const shapes=identityGeometry(id,10,12,2,'#888888','#cccccc');signatures.add(JSON.stringify([shapes.roof.attributes.position.array,shapes.facade.attributes.position.array]));for(const g of [shapes.roof,shapes.facade]){g.computeBoundingBox();expect([...g.attributes.position.array].every(Number.isFinite)).toBe(true);expect(g.boundingBox!.min.x).toBeGreaterThanOrEqual(-.01);expect(g.boundingBox!.max.x).toBeLessThanOrEqual(10.2);expect(g.boundingBox!.min.z).toBeGreaterThanOrEqual(-.61);expect(g.boundingBox!.max.y).toBeLessThanOrEqual(8);expect(g.attributes.position.count/3).toBeLessThan(4500);g.dispose();}}expect(signatures.size).toBe(13);
 });
});
