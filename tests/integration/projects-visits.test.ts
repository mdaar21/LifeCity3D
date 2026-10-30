import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {createHash,randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createLocalDatabase,type LocalDatabase} from '../../server/database.js';
import {createPlayer,runCommand,state} from './fixtures.js';

let directory:string;
let database:LocalDatabase;
beforeAll(async()=>{directory=await mkdtemp(join(tmpdir(),'lifecity-projects-visits-'));database=await createLocalDatabase({path:join(directory,'db')});},60_000);
afterAll(async()=>{await database?.close();if(directory)await rm(directory,{recursive:true,force:true});});

interface VisitView {title:string;size:number;placements:Record<string,unknown>[];catalog:unknown[];like_count:number;greetings:{code:string;count:number}[];expires_at:string}
async function visit(code:string):Promise<VisitView>{return database.asAnonymous(async tx=>(await tx.query<{view:VisitView}>('SELECT public.city_visit($1) AS view',[code])).rows[0]!.view);}

describe('authoritative construction savings',()=>{
 it('reserves actual coins once, protects contribution/ownership, and refunds once without granting XP',async()=>{
  const owner=await createPlayer(database,'project-owner',1000);const stranger=await createPlayer(database,'project-stranger',1000);
  const started=await runCommand(database,owner.id,'project_start',{catalog_id:'house',target_price:1,price:1});const id=started.result.project_id as string;
  expect(started.result.target_price).toBe(800);
  await expect(runCommand(database,owner.id,'project_start',{catalog_id:'house'})).rejects.toThrow(/PROJECT_ACTIVE/i);
  await expect(runCommand(database,stranger.id,'project_contribute',{project_id:id,amount:1})).rejects.toThrow(/NOT_FOUND/i);
  for(const amount of [0,-1,1.5,'20',null,1_000_001])await expect(runCommand(database,owner.id,'project_contribute',{project_id:id,amount})).rejects.toThrow(/INVALID_PAYLOAD/i);
  await expect(runCommand(database,owner.id,'project_contribute',{project_id:id,amount:801})).rejects.toThrow(/PROJECT_AMOUNT/i);
  const key=randomUUID();await Promise.all([runCommand(database,owner.id,'project_contribute',{project_id:id,amount:300},key),runCommand(database,owner.id,'project_contribute',{project_id:id,amount:300},key)]);
  let saved=await state(database,owner.id);expect(saved.wallet).toMatchObject({balance:700,player_xp:0,city_xp:0});expect(saved.projects[0]).toMatchObject({id,funded:300,status:'saving'});expect(saved.inventory).toHaveLength(0);
  const refundKey=randomUUID();await runCommand(database,owner.id,'project_cancel',{project_id:id},refundKey);await runCommand(database,owner.id,'project_cancel',{project_id:id},refundKey);
  await expect(runCommand(database,owner.id,'project_cancel',{project_id:id})).rejects.toThrow(/PROJECT_NOT_ACTIVE/i);
  await expect(runCommand(database,owner.id,'project_contribute',{project_id:id,amount:300})).rejects.toThrow(/PROJECT_NOT_ACTIVE/i);
  saved=await state(database,owner.id);expect(saved.wallet).toMatchObject({balance:1000,player_xp:0,city_xp:0});expect(saved.projects[0]).toMatchObject({funded:0,status:'cancelled'});expect(saved.ledger.filter(row=>row.reason==='project:contribution')).toHaveLength(1);expect(saved.ledger.filter(row=>row.reason==='project:refund')).toHaveLength(1);
  expect((await database.asUser(stranger.id,tx=>tx.query('SELECT id FROM public.city_projects WHERE user_id=$1',[owner.id]))).rows).toHaveLength(0);
  await expect(database.asUser(owner.id,tx=>tx.query('UPDATE public.city_projects SET funded=800 WHERE id=$1',[id]))).rejects.toThrow(/permission denied/i);
 });

 it('keeps the server quote fixed and atomically grants exactly one completed building under concurrent contributions',async()=>{
  const owner=await createPlayer(database,'project-completion',1000);const started=await runCommand(database,owner.id,'project_start',{catalog_id:'house'});const id=started.result.project_id as string;
  await runCommand(database,owner.id,'project_contribute',{project_id:id,amount:300});
  await database.owner(tx=>tx.query("UPDATE public.catalog_items SET price=900 WHERE id='house'"));
  try{
   const keys=[randomUUID(),randomUUID()];const results=await Promise.allSettled(keys.map(key=>runCommand(database,owner.id,'project_contribute',{project_id:id,amount:500},key)));
   expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1);expect(results.filter(result=>result.status==='rejected')).toHaveLength(1);
   const winner=results.findIndex(result=>result.status==='fulfilled');await runCommand(database,owner.id,'project_contribute',{project_id:id,amount:500},keys[winner]!);
   let saved=await state(database,owner.id);expect(saved.projects[0]).toMatchObject({target_price:800,funded:800,status:'completed'});expect(saved.wallet).toMatchObject({balance:200,player_xp:0,city_xp:0});expect(saved.inventory).toHaveLength(1);expect(saved.inventory[0]!.id).toBe(saved.projects[0]!.inventory_id);
   await expect(runCommand(database,owner.id,'project_cancel',{project_id:id})).rejects.toThrow(/PROJECT_NOT_ACTIVE/i);
   await runCommand(database,owner.id,'place',{inventory_id:saved.projects[0]!.inventory_id,x:2,z:3,rotation:90});saved=await state(database,owner.id);expect(saved.placements[0]).toMatchObject({catalog_id:'house',x:2,z:3,rotation:90});expect(saved.wallet.city_xp).toBeGreaterThan(0);
  }finally{await database.owner(tx=>tx.query("UPDATE public.catalog_items SET price=800 WHERE id='house'"));}
 });

 it('rejects locked/non-building goals and overdrawn contributions through the protected command boundary',async()=>{
  const owner=await createPlayer(database,'project-limits');
  await expect(runCommand(database,owner.id,'project_start',{catalog_id:'villa'})).rejects.toThrow(/ITEM_LOCKED/i);
  for(const catalog_id of ['tree','desk','road'])await expect(runCommand(database,owner.id,'project_start',{catalog_id})).rejects.toThrow(/WRONG_ITEM_TYPE/i);
  const started=await runCommand(database,owner.id,'project_start',{catalog_id:'house'});
  await expect(runCommand(database,owner.id,'project_contribute',{project_id:started.result.project_id,amount:1})).rejects.toThrow(/INSUFFICIENT_BALANCE/i);
  await expect(database.asUser(owner.id,tx=>tx.query('SELECT public.city_partner_command($1,$2,$3::jsonb,$4::uuid)',[owner.id,'project_start','{"catalog_id":"house"}',randomUUID()]))).rejects.toThrow(/permission denied/i);
  expect((await state(database,owner.id)).wallet.balance).toBe(0);
 });
});

describe('revocable city-only links',()=>{
 it('allows anonymous safe projection while denying tables/private identity and old, expired or disabled links',async()=>{
  const owner=await createPlayer(database,'private-city-owner',2000);const own=await state(database,owner.id);
  await runCommand(database,owner.id,'task_complete',{task_id:own.tasks.find(task=>task.key==='clean_room')!.id});await runCommand(database,owner.id,'prayer_set',{prayer:'fajr',status:'completed'});
  await runCommand(database,owner.id,'task_create',{title:'NEVER_PUBLIC_NOTE_7281',reward:1,category:'private',daily_limit:1});
  const bought=await runCommand(database,owner.id,'purchase',{catalog_id:'house'});const placed=await runCommand(database,owner.id,'place',{inventory_id:bought.result.inventory_id,x:1,z:1,rotation:90});
  const desk=await runCommand(database,owner.id,'purchase',{catalog_id:'desk'});await runCommand(database,owner.id,'interior_place',{house_id:placed.result.placement_id,inventory_id:desk.result.inventory_id,x:2,z:3,rotation:0});
  const enabled=await runCommand(database,owner.id,'share_enable',{});const code=enabled.result.code as string;expect(code).toMatch(/^[0-9a-f]{64}$/);
  const view=await visit(code);expect(Object.keys(view).sort()).toEqual(['catalog','expires_at','greetings','like_count','placements','size','title']);expect(view.title).toBe('LifeCity');expect(view.placements).toHaveLength(1);expect(Object.keys(view.placements[0]!).sort()).toEqual(['catalog_id','rotation','variant','x','y','z']);expect(view.placements[0]).toMatchObject({catalog_id:'house',x:1,z:1,rotation:90});
  const encoded=JSON.stringify(view);for(const secret of [owner.id,owner.email,bought.result.inventory_id as string,placed.result.placement_id as string,'NEVER_PUBLIC_NOTE_7281'])expect(encoded).not.toContain(secret);for(const privateField of ['wallet','profile','prayers','tasks','ledger','furniture'])expect(view).not.toHaveProperty(privateField);
  const saved=await state(database,owner.id);expect(saved.city_share).toMatchObject({enabled:true,revision:1});expect(JSON.stringify(saved)).not.toContain(code);
  const verifier=await database.owner(tx=>tx.query<{code_digest:string}>('SELECT code_digest FROM public.city_shares WHERE user_id=$1',[owner.id]));expect(verifier.rows[0]!.code_digest).toBe(createHash('sha256').update(code).digest('hex'));
  await expect(database.asAnonymous(tx=>tx.query('SELECT * FROM public.city_shares'))).rejects.toThrow(/permission denied/i);await expect(database.asAnonymous(tx=>tx.query('SELECT * FROM public.city_placements'))).rejects.toThrow(/permission denied/i);await expect(database.asUser(owner.id,tx=>tx.query('SELECT code_digest FROM public.city_shares'))).rejects.toThrow(/permission denied/i);
  const rotated=await runCommand(database,owner.id,'share_enable',{});const newer=rotated.result.code as string;expect(newer).not.toBe(code);await expect(visit(code)).rejects.toThrow(/SHARE_UNAVAILABLE/i);expect((await visit(newer)).placements).toHaveLength(1);
  await database.owner(tx=>tx.query("UPDATE public.city_shares SET expires_at=clock_timestamp()-interval '1 second' WHERE user_id=$1",[owner.id]));await expect(visit(newer)).rejects.toThrow(/SHARE_UNAVAILABLE/i);expect((await state(database,owner.id)).city_share).toBeNull();
  const last=await runCommand(database,owner.id,'share_enable',{});await runCommand(database,owner.id,'share_disable',{});await expect(visit(last.result.code as string)).rejects.toThrow(/SHARE_UNAVAILABLE/i);expect((await state(database,owner.id)).city_share).toBeNull();await expect(visit('f'.repeat(64))).rejects.toThrow(/SHARE_UNAVAILABLE/i);await expect(visit("'); select * from auth.users; --")).rejects.toThrow(/SHARE_UNAVAILABLE/i);
 });

 it('counts authenticated reactions once per viewer/revision, uses preset greetings, and never changes balances',async()=>{
  const owner=await createPlayer(database,'visit-owner');const alice=await createPlayer(database,'visitor-alice');const bob=await createPlayer(database,'visitor-bob');const enabled=await runCommand(database,owner.id,'share_enable',{});const code=enabled.result.code as string;
  await expect(runCommand(database,owner.id,'visit_react',{code,kind:'like'})).rejects.toThrow(/SELF_VISIT/i);await expect(database.asAnonymous(tx=>tx.query('SELECT public.game_command($1,$2::jsonb,$3::uuid)',['visit_react',JSON.stringify({code,kind:'like'}),randomUUID()]))).rejects.toThrow(/permission denied/i);
  const key=randomUUID();await Promise.all([runCommand(database,alice.id,'visit_react',{code,kind:'like'},key),runCommand(database,alice.id,'visit_react',{code,kind:'like'},key)]);const duplicate=await runCommand(database,alice.id,'visit_react',{code,kind:'like',visitor_id:bob.id});expect(duplicate.result.recorded).toBe(false);
  await expect(runCommand(database,alice.id,'visit_react',{code,kind:'greeting',message:'<script>unmoderated</script>'})).rejects.toThrow(/INVALID_PAYLOAD/i);await runCommand(database,alice.id,'visit_react',{code,kind:'greeting',message:'beautiful'});await runCommand(database,alice.id,'visit_react',{code,kind:'greeting',message:'keep_going'});await runCommand(database,bob.id,'visit_react',{code,kind:'like'});await runCommand(database,bob.id,'visit_react',{code,kind:'greeting',message:'welcome'});
  const view=await visit(code);expect(view.like_count).toBe(2);expect(view.greetings).toEqual([{code:'beautiful',count:1},{code:'keep_going',count:0},{code:'welcome',count:1}]);expect(JSON.stringify(view)).not.toContain(alice.id);expect(JSON.stringify(view)).not.toContain(bob.id);await expect(database.asUser(owner.id,tx=>tx.query('SELECT visitor_id FROM public.city_visit_reactions'))).rejects.toThrow(/permission denied/i);
  for(const player of [owner,alice,bob])expect((await state(database,player.id)).wallet).toMatchObject({balance:0,player_xp:0,city_xp:0});
  const rotated=await runCommand(database,owner.id,'share_enable',{});expect((await visit(rotated.result.code as string)).like_count).toBe(0);await expect(runCommand(database,alice.id,'visit_react',{code,kind:'like'})).rejects.toThrow(/SHARE_UNAVAILABLE/i);
  await database.owner(tx=>tx.query("UPDATE public.city_shares SET expires_at=clock_timestamp()-interval '1 second' WHERE user_id=$1",[owner.id]));await expect(runCommand(database,alice.id,'visit_react',{code:rotated.result.code,kind:'like'})).rejects.toThrow(/SHARE_UNAVAILABLE/i);
  const current=await runCommand(database,owner.id,'share_enable',{});await runCommand(database,owner.id,'share_disable',{});await expect(runCommand(database,alice.id,'visit_react',{code:current.result.code,kind:'like'})).rejects.toThrow(/SHARE_UNAVAILABLE/i);
 });

 it('deletes completed projects, share tokens and reactions with the owning account',async()=>{
  const owner=await createPlayer(database,'delete-shared-project',1000);const visitor=await createPlayer(database,'delete-link-visitor');const project=await runCommand(database,owner.id,'project_start',{catalog_id:'house'});await runCommand(database,owner.id,'project_contribute',{project_id:project.result.project_id,amount:800});const enabled=await runCommand(database,owner.id,'share_enable',{});const code=enabled.result.code as string;await runCommand(database,visitor.id,'visit_react',{code,kind:'like'});
  await runCommand(database,owner.id,'delete_account',{confirmation:'DELETE'});await expect(visit(code)).rejects.toThrow(/SHARE_UNAVAILABLE/i);for(const table of ['city_projects','city_shares'])expect((await database.owner(tx=>tx.query(`SELECT count(*)::integer AS count FROM public.${table} WHERE user_id=$1`,[owner.id]))).rows[0]!.count).toBe(0);expect((await database.owner(tx=>tx.query('SELECT count(*)::integer AS count FROM public.city_visit_reactions WHERE owner_id=$1',[owner.id]))).rows[0]!.count).toBe(0);
 });
});
