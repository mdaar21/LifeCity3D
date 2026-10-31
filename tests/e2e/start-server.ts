import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalDatabase } from '../../server/database.js';
import { createLocalServer } from '../../server/app.js';
import { hashPassword } from '../../server/security.js';
import { E2E_OTHER, E2E_OWNER, E2E_PASSWORD } from './accounts.js';

// This privileged seeding entry point lives exclusively under tests. No HTTP
// endpoint can fund an account, change elapsed study time or grant permissions.
const directory = await mkdtemp(join(tmpdir(), 'lifecity-browser-'));
const database = await createLocalDatabase({path: join(directory, 'db')});
const derived = await hashPassword(E2E_PASSWORD);
for (const [email, name, balance] of [[E2E_OWNER, 'Browser owner', 2000], [E2E_OTHER, 'Separate account', 0], ['visual-builder@example.test','Visual fixture',50000], ['visual-weather@example.test','Weather fixture',50000]] as const) {
  const id = randomUUID();
  await database.owner(async (tx) => {
    await tx.query('INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3::jsonb)', [id, email, JSON.stringify({display_name: name})]);
    await tx.query('INSERT INTO local_auth.credentials(user_id,password_hash,password_salt) VALUES($1,$2,$3)', [id, derived.hash, derived.salt]);
    await tx.query("UPDATE public.profiles SET language='en',digits='latin' WHERE id=$1", [id]);
    if(email.startsWith('visual-')){await tx.query('update public.wallets set city_xp=5000 where user_id=$1',[id]);await tx.query("insert into public.study_sessions(user_id,status,started_at,last_tick_at,active_seconds,credited_minutes,bonus_awarded) values($1,'finished',clock_timestamp()-interval '2 days',clock_timestamp()-interval '2 days',72000,1200,true)",[id]);}
    if (balance) await tx.query('SELECT public.apply_coins($1,$2,$3,$4)', [id, balance, 'test_fixture', `fixture:${randomUUID()}`]);
  });
}
// Deterministic FX fixture in the disposable test database ONLY. Hosted rates
// are imported separately from the actual provider and are never seeded here.
await database.owner(tx=>tx.query('select public.fx_store_snapshot($1::jsonb)',[JSON.stringify({result:'success',base_code:'SAR',provider:'https://www.exchangerate-api.com',time_last_update_unix:Math.floor(Date.now()/1000),time_next_update_unix:Math.floor(Date.now()/1000)+86400,rates:{SAR:1,MAD:2.625,USD:0.2666666667,EUR:0.25,KWD:0.0812}})]));
const local = await createLocalServer({database, allowedOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4174', 'http://127.0.0.1:4174']});
console.info(`Disposable LifeCity E2E reference API: ${await local.listen()}`);
let closing = false;
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.on(signal, () => {
  if (closing) return;
  closing = true;
  void local.close().then(() => database.close()).then(() => rm(directory, {recursive: true, force: true})).then(() => process.exit(0), () => process.exit(1));
});
