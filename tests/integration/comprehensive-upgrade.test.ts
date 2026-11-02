import {expect,it} from 'vitest';
import {mkdtemp,mkdir,readdir,copyFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createLocalDatabase,type LocalDatabase} from '../../server/database';
import {runWorldCommand} from '../../server/world';
import {createPlayer,runCommand,state} from './fixtures';
import type {WorldQuote,Building} from '../../supabase/functions/_shared/world-types';
it('adds both comprehensive migrations to populated v5 storage without rewriting accounts, XP, money, owned layouts, contracts or paid history',async()=>{
 const root=await mkdtemp(join(tmpdir(),'lifecity-comprehensive-upgrade-'));let db:LocalDatabase|undefined;
 try{
  const previous=join(root,'previous');await mkdir(join(previous,'supabase/migrations'),{recursive:true});for(const name of (await readdir('supabase/migrations')).filter(n=>n.endsWith('.sql')&&n<'20261102082500'))await copyFile('supabase/migrations/'+name,join(previous,'supabase/migrations',name));
  await writeFile(join(previous,'supabase/seed.sql'),`insert into public.catalog_items(id,name_ar,name_en,description_ar,description_en,price,category,footprint_x,footprint_z,unlock_level,model,is_furniture) values
   ('villa','فيلا','Villa','','',2500,'homes',3,3,2,'villa',false),('desk','مكتب','Desk','','',80,'furniture',1,1,1,'desk',true),('house','منزل','House','','',800,'homes',2,2,1,'house',false);`);
  const path=join(root,'data');db=await createLocalDatabase({path,projectRoot:previous});const p=await createPlayer(db,'pre-comprehensive',20000,100);
  const snap=()=>state(db!,p.id),command=(action:string,payload:Record<string,unknown>)=>runCommand(db!,p.id,action,payload);
  const world=async(action:string,operation:string,request:Record<string,unknown>)=>runWorldCommand(db!,p.id,action,{operation,request:{realm:'main',...request},expected_revision:(await snap()).world_systems!.revision});
  const buy=await command('purchase',{catalog_id:'villa'}),placed=await command('place',{inventory_id:buy.result.inventory_id,x:1,z:1,rotation:0}),desk=await command('purchase',{catalog_id:'desk'});await command('interior_place',{house_id:placed.result.placement_id,inventory_id:desk.result.inventory_id,x:1,z:1,rotation:0});
  const project=await command('project_start',{catalog_id:'villa'});await command('project_contribute',{project_id:project.result.project_id,amount:100});await command('prayer_set',{prayer:'fajr',status:'completed'});await command('approved_task_claim',{slug:'wash_dishes',self_reported:true,evidence:{}});const study=await command('study_start',{});await command('study_pause',{session_id:study.result.session_id});
  await db.owner(tx=>tx.query('select public.fx_store_snapshot($1::jsonb)',[JSON.stringify({result:'success',provider:'https://www.exchangerate-api.com',base_code:'SAR',time_last_update_unix:Math.floor(Date.now()/1000),time_next_update_unix:Math.floor(Date.now()/1000)+86400,rates:{SAR:1,MAD:2.625}})]));await command('yuyi_adjust',{amount:'10000',confirmed:true});const yq=await command('yuyi_quote',{catalog_id:'villa'}),yb=await command('yuyi_purchase',{quote_id:yq.result.id}),yp=await command('yuyi_place',{inventory_id:yb.result.inventory_id,x:1,z:1,rotation:0});
  await world('world_apply','initialize',{});const parcel=(await snap()).world_systems!.entities.find(e=>e.kind==='parcel'&&e.realm==='main')!;const plan=await world('world_apply','blueprint_generate',{parcel_id:parcel.id,name:'Stored home',archetype:'house',width:8,depth:12,floors:1,budget:'100000'}),quote=(await world('world_quote','building_start',{blueprint_id:plan.result.blueprint_id,parcel_id:parcel.id,name:'Stored home',x:6,z:1})).result.quote as WorldQuote;await runWorldCommand(db,p.id,'world_commit',{quote_id:quote.id,expected_revision:quote.revision,confirmed:true});
  // Old JSONB layouts did not have layout_version. The migration must leave them byte-for-byte intact.
  await db.owner(tx=>tx.query("update public.world_entities set data=jsonb_set(data,'{floors}',(select jsonb_agg(f-'layout_version') from jsonb_array_elements(data->'floors') f)) where id=$1",[quote.patch.result.building_id]));
  const before=await snap();await db.close();db=await createLocalDatabase({path});const after=await snap();
  for(const key of ['profile','wallet','inventory','placements','furniture','ledger','projects','prayers','study_sessions','tasks','completions','approved_tasks','world_systems'] as const)expect(after[key]).toEqual(before[key]);
  expect(after.v6).toEqual(before.v6);expect(after.catalog.find(i=>i.id==='villa')).toMatchObject({price:7500,unlock_level:10});expect(after.projects.find(v=>v.id===project.result.project_id)!.target_price).toBe(2500);
  await expect(command('purchase',{catalog_id:'villa'})).rejects.toThrow('ITEM_LOCKED');await command('move',{placement_id:placed.result.placement_id,x:1,z:7,rotation:90,expected_version:1});
  const refund=await command('demolition_quote',{placement_id:placed.result.placement_id,expected_version:2});expect(Number(refund.result.paid_basis)).toBe(2500);expect(Number(refund.result.refund)).toBe(1250);const yr=await command('demolition_quote',{realm:'yuyi',placement_id:yp.result.placement_id,expected_version:1});expect(Number(yr.result.paid_basis)).toBe(6562.5);expect(Number(yr.result.refund)).toBe(3281.25);
  const building=after.world_systems!.entities.find((e):e is Building=>e.id===quote.patch.result.building_id&&e.kind==='building')!,frame=(await world('world_quote','building_stage',{building_id:building.id,stage:'frame'})).result.quote as WorldQuote;expect(frame.patch.bill[0].canonical).toBe(building.pricing!.components['floor:0:frame']);await runWorldCommand(db,p.id,'world_commit',{quote_id:frame.id,expected_revision:frame.revision,confirmed:true});for(const part of before.world_systems!.components)expect((await snap()).world_systems!.components.find(c=>c.id===part.id)).toEqual(part);
 }finally{await db?.close();await rm(root,{recursive:true,force:true});}
},60000);
