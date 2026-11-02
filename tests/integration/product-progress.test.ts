import {beforeAll,afterAll,it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {createLocalDatabase,type LocalDatabase} from '../../server/database';
import {runWorldCommand} from '../../server/world';
import {createPlayer,runCommand,state} from './fixtures';
import type {WorldQuote} from '../../supabase/functions/_shared/world-types';
let db:LocalDatabase;beforeAll(async()=>{db=await createLocalDatabase({path:'memory://'});});afterAll(async()=>{await db.close();});
it('enforces real server XP on both wallets and new-world purchases, rechecks commits and grandfathers owned assets',async()=>{
 const p=await createPlayer(db,'progress',100000),snapshot=()=>state(db,p.id);
 const command=async(action:string,operation:string,request:Record<string,unknown>)=>runWorldCommand(db,p.id,action,{operation,request:{realm:'main',...request},expected_revision:(await snapshot()).world_systems!.revision});
 await command('world_apply','initialize',{});const before=await snapshot();
 await expect(runCommand(db,p.id,'purchase',{catalog_id:'villa',level:40})).rejects.toThrow('ITEM_LOCKED');
 await expect(command('world_quote','furniture_buy',{type:'shelf',level:40,progress_xp:{main:152100}})).rejects.toThrow('ITEM_LOCKED');expect((await snapshot()).wallet).toEqual(before.wallet);
 await db.owner(tx=>tx.query('select public.fx_store_snapshot($1::jsonb)',[JSON.stringify({result:'success',provider:'https://www.exchangerate-api.com',base_code:'SAR',time_last_update_unix:Math.floor(Date.now()/1000),time_next_update_unix:Math.floor(Date.now()/1000)+86400,rates:{SAR:1,MAD:2.625}})]));await runCommand(db,p.id,'yuyi_adjust',{amount:'10000',confirmed:true});const madBefore=(await snapshot()).v6!.yuyi_wallet;const yq=await runCommand(db,p.id,'yuyi_quote',{catalog_id:'villa'});await expect(runCommand(db,p.id,'yuyi_purchase',{quote_id:yq.result.id,level:40})).rejects.toThrow('ITEM_LOCKED');expect((await snapshot()).v6!.yuyi_wallet).toEqual(madBefore);
 await db.owner(tx=>tx.query('update public.wallets set player_xp=19600 where user_id=$1',[p.id])); // Real stored level15, no client override.
 const q=(await command('world_quote','furniture_buy',{type:'shelf'})).result.quote as WorldQuote;
 await db.owner(tx=>tx.query('update public.wallets set player_xp=0 where user_id=$1',[p.id]));
 await expect(runWorldCommand(db,p.id,'world_commit',{quote_id:q.id,expected_revision:q.revision,confirmed:true})).rejects.toThrow('ITEM_LOCKED');
 await db.owner(tx=>tx.query('update public.wallets set player_xp=19600 where user_id=$1',[p.id]));
 await runWorldCommand(db,p.id,'world_commit',{quote_id:q.id,expected_revision:q.revision,confirmed:true});
 const task=(await snapshot()).tasks.find(t=>t.key==='make_bed')!;await runCommand(db,p.id,'task_complete',{task_id:task.id});const parcel=(await snapshot()).world_systems!.entities.find(e=>e.kind==='parcel'&&e.realm==='main')!;const bp=(await command('world_apply','blueprint_generate',{parcel_id:parcel.id,name:'Owned villa',archetype:'villa',width:8,depth:12,floors:1,budget:'10000'})).result.blueprint_id;const bq=(await command('world_quote','building_start',{blueprint_id:bp,parcel_id:parcel.id,name:'Owned villa',x:1,z:1})).result.quote as WorldQuote;await runWorldCommand(db,p.id,'world_commit',{quote_id:bq.id,expected_revision:bq.revision,confirmed:true});
 const bought=await runCommand(db,p.id,'purchase',{catalog_id:'villa'}),owned=await snapshot();
 await db.owner(tx=>tx.query('update public.wallets set player_xp=0 where user_id=$1',[p.id]));
 const frame=(await command('world_quote','building_stage',{building_id:bq.patch.result.building_id,stage:'frame'})).result.quote as WorldQuote;await runWorldCommand(db,p.id,'world_commit',{quote_id:frame.id,expected_revision:frame.revision,confirmed:true});
 const placed=await runCommand(db,p.id,'place',{inventory_id:bought.result.inventory_id,x:12,z:1,rotation:0});
 await runCommand(db,p.id,'move',{placement_id:placed.result.placement_id,x:12,z:8,rotation:90,expected_version:1});await runCommand(db,p.id,'remove',{placement_id:placed.result.placement_id,expected_version:2});
 expect((await snapshot()).inventory.map(v=>({id:v.id,catalog_id:v.catalog_id}))).toEqual(owned.inventory.map(v=>({id:v.id,catalog_id:v.catalog_id})));expect((await snapshot()).inventory[0].first_placed_at).toBeTruthy();expect((await snapshot()).world_systems!.entities.some(e=>e.id===q.patch.result.furniture_id&&e.status==='stored')).toBe(true);
 await expect(db.asUser(p.id,tx=>tx.query('select public.world_service_context($1,$2)',[p.id,randomUUID()]))).rejects.toThrow();
});
