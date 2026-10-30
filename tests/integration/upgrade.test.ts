import {expect,it} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createLocalDatabase,type LocalDatabase} from '../../server/database';
import {createPlayer,runCommand,state} from './fixtures';
it('upgrades an early local schema without resetting wallet, ledger, inventory or world',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'lifecity-upgrade-'));let db:LocalDatabase|undefined;
 try{
  const path=join(directory,'db');db=await createLocalDatabase({path});const user=await createPlayer(db,'upgrade');
  await runCommand(db,user.id,'task_complete',{task_id:(await state(db,user.id)).tasks.find(t=>t.key==='clean_room')!.id});
  const bought=await runCommand(db,user.id,'purchase',{catalog_id:'tree'});await runCommand(db,user.id,'place',{inventory_id:bought.result.inventory_id,x:3,z:4,rotation:90});const before=await state(db,user.id);
  await db.owner(async(tx)=>{await tx.exec('ALTER TABLE public.profiles DROP COLUMN avatar; ALTER TABLE public.task_definitions DROP COLUMN frequency;');await tx.query('DELETE FROM local_auth.migrations WHERE name=$1',['migrations/004_schedule_avatar_upgrade.sql']);});
  await db.close();db=await createLocalDatabase({path});const after=await state(db,user.id);
  expect(after.wallet).toEqual(before.wallet);expect(after.ledger).toEqual(before.ledger);expect(after.inventory).toEqual(before.inventory);expect(after.placements).toEqual(before.placements);expect(after.profile.avatar).toBe('sprout');expect(after.tasks.every(t=>t.frequency==='daily')).toBe(true);
  await runCommand(db,user.id,'profile_update',{avatar:'moon'});expect((await state(db,user.id)).profile.avatar).toBe('moon');
 }finally{await db?.close();await rm(directory,{recursive:true,force:true});}
});
it('boots on a new nested storage directory without deleting or requiring an existing parent',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'lifecity-firstboot-'));let db:LocalDatabase|undefined;
 try{db=await createLocalDatabase({path:join(directory,'new-parent','nested','db')});const user=await createPlayer(db,'firstboot');expect((await state(db,user.id)).wallet.balance).toBe(0);}finally{await db?.close();await rm(directory,{recursive:true,force:true});}
});
