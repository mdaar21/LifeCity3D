import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {randomUUID} from 'node:crypto';
import {createLocalDatabase,type LocalDatabase} from '../../server/database';
import {createPlayer,runCommand,state} from './fixtures';
let db:LocalDatabase;
beforeAll(async()=>{db=await createLocalDatabase({path:'memory://'});});
afterAll(async()=>{await db?.close();});
const fx=()=>({result:'success',base_code:'SAR',provider:'https://www.exchangerate-api.com',time_last_update_unix:Math.floor(Date.now()/1000),time_next_update_unix:Math.floor(Date.now()/1000)+86400,rates:{SAR:1,MAD:2.625,USD:0.2666666667,EUR:0.25}});
async function snapshot(id:string){return (await state(db,id)) as unknown as {wallet:{balance:number;player_xp:number;city_xp:number};inventory:{id:string}[];placements:unknown[];world:{size:number};v6:{yuyi_wallet:{balance:string;currency:string};yuyi_world:{size:number;version:number};yuyi_inventory:{id:string}[];yuyi_placements:{id:string}[];yuyi_ledger:{delta:number;source:string;actor_id:string;reverses_id:string|null}[];fx:unknown;demolitions:unknown[]}};}
describe('V6 isolated MAD ledger and adjacent-city foundation',()=>{
 it('new identities get two empty plots and zero wallets without modifying the original wallet',async()=>{
  const u=await createPlayer(db,'empty');const s=await snapshot(u.id);
  expect(s.wallet.balance).toBe(0);expect(s.v6.yuyi_wallet).toEqual({balance:'0.0000',currency:'MAD'});
  expect(s.v6.yuyi_world.size).toBe(s.world.size);expect(s.inventory).toEqual([]);expect(s.placements).toEqual([]);expect(s.v6.yuyi_inventory).toEqual([]);expect(s.v6.yuyi_placements).toEqual([]);
 });
 it('owner reports exact MAD amounts with honest actor, idempotency and immutable compensating reversal',async()=>{
  const u=await createPlayer(db,'mad',40);const key=randomUUID();
  const r=await runCommand(db,u.id,'yuyi_adjust',{amount:'80.25',note:'Owner reports Yuyi instruction',confirmed:true},key);
  await runCommand(db,u.id,'yuyi_adjust',{amount:'80.25',note:'Owner reports Yuyi instruction',confirmed:true},key);
  await runCommand(db,u.id,'yuyi_adjust',{amount:'-35',confirmed:true});let s=await snapshot(u.id);
  expect(s.wallet.balance).toBe(40);expect(s.v6.yuyi_wallet.balance).toBe('45.2500');expect(s.v6.yuyi_ledger).toHaveLength(2);
  expect(s.v6.yuyi_ledger[0]).toMatchObject({source:'manual_yuyi_instruction',actor_id:u.id});
  await runCommand(db,u.id,'yuyi_reverse',{entry_id:r.result.entry_id,confirmed:true});s=await snapshot(u.id);expect(s.v6.yuyi_wallet.balance).toBe('-35.0000');expect(s.wallet.balance).toBe(40);
  await expect(runCommand(db,u.id,'yuyi_reverse',{entry_id:r.result.entry_id,confirmed:true})).rejects.toThrow(/ALREADY_REVERSED/);
  await expect(runCommand(db,u.id,'yuyi_adjust',{amount:'1.001',confirmed:true})).rejects.toThrow(/INVALID_AMOUNT/);
  await expect(runCommand(db,u.id,'yuyi_adjust',{amount:'1'})).rejects.toThrow(/CONFIRMATION_REQUIRED/);
 });
 it('uses server FX quotes for Yuyi purchases, validates ownership/collision and refunds half actual MAD cost exactly once',async()=>{
  await db.owner(tx=>tx.query('select public.fx_store_snapshot($1::jsonb)',[JSON.stringify(fx())]));
  const u=await createPlayer(db,'tree',7),other=await createPlayer(db,'stranger');
  await runCommand(db,u.id,'yuyi_adjust',{amount:'80',confirmed:true});
  const q=await runCommand(db,u.id,'yuyi_quote',{catalog_id:'tree'});expect(q.result.mad_cost).toBe(52.5);
  await expect(runCommand(db,other.id,'yuyi_purchase',{quote_id:q.result.id})).rejects.toThrow(/NOT_FOUND/);
  const key=randomUUID();const buy=await runCommand(db,u.id,'yuyi_purchase',{quote_id:q.result.id},key);await runCommand(db,u.id,'yuyi_purchase',{quote_id:q.result.id},key);
  await expect(runCommand(db,u.id,'yuyi_purchase',{quote_id:q.result.id})).rejects.toThrow(/QUOTE_USED/);
  const p=await runCommand(db,u.id,'yuyi_place',{inventory_id:buy.result.inventory_id,x:2,z:3,rotation:90});
  let s=await snapshot(u.id);expect(s.wallet.balance).toBe(7);expect(s.v6.yuyi_wallet.balance).toBe('27.5000');
  const quoted=await runCommand(db,u.id,'demolition_quote',{realm:'yuyi',placement_id:p.result.placement_id,expected_version:1});expect(Number(quoted.result.refund)).toBe(26.25);
  const payload={realm:'yuyi',placement_id:p.result.placement_id,expected_version:1,quoted_basis:quoted.result.paid_basis,confirmed:true};const demolitionKey=randomUUID();
  await Promise.all([runCommand(db,u.id,'demolish',payload,demolitionKey),runCommand(db,u.id,'demolish',payload,demolitionKey)]);
  s=await snapshot(u.id);expect(s.v6.yuyi_wallet.balance).toBe('53.7500');expect(s.wallet.balance).toBe(7);expect(s.v6.yuyi_inventory).toHaveLength(0);expect(s.v6.yuyi_placements).toHaveLength(0);expect(s.v6.demolitions).toHaveLength(1);
  await expect(runCommand(db,u.id,'yuyi_place',{inventory_id:buy.result.inventory_id,x:0,z:0,rotation:0})).rejects.toThrow(/NOT_OWNED/);
 });
 it('refunds verified MAIN purchase history, excludes recovered furniture and keeps original land',async()=>{
  const u=await createPlayer(db,'main',2000);
  const house=await runCommand(db,u.id,'purchase',{catalog_id:'house'});const p=await runCommand(db,u.id,'place',{inventory_id:house.result.inventory_id,x:0,z:0,rotation:0});
  const chair=await runCommand(db,u.id,'purchase',{catalog_id:'desk'});await runCommand(db,u.id,'interior_place',{inventory_id:chair.result.inventory_id,house_id:p.result.placement_id,x:0,z:0,rotation:0});
  const before=await snapshot(u.id);const quote=await runCommand(db,u.id,'demolition_quote',{placement_id:p.result.placement_id,expected_version:1});
  expect(Number(quote.result.paid_basis)).toBe(800);expect(Number(quote.result.refund)).toBe(400);expect(quote.result.kept_inventory).toEqual([chair.result.inventory_id]);
  await runCommand(db,u.id,'demolish',{placement_id:p.result.placement_id,expected_version:1,quoted_basis:quote.result.paid_basis,confirmed:true});
  const after=await snapshot(u.id);expect(after.wallet.balance).toBe(before.wallet.balance+400);expect(after.world.size).toBe(before.world.size);expect(after.inventory).toHaveLength(1);expect(after.inventory[0]!.id).toBe(chair.result.inventory_id);expect(after.v6.yuyi_wallet.balance).toBe('0.0000');
 });
 it('blocks direct money writes, cross-owner reads and authenticated FX imports',async()=>{
  const a=await createPlayer(db,'owner'),b=await createPlayer(db,'other');
  await runCommand(db,a.id,'yuyi_adjust',{amount:'123.45',confirmed:true});
  expect((await db.asUser(b.id,tx=>tx.query('select * from public.yuyi_wallets where user_id=$1',[a.id]))).rows).toEqual([]);
  await expect(db.asUser(a.id,tx=>tx.query('update public.yuyi_wallets set balance=900 where user_id=$1',[a.id]))).rejects.toThrow(/permission denied/i);
  await expect(db.asUser(a.id,tx=>tx.query('select public.fx_store_snapshot($1::jsonb)',[JSON.stringify(fx())]))).rejects.toThrow(/permission denied/i);
  await expect(db.asUser(a.id,tx=>tx.query("select lifecity_private.yuyi_post($1,9,'manual_yuyi_instruction','',$1,'hack')",[a.id]))).rejects.toThrow(/permission denied/i);
 });
});
it('includes explicitly destroyed furniture basis and rolls back an unconfirmed or changed quote atomically',async()=>{
 const u=await createPlayer(db,'destroy-furniture',2000);const house=await runCommand(db,u.id,'purchase',{catalog_id:'house'});const p=await runCommand(db,u.id,'place',{inventory_id:house.result.inventory_id,x:0,z:0,rotation:0});const desk=await runCommand(db,u.id,'purchase',{catalog_id:'desk'});await runCommand(db,u.id,'interior_place',{house_id:p.result.placement_id,inventory_id:desk.result.inventory_id,x:0,z:0,rotation:0});
 const original=await state(db,u.id);const payload={placement_id:p.result.placement_id,expected_version:1,destroy_furniture_ids:[desk.result.inventory_id]};const q=await runCommand(db,u.id,'demolition_quote',payload);const paid=800+original.catalog.find(x=>x.id==='desk')!.price;
 expect(Number(q.result.paid_basis)).toBe(paid);expect(q.result.kept_inventory).toEqual([]);
 await expect(runCommand(db,u.id,'demolish',{...payload,quoted_basis:'0.0000',confirmed:true})).rejects.toThrow(/QUOTE_EXPIRED/);expect((await state(db,u.id)).wallet).toEqual(original.wallet);expect((await state(db,u.id)).placements).toEqual(original.placements);
 await expect(runCommand(db,u.id,'demolish',{...payload,quoted_basis:q.result.paid_basis})).rejects.toThrow(/CONFIRMATION_REQUIRED/);
 await runCommand(db,u.id,'demolish',{...payload,quoted_basis:q.result.paid_basis,confirmed:true});const after=await state(db,u.id);expect(after.inventory).toHaveLength(0);expect(after.furniture).toHaveLength(0);expect(after.wallet.balance).toBe(original.wallet.balance+paid/2);
});
it('preserves half-cent MAD refunds and never rounds them into spendable extra purchasing power',async()=>{
 const small=await createLocalDatabase({path:'memory://'});try{const data=fx();data.rates.MAD=0.0005;await small.owner(tx=>tx.query('select public.fx_store_snapshot($1::jsonb)',[JSON.stringify(data)]));const u=await createPlayer(small,'half-cent');await runCommand(small,u.id,'yuyi_adjust',{amount:'0.01',confirmed:true});const q=await runCommand(small,u.id,'yuyi_quote',{catalog_id:'tree'});expect(q.result.mad_cost).toBe(.01);const buy=await runCommand(small,u.id,'yuyi_purchase',{quote_id:q.result.id});const p=await runCommand(small,u.id,'yuyi_place',{inventory_id:buy.result.inventory_id,x:0,z:0,rotation:0});const dq=await runCommand(small,u.id,'demolition_quote',{realm:'yuyi',placement_id:p.result.placement_id,expected_version:1});expect(Number(dq.result.refund)).toBe(.005);await runCommand(small,u.id,'demolish',{realm:'yuyi',placement_id:p.result.placement_id,expected_version:1,quoted_basis:dq.result.paid_basis,confirmed:true});expect((await state(small,u.id)).v6!.yuyi_wallet.balance).toBe('0.0050');const again=await runCommand(small,u.id,'yuyi_quote',{catalog_id:'tree'});await expect(runCommand(small,u.id,'yuyi_purchase',{quote_id:again.result.id})).rejects.toThrow(/INSUFFICIENT_BALANCE/);
 }finally{await small.close();}
});
it('changing display currency never mints value or alters the permanently MAD wallet',async()=>{
 const data=fx() as ReturnType<typeof fx>&{rates:Record<string,number>};data.rates.KWD=.0812;await db.owner(tx=>tx.query('select public.fx_store_snapshot($1::jsonb)',[JSON.stringify(data)]));
 const u=await createPlayer(db,'currency',40);await runCommand(db,u.id,'yuyi_adjust',{amount:'80.25',confirmed:true});for(const currency of ['USD','MAD','KWD','SAR']){await runCommand(db,u.id,'currency_set',{currency});const s=await state(db,u.id);expect(s.wallet.balance).toBe(40);expect(s.v6!.yuyi_wallet).toEqual({balance:'80.2500',currency:'MAD'});expect(s.v6!.display_currency).toBe(currency);}
});
