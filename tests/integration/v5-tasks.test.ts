import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {randomUUID} from 'node:crypto';
import {APPROVED_TASKS} from '../../src/lib/approved-tasks';
import {createLocalDatabase,type LocalDatabase} from '../../server/database';
import {createPlayer,runCommand,state} from './fixtures';
let db:LocalDatabase;
async function time(at:string){await db.owner(tx=>tx.exec(`create or replace function lifecity_private.task_now() returns timestamptz language sql volatile set search_path=public,pg_temp as $$select '${new Date(at).toISOString()}'::timestamptz$$;`));}
async function view(id:string){return (await state(db,id)).approved_tasks!;}
const claim=(id:string,slug:string,evidence:Record<string,unknown>={},key=randomUUID())=>runCommand(db,id,'approved_task_claim',{slug,self_reported:true,evidence},key);
beforeAll(async()=>{db=await createLocalDatabase({path:'memory://'});});
afterAll(async()=>{await db?.close();});
describe('the exact 16 approved tasks and transactional milestones',()=>{
 it('adds exactly the approved versioned catalog without starting rewards or altering original tasks/MAD',async()=>{
  await time('2026-11-01T09:00:00Z');const p=await createPlayer(db);const s=await state(db,p.id);const a=s.approved_tasks!;
  expect(Object.fromEntries(a.catalog.map(x=>[x.slug,x.reward]))).toEqual({wash_dishes:20,laundry_load:30,tidy_desk:15,wash_car:50,take_out_trash:10,walk_20_minutes:20,sleep_7_hours:20,morning_adhkar:10,evening_adhkar:10,wake_on_time:20,social_media_free_hour:20,help_family:25,five_tasks_day:30,study_20_hours_week:150,all_weekly_goals:200,commitment_30_days:500});
  expect(a.catalog.map(x=>[x.slug,x.reward]).sort()).toEqual(APPROVED_TASKS.map(x=>[x.slug,x.reward]).sort());expect(a.claims).toEqual([]);expect(a.calendar).toMatchObject({timezone:'Asia/Riyadh',week:'2026-11-01',week_start:0});expect(s.tasks).toHaveLength(3);expect(s.wallet.balance).toBe(0);expect(s.v6!.yuyi_wallet.balance).toBe('0.0000');
 });
 it('settles a daily claim once across duplicate taps, two devices and receipt retries, requiring honest confirmation',async()=>{
  await time('2026-11-01T09:00:00Z');const p=await createPlayer(db);await expect(runCommand(db,p.id,'approved_task_claim',{slug:'wash_dishes'})).rejects.toThrow('SELF_REPORT_REQUIRED');
  const key=randomUUID();const results=await Promise.allSettled([claim(p.id,'wash_dishes',{},key),claim(p.id,'wash_dishes')]);expect(results.filter(x=>x.status==='fulfilled')).toHaveLength(1);
  await claim(p.id,'wash_dishes',{},key);let s=await state(db,p.id);expect(s.wallet.balance).toBe(20);expect(s.approved_tasks!.claims).toHaveLength(1);
  await runCommand(db,p.id,'profile_update',{timezone:'Pacific/Honolulu'});await expect(claim(p.id,'wash_dishes')).rejects.toThrow('ALREADY_CLAIMED');s=await state(db,p.id);expect(s.approved_tasks!.calendar.timezone).toBe('Asia/Riyadh');expect(s.wallet.balance).toBe(20);expect(s.v6!.yuyi_wallet.balance).toBe('0.0000');
 });
 it('pays laundry per distinct completed load, audits the privileged ceiling and counts its definition only once',async()=>{
  await time('2026-11-01T09:00:00Z');const p=await createPlayer(db);const load=randomUUID();await claim(p.id,'laundry_load',{load_id:load});await expect(claim(p.id,'laundry_load',{load_id:load})).rejects.toThrow('ALREADY_CLAIMED');
  await claim(p.id,'laundry_load',{load_id:randomUUID()});await claim(p.id,'laundry_load',{load_id:randomUUID()});await expect(claim(p.id,'laundry_load',{load_id:randomUUID()})).rejects.toThrow('LAUNDRY_LIMIT');expect((await view(p.id)).distinct_today).toBe(1);
  for(const slug of ['wash_dishes','tidy_desk','take_out_trash','morning_adhkar'])await claim(p.id,slug);
  let s=await state(db,p.id);expect(s.wallet.balance).toBe(175);expect(s.approved_tasks!.claims.filter(x=>x.slug==='five_tasks_day')).toHaveLength(1);
  await runCommand(db,p.id,'task_reconcile');expect((await state(db,p.id)).wallet.balance).toBe(175);
  await db.owner(tx=>tx.exec('update public.task_rule_settings set laundry_daily_limit=4;'));expect(await db.owner(async tx=>(await tx.query('select count(*)::int n from public.task_rule_audit')).rows[0]!.n)).toBe(1);
  await claim(p.id,'laundry_load',{load_id:randomUUID()});s=await state(db,p.id);expect(s.wallet.balance).toBe(205);await db.owner(tx=>tx.exec('update public.task_rule_settings set laundry_daily_limit=3;'));
 });
 it('uses calendar Sunday weeks for washing the car and respects 20/60-minute manual thresholds',async()=>{
  await time('2026-11-07T17:00:00Z');const p=await createPlayer(db);await claim(p.id,'wash_car');await expect(claim(p.id,'wash_car')).rejects.toThrow('ALREADY_CLAIMED');
  await expect(claim(p.id,'walk_20_minutes',{minutes:19})).rejects.toThrow();await expect(claim(p.id,'social_media_free_hour',{minutes:59})).rejects.toThrow();
  await claim(p.id,'walk_20_minutes',{minutes:20});await claim(p.id,'social_media_free_hour',{minutes:60});await time('2026-11-07T21:00:01Z');await claim(p.id,'wash_car');const a=await view(p.id);expect(a.claims.filter(x=>x.slug==='wash_car').map(x=>x.local_week).sort()).toEqual(['2026-11-01','2026-11-08']);
 });
 it('checks seven elapsed hours, waking dates, impossible duration and overlapping sleep reports',async()=>{
  await time('2026-11-01T17:00:00Z');const p=await createPlayer(db);await expect(claim(p.id,'sleep_7_hours',{bedtime:'2026-11-01T11:00Z',wake_time:'2026-11-01T17:00Z'})).rejects.toThrow('INVALID_SLEEP_INTERVAL');
  await claim(p.id,'sleep_7_hours',{bedtime:'2026-11-01T09:00Z',wake_time:'2026-11-01T17:00Z'});await time('2026-11-02T01:00:00Z');
  await expect(claim(p.id,'sleep_7_hours',{bedtime:'2026-11-01T16:00Z',wake_time:'2026-11-02T00:00Z'})).rejects.toThrow('SLEEP_OVERLAP');
  await claim(p.id,'sleep_7_hours',{bedtime:'2026-11-01T17:30Z',wake_time:'2026-11-02T00:30Z'});expect((await state(db,p.id)).wallet.balance).toBe(40);
 });
 it('requires an immutable wake target before the applicable day and applies exactly ten minutes grace',async()=>{
  await time('2026-11-01T09:00:00Z');const p=await createPlayer(db);await expect(runCommand(db,p.id,'wake_target_set',{day:'2026-11-01',time:'06:00'})).rejects.toThrow('WAKE_TARGET_IN_ADVANCE');
  await runCommand(db,p.id,'wake_target_set',{day:'2026-11-02',time:'06:00'});await expect(runCommand(db,p.id,'wake_target_set',{day:'2026-11-02',time:'05:00'})).rejects.toThrow();
  await time('2026-11-02T05:00:00Z');await expect(claim(p.id,'wake_on_time',{wake_time:'2026-11-02T03:11Z'})).rejects.toThrow('WAKE_TARGET_NOT_MET');await claim(p.id,'wake_on_time',{wake_time:'2026-11-02T03:10Z'});expect((await state(db,p.id)).wallet.balance).toBe(20);
 });
 it('snapshots at least three distinct unaccomplished weekly goals and pays all-goals only once',async()=>{
  await time('2026-11-01T09:00:00Z');const p=await createPlayer(db);const goals=['wash_dishes','tidy_desk','help_family'].map(slug=>({slug,target:1}));
  for(const invalid of [[],goals.slice(0,2),[goals[0],goals[0],goals[1]]])await expect(runCommand(db,p.id,'weekly_plan_start',{goals:invalid})).rejects.toThrow();
  await runCommand(db,p.id,'weekly_plan_start',{goals});await expect(runCommand(db,p.id,'weekly_plan_start',{goals})).rejects.toThrow();
  for(const {slug}of goals)await claim(p.id,slug);const s=await state(db,p.id);expect(s.wallet.balance).toBe(260);expect(s.approved_tasks!.weekly_plan!.goals.every(x=>x.progress===1)).toBe(true);await runCommand(db,p.id,'task_reconcile');expect((await state(db,p.id)).wallet.balance).toBe(260);
  const q=await createPlayer(db);await claim(q.id,'wash_dishes');await expect(runCommand(db,q.id,'weekly_plan_start',{goals})).rejects.toThrow('GOAL_ALREADY_ACCOMPLISHED');
 });
 it('does not count custom spam, grants, bonuses or purchases as distinct base tasks; original tasks/prayers still qualify',async()=>{
  await time(new Date().toISOString());const p=await createPlayer(db);for(let i=0;i<5;i++){const r=await runCommand(db,p.id,'task_create',{title:'custom '+i,reward:1,category:'personal',daily_limit:1});await runCommand(db,p.id,'task_complete',{task_id:r.result.task_id});}
  await runCommand(db,p.id,'yuyi_adjust',{amount:'100',confirmed:true});expect((await view(p.id)).distinct_today).toBe(0);
  const original=(await state(db,p.id)).tasks.filter(x=>x.key);for(const x of original)await runCommand(db,p.id,'task_complete',{task_id:x.id});
  await runCommand(db,p.id,'prayer_set',{prayer:'fajr',status:'completed'});await runCommand(db,p.id,'prayer_set',{prayer:'dhuhr',status:'completed'});expect((await view(p.id)).distinct_today).toBe(5);expect((await state(db,p.id)).wallet.balance).toBe(185);expect((await state(db,p.id)).v6!.yuyi_wallet.balance).toBe('100.0000');
 });
 it('splits verified study-minute completions across Sunday and pays the 1200-minute threshold without counting the session bonus',async()=>{
  await time('2026-11-06T00:00:00Z');const p=await createPlayer(db);await time('2026-11-07T20:50:00Z');const id=randomUUID();await db.owner(async tx=>{
   await tx.query("insert into public.study_sessions(id,user_id,started_at,last_tick_at,active_seconds,credited_minutes,bonus_awarded) values($1,$2,'2026-11-06T00:00Z','2026-11-07T20:59:30Z',71970,1199,true)",[id,p.id]);
   // Persisted verified history fixture: 1,199 minutes + 30 seconds in bounded segments.
   await tx.query("insert into public.task_study_segments(user_id,session_id,starts_at,ends_at,local_day,local_week,calendar_id) select $1,$2,'2026-11-06T00:00Z'::timestamptz+n*interval '60 seconds','2026-11-06T00:01Z'::timestamptz+n*interval '60 seconds','2026-11-06','2026-11-01',id from public.task_calendars cross join generate_series(0,1198)n where user_id=$1",[p.id,id]);
   await tx.query("insert into public.task_study_segments(user_id,session_id,starts_at,ends_at,local_day,local_week,calendar_id) select $1,$2,'2026-11-07T20:59Z','2026-11-07T20:59:30Z','2026-11-07','2026-11-01',id from public.task_calendars where user_id=$1",[p.id,id]);
   await tx.query("select public.tick_study($1,$2,$3,'2026-11-07T21:00:30Z')",[p.id,id,randomUUID()]);
  });await time('2026-11-07T21:00:31Z');await runCommand(db,p.id,'task_reconcile');let s=await state(db,p.id);expect(s.approved_tasks!.study_minutes_week).toBe(0);expect(s.approved_tasks!.claims.filter(x=>x.slug==='study_20_hours_week')).toHaveLength(1);expect(s.wallet.balance).toBe(151);
  await db.owner(tx=>tx.query("select public.tick_study($1,$2,$3,'2026-11-07T21:01:00Z')",[p.id,id,randomUUID()]));
  await runCommand(db,p.id,'task_reconcile');s=await state(db,p.id);expect(s.approved_tasks!.study_minutes_week).toBe(1);expect(s.wallet.balance).toBe(152);await runCommand(db,p.id,'task_reconcile');expect((await state(db,p.id)).wallet.balance).toBe(152);
 });
 it('pays genuine 30/60-day commitment milestones once, breaks at gaps, and permits a new distinct 30-day streak',async()=>{
  await time('2027-01-01T09:00Z');const p=await createPlayer(db);const start=Date.parse('2027-01-01T09:00Z');
  for(let i=0;i<60;i++){await time(new Date(start+i*86400000).toISOString());await claim(p.id,'wash_dishes');if(i===28)expect((await view(p.id)).claims.filter(x=>x.slug==='commitment_30_days')).toHaveLength(0);}
  let s=await state(db,p.id);expect(s.wallet.balance).toBe(2200);expect(s.approved_tasks!.commitment).toMatchObject({streak_day:60,current:true});await runCommand(db,p.id,'task_reconcile');expect((await state(db,p.id)).wallet.balance).toBe(2200);
  for(let i=61;i<91;i++){await time(new Date(start+i*86400000).toISOString());await claim(p.id,'wash_dishes');}
  s=await state(db,p.id);expect(s.wallet.balance).toBe(3300);expect(s.approved_tasks!.claims.filter(x=>x.slug==='commitment_30_days')).toHaveLength(3);expect(s.approved_tasks!.commitment!.streak_day).toBe(30);
 });
 it('schedules audited calendar changes prospectively with a disclosed safety gap and prevents direct writes/cross-owner reads',async()=>{
  await time('2026-11-01T09:00Z');const p=await createPlayer(db);const other=await createPlayer(db);await claim(p.id,'wash_dishes');const r=await runCommand(db,p.id,'task_calendar_set',{timezone:'Europe/London',week_start:1});expect(Date.parse(String(r.result.effective_at))).toBeGreaterThan(Date.parse(String(r.result.pause_from))+86400000-1);
  await time('2026-11-08T03:00Z');expect((await view(p.id)).calendar.paused).toBe(true);await expect(claim(p.id,'wash_dishes')).rejects.toThrow('TASK_CALENDAR_TRANSITION');await time(String(r.result.effective_at));expect((await view(p.id)).calendar).toMatchObject({timezone:'Europe/London',week_start:1,paused:false});
  await expect(db.asUser(p.id,tx=>tx.exec('update public.approved_task_catalog set reward=999;'))).rejects.toThrow();await expect(db.asUser(p.id,tx=>tx.query('select lifecity_private.task_reconcile($1,$2)',[p.id,randomUUID()]))).rejects.toThrow();
  expect(await db.asUser(other.id,async tx=>(await tx.query('select id from public.approved_task_claims')).rows)).toEqual([]);
 });
 it('stores historical selected FX provenance without changing the canonical task award or MAD wallet',async()=>{
  await time(new Date().toISOString());const p=await createPlayer(db);const rates={result:'success',provider:'https://www.exchangerate-api.com',base_code:'SAR',time_last_update_unix:Math.floor(Date.now()/1000),time_next_update_unix:Math.floor(Date.now()/1000)+86400,rates:{SAR:1,MAD:2.6,USD:0.2666666667,EUR:0.25}};
  await db.owner(tx=>tx.query('select public.fx_store_snapshot($1::jsonb)',[JSON.stringify(rates)]));await runCommand(db,p.id,'currency_set',{currency:'USD'});await claim(p.id,'wash_dishes');const before=await state(db,p.id);const receipt=before.approved_tasks!.claims[0]!;expect(receipt.fx_display).toMatchObject({currency:'USD',rate:'0.2666666667',source:'ExchangeRate-API'});expect(before.wallet.balance).toBe(20);
  await runCommand(db,p.id,'currency_set',{currency:'SAR'});const after=await state(db,p.id);expect(after.wallet.balance).toBe(20);expect(after.v6!.yuyi_wallet.balance).toBe('0.0000');expect(after.approved_tasks!.claims[0]).toEqual(receipt);
 });
});
