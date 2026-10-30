import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createLocalServer } from '../../server/app.js';
import type { GameSnapshot } from '../../src/lib/types.js';

const origin = 'http://localhost:5173';
let directory: string;
let local: Awaited<ReturnType<typeof createLocalServer>>;
let base: string;

async function post(path: string, payload: unknown, cookie?: string, source: string | null = origin) {
  return fetch(`${base}${path}`, {method: 'POST', headers: {'Content-Type': 'application/json', ...(source ? {Origin: source} : {}), ...(cookie ? {Cookie: cookie} : {})}, body: JSON.stringify(payload)});
}
async function register(label: string) {
  const email = `${label}-${randomUUID()}@example.test`;
  const response = await post('/api/auth/register', {email, password: 'Local-test-password-482!', name: label});
  expect(response.status).toBe(200);
  const body = await response.json() as {user: {id: string; email: string}; confirmation_required: boolean};
  const cookie = response.headers.get('set-cookie')!;
  expect(cookie).toContain('HttpOnly');
  expect(cookie).toContain('SameSite=Strict');
  expect(body.confirmation_required).toBe(false);
  return {email, user: body.user, cookie: cookie.split(';')[0]!};
}

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'lifecity-http-'));
  local = await createLocalServer({databasePath: join(directory, 'db'), authRateLimit: 100});
  base = await local.listen(0);
}, 60_000);
afterAll(async () => { await local?.close(); if (directory) await rm(directory, {recursive: true, force: true}); });

describe('local reference HTTP authentication and security', () => {
  it('labels its limits, rejects CSRF/missing sessions and never pretends to send recovery email', async () => {
    expect(await (await fetch(`${base}/api/health`)).json()).toMatchObject({mode: 'local', development_reference: true, email_delivery: false});
    expect((await fetch(`${base}/api/state`)).status).toBe(401);
    expect((await post('/api/auth/login', {}, undefined, 'https://attacker.example')).status).toBe(403);
    expect((await post('/api/auth/login', {}, undefined, null)).status).toBe(403);
    const reset = await post('/api/auth/reset', {email: 'nobody@example.test'});
    expect(reset.status).toBe(501);
    expect(await reset.json()).toEqual({error: 'LOCAL_RECOVERY_NOT_CONFIGURED'});
    const tooLarge = await post('/api/auth/login', {email: 'x'.repeat(35_000)});
    expect(tooLarge.status).toBe(413);
  });

  it('uses isolated opaque sessions, rate-safe commands, own export and revocable logout', async () => {
    const alice = await register('Alice');
    const bob = await register('Bob');
    expect(alice.cookie).not.toContain(alice.user.id);
    const aState = await (await fetch(`${base}/api/state`, {headers: {Cookie: alice.cookie}})).json() as GameSnapshot;
    const bState = await (await fetch(`${base}/api/state`, {headers: {Cookie: bob.cookie}})).json() as GameSnapshot;
    expect(aState.profile.id).toBe(alice.user.id);
    expect(bState.profile.id).toBe(bob.user.id);
    expect(aState.profile.id).not.toBe(bState.profile.id);
    const task = aState.tasks.find((entry) => entry.reward === 10)!;
    const payload = {action: 'task_complete', payload: {task_id: task.id}, key: randomUUID()};
    const results = await Promise.all([post('/api/command', payload, alice.cookie), post('/api/command', payload, alice.cookie)]);
    expect(results.map((response) => response.status)).toEqual([200, 200]);
    const exported = await fetch(`${base}/api/export`, {headers: {Cookie: alice.cookie}});
    expect(exported.headers.get('content-disposition')).toContain('lifecity-export.json');
    const data = await exported.json() as {state: GameSnapshot};
    expect(data.state.wallet.balance).toBe(10);
    expect(data.state.profile.id).toBe(alice.user.id);
    expect(JSON.stringify(data)).not.toContain('password_hash');
    expect(JSON.stringify(data)).not.toContain('token_hash');
    const wrong = await post('/api/auth/login', {email: alice.email, password: 'incorrect-password'});
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toEqual({error: 'INVALID_CREDENTIALS'});
    expect((await post('/api/auth/logout', {}, alice.cookie)).status).toBe(200);
    expect((await fetch(`${base}/api/state`, {headers: {Cookie: alice.cookie}})).status).toBe(401);
    expect((await fetch(`${base}/api/state`, {headers: {Cookie: bob.cookie}})).status).toBe(200);
  });

  it('requires explicit account deletion and destroys the associated session/data', async () => {
    const player = await register('Delete');
    const key = randomUUID();
    const rejected = await post('/api/command', {action: 'delete_account', payload: {confirmation: 'no'}, key}, player.cookie);
    expect(rejected.status).toBe(400);
    expect(await rejected.json()).toEqual({error: 'DELETE_CONFIRMATION'});
    const deleted = await post('/api/command', {action: 'delete_account', payload: {confirmation: 'DELETE'}, key: randomUUID()}, player.cookie);
    expect(deleted.status).toBe(200);
    expect(await deleted.json()).toMatchObject({state: null, result: {deleted: true}});
    expect((await fetch(`${base}/api/state`, {headers: {Cookie: player.cookie}})).status).toBe(401);
    const remaining = await local.database.owner((tx) => tx.query('SELECT id FROM auth.users WHERE id=$1', [player.user.id]));
    expect(remaining.rows).toHaveLength(0);
  });

  it('enforces authentication and command burst limits before processing mutations', async () => {
    const player = await register('Limited');
    const limited = await createLocalServer({database: local.database, authRateLimit: 2, commandRateLimit: 1});
    const address = await limited.listen(0);
    const request = (path: string, body: unknown) => fetch(`${address}${path}`, {method: 'POST', headers: {'Content-Type': 'application/json', Origin: origin, Cookie: player.cookie}, body: JSON.stringify(body)});
    try {
      for (let index = 0; index < 2; index += 1) expect((await request('/api/auth/login', {email: player.email, password: 'wrong-password'})).status).toBe(401);
      const blocked = await request('/api/auth/login', {email: player.email, password: 'wrong-password'});
      expect(blocked.status).toBe(429);
      expect(await blocked.json()).toEqual({error: 'RATE_LIMIT'});
      expect((await request('/api/command', {action: 'profile_update', payload: {display_name: 'Allowed'}, key: randomUUID()})).status).toBe(200);
      expect((await request('/api/command', {action: 'profile_update', payload: {display_name: 'Blocked'}, key: randomUUID()})).status).toBe(429);
    } finally { await limited.close(); }
  });

  it('recovers account, opaque session and exact saved state after closing and reopening the disk database', async () => {
    const player = await register('Restart');
    const updated = await post('/api/command', {action: 'profile_update', payload: {display_name: 'Recovered', language: 'en'}, key: randomUUID()}, player.cookie);
    expect(updated.status).toBe(200);
    await local.close();
    local = await createLocalServer({databasePath: join(directory, 'db')});
    base = await local.listen(0);
    const recovered = await fetch(`${base}/api/state`, {headers: {Cookie: player.cookie}});
    expect(recovered.status).toBe(200);
    expect((await recovered.json() as GameSnapshot).profile).toMatchObject({id: player.user.id, display_name: 'Recovered', language: 'en'});
  });
});
