import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {randomUUID} from 'node:crypto';
import {createLocalDatabase,type LocalDatabase} from '../../server/database';
import {createPlayer,runCommand,state} from './fixtures';
let db:LocalDatabase;
beforeAll(async()=>{db=await createLocalDatabase({path:'memory://'});});
afterAll(async()=>{await db?.close();});
const prayers=['fajr','dhuhr','asr','maghrib','isha'];
describe('daily prayer bonus keeps the existing prayer and wallet contracts',()=>{
 it('awards a MAIN-only50 bonus once, replay-safe, and corrects its net without XP farming',async()=>{
  const p=await createPlayer(db),initial=await state(db,p.id),day=initial.local_day;
  for(const prayer of prayers.slice(0,4))await runCommand(db,p.id,'prayer_set',{prayer,status:'completed',day});
  let s=await state(db,p.id);expect(s.ledger.filter(e=>e.reason.startsWith('prayer:daily_bonus:'))).toHaveLength(0);
  const key=randomUUID();await runCommand(db,p.id,'prayer_set',{prayer:'isha',status:'completed',day},key);await runCommand(db,p.id,'prayer_set',{prayer:'isha',status:'completed',day},key);
  s=await state(db,p.id);const xp=s.wallet.player_xp;expect(s.ledger.filter(e=>e.reason==='prayer:daily_bonus:'+day).reduce((n,e)=>n+e.delta,0)).toBe(50);expect(s.v6!.yuyi_wallet.balance).toBe(initial.v6!.yuyi_wallet.balance);expect(s.approved_tasks!.catalog).toHaveLength(16);
  await runCommand(db,p.id,'prayer_set',{prayer:'isha',status:'pending',day});s=await state(db,p.id);expect(s.ledger.filter(e=>e.reason==='prayer:daily_bonus:'+day).reduce((n,e)=>n+e.delta,0)).toBe(0);
  await Promise.all([runCommand(db,p.id,'prayer_set',{prayer:'isha',status:'completed',day}),runCommand(db,p.id,'prayer_set',{prayer:'isha',status:'completed',day})]);
  s=await state(db,p.id);expect(s.ledger.filter(e=>e.reason==='prayer:daily_bonus:'+day).reduce((n,e)=>n+e.delta,0)).toBe(50);expect(s.wallet.player_xp).toBe(xp);
  const independent=await state(db,p.id);expect(independent.prayers.filter(p=>p.day===day&&p.status==='completed')).toHaveLength(5);expect(independent.wallet).toEqual(s.wallet);
 });
 it('does not backfill rewards or pay a fresh bonus for historical prayer edits; pending/excused are neutral',async()=>{
  const p=await createPlayer(db),s=await state(db,p.id),d=new Date(s.local_day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);const day=d.toISOString().slice(0,10);
  for(const prayer of prayers)await runCommand(db,p.id,'prayer_set',{prayer,status:'completed',day});
  expect((await state(db,p.id)).ledger.some(e=>e.reason.startsWith('prayer:daily_bonus:'))).toBe(false);
  await expect(db.asUser(p.id,tx=>tx.exec('select * from lifecity_private.prayer_day_rewards'))).rejects.toThrow();
  await expect(runCommand(db,p.id,'prayer_set',{prayer:'fajr',day:s.local_day,status:'missed'})).rejects.toThrow('CONFIRM_MISSED');
  const before=(await state(db,p.id)).wallet.balance;await runCommand(db,p.id,'prayer_set',{prayer:'fajr',day:s.local_day,status:'excused'});expect((await state(db,p.id)).wallet.balance).toBe(before);
 });
});
