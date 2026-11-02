import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {randomUUID} from 'node:crypto';
import {createLocalDatabase,type LocalDatabase} from '../../server/database';
import {runWorldCommand} from '../../server/world';
import {createPlayer,state} from './fixtures';
import type {Building,WorldQuote} from '../../supabase/functions/_shared/world-types';
import {amount,buildingHeight} from '../../supabase/functions/_shared/world-math';
let db:LocalDatabase;
beforeAll(async()=>{db=await createLocalDatabase({path:'memory://'});});afterAll(async()=>{await db?.close();});
describe('actual maximum-height SQL persistence and bounded atomic floor batches',()=>{
 it('purchases and completes a250-floor1000m tower, keeps receipts and original costs, replays a batch once and restores it',async()=>{
  const p=await createPlayer(db,'large-plan',2000000);await db.owner(tx=>tx.query("insert into public.study_sessions(user_id,status,started_at,last_tick_at,active_seconds,credited_minutes,bonus_awarded) values($1,'finished',clock_timestamp()-interval '8 days',clock_timestamp()-interval '1 day',360000,6000,true)",[p.id]));
  const snapshot=()=>state(db,p.id);const apply=async(operation:string,request:Record<string,unknown>={})=>runWorldCommand(db,p.id,'world_apply',{operation,request:{realm:'main',...request},expected_revision:(await snapshot()).world_systems!.revision});
  const buy=async(operation:string,request:Record<string,unknown>={})=>{const r=await runWorldCommand(db,p.id,'world_quote',{operation,request:{realm:'main',...request},expected_revision:(await snapshot()).world_systems!.revision});const quote=r.result.quote as WorldQuote;expect(quote.patch.bill.length).toBeLessThanOrEqual(256);const key=randomUUID(),payload={quote_id:quote.id,expected_revision:quote.revision,confirmed:true};const paid=await runWorldCommand(db,p.id,'world_commit',payload,key);return {paid,replay:()=>runWorldCommand(db,p.id,'world_commit',payload,key),quote};};
  await apply('initialize');const initial=await snapshot(),parcel=initial.world_systems!.entities.find(e=>e.kind==='parcel'&&e.realm==='main')!.id;
  const plan=await apply('blueprint_generate',{name:'Thousand meters',archetype:'tower_glass',width:12,depth:12,floors:250,accessible:true,budget:'2000000',parcel_id:parcel});
  const start=await buy('building_start',{blueprint_id:plan.result.blueprint_id,parcel_id:parcel,name:'Thousand meters',x:1,z:1}),id=String(start.paid.result.building_id);
  const get=(s:Awaited<ReturnType<typeof snapshot>>)=>s.world_systems!.entities.find((e):e is Building=>e.kind==='building'&&e.id===id)!;
  let s=await snapshot(),b=get(s);expect(b.floors).toHaveLength(250);expect(buildingHeight(b)).toBe(1000);const original=structuredClone(s.world_systems!.components),total=b.pricing!.total;
  let replayed=false;for(let attempts=0;attempts<40&&!b.opened_at;attempts++){const next=b.stages.find(v=>!v.paid)!;const op=next.type==='floor'?'building_stage_batch':'building_stage';const batch=await buy(op,{building_id:id,stage:next.id,count:8,price:0});if(op==='building_stage_batch'&&!replayed){const beforeReplay=await snapshot();await batch.replay();expect((await snapshot()).wallet).toEqual(beforeReplay.wallet);replayed=true;}s=await snapshot();b=get(s);}
  expect(b.opened_at).toBeTruthy();expect(b.stages.every(s=>s.paid)).toBe(true);expect(b.floors.filter(f=>f.height===4)).toHaveLength(250);expect(amount(String(initial.wallet.balance))-amount(String(s.wallet.balance))).toBe(amount(total));expect(s.v6!.yuyi_wallet).toEqual(initial.v6!.yuyi_wallet);for(const part of original)expect(s.world_systems!.components.find(v=>v.id===part.id)).toEqual(part);
  const independent=await snapshot();expect(get(independent)).toEqual(b);expect(independent.world_systems!.components).toEqual(s.world_systems!.components);const size=await db.owner(tx=>tx.query<{bytes:number}>("select octet_length(data::text) bytes from public.world_entities where id=$1",[id]));expect(size.rows[0].bytes).toBeLessThanOrEqual(1048576);
  const forbidden=await createPlayer(db,'other');await expect(runWorldCommand(db,forbidden.id,'world_quote',{operation:'building_extend',request:{realm:'main',building_id:id},expected_revision:0})).rejects.toThrow();
 },180000);
});
