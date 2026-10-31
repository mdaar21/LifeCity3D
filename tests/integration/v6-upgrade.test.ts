import {expect,it} from 'vitest';
import {mkdtemp,mkdir,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createLocalDatabase,type LocalDatabase} from '../../server/database';
import {createPlayer,runCommand,state} from './fixtures';
it('upgrades populated pre-V6 records without moving balances/history and reconstructs only verified paid basis',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'lifecity-v6-upgrade-'));let db:LocalDatabase|undefined;
 try{
  const legacy=join(directory,'legacy');await mkdir(join(legacy,'supabase/migrations'),{recursive:true});
  for(const name of ['001_core.sql','002_city_partner.sql','003_realtime.sql','004_schedule_avatar_upgrade.sql','005_signup_locale.sql','006_projects_visits.sql'])await copyFile('supabase/migrations/'+name,join(legacy,'supabase/migrations',name));
  await copyFile('supabase/seed.sql',join(legacy,'supabase/seed.sql'));
  const path=join(directory,'data');db=await createLocalDatabase({path,projectRoot:legacy});
  const u=await createPlayer(db,'legacy',2000),partner=await createPlayer(db,'legacy-partner');
  const invitation=await runCommand(db,u.id,'partner_invite',{});await runCommand(db,partner.id,'partner_accept',{code:invitation.result.code});await runCommand(db,u.id,'partner_policy',{link_id:invitation.result.link_id,can_award:true,can_deduct:false,can_view_city:false,can_view_tasks:false,max_award:100,max_deduction:100,daily_award_limit:100,daily_deduction_limit:100});await runCommand(db,partner.id,'partner_adjust',{owner_id:u.id,amount:37});
  const bought=await runCommand(db,u.id,'purchase',{catalog_id:'tree'});const placed=await runCommand(db,u.id,'place',{inventory_id:bought.result.inventory_id,x:3,z:4,rotation:90});
  const before=await state(db,u.id);await db.close();db=await createLocalDatabase({path});let after=await state(db,u.id);
  expect(after.approved_tasks!.catalog).toHaveLength(16);expect(after.approved_tasks!.claims).toEqual([]);expect(after.tasks).toEqual(before.tasks);expect(after.wallet).toEqual(before.wallet);expect(after.ledger).toEqual(before.ledger);expect(after.placements).toEqual(before.placements);expect(after.partner_actions).toEqual(before.partner_actions);expect(after.v6?.yuyi_wallet.balance).toBe('0.0000');expect(after.v6?.yuyi_inventory).toEqual([]);expect(after.v6?.yuyi_placements).toEqual([]);
  expect(after.inventory.map(x=>({id:x.id,catalog_id:x.catalog_id}))).toEqual(before.inventory.map(x=>({id:x.id,catalog_id:x.catalog_id})));
  await db.owner(tx=>tx.query("update public.catalog_items set price=2000 where id='tree'"));
  const quote=await runCommand(db,u.id,'demolition_quote',{placement_id:placed.result.placement_id,expected_version:1});expect(Number(quote.result.paid_basis)).toBe(20);expect(Number(quote.result.refund)).toBe(10);
  const yuyiId=after.v6!.yuyi_world.id;await runCommand(db,u.id,'yuyi_adjust',{amount:'80',confirmed:true});await db.close();db=await createLocalDatabase({path});after=await state(db,u.id);expect(after.wallet).toEqual(before.wallet);expect(after.v6?.yuyi_world.id).toBe(yuyiId);expect(after.v6?.yuyi_wallet.balance).toBe('80.0000');
 }finally{await db?.close();await rm(directory,{recursive:true,force:true});}
});
