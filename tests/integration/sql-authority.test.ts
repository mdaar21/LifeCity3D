import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createLocalDatabase, type LocalDatabase } from '../../server/database.js';
import { createPlayer, runCommand, state } from './fixtures.js';

let directory: string;
let database: LocalDatabase;
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'lifecity-sql-'));
  database = await createLocalDatabase({path: join(directory, 'db')});
}, 60_000);
afterAll(async () => { await database?.close(); if (directory) await rm(directory, {recursive: true, force: true}); });

describe('authoritative RPCs under the real authenticated SQL role', () => {
  it('isolates accounts with RLS and denies direct wallet/ledger/credential writes', async () => {
    const alice = await createPlayer(database, 'alice', 300);
    const bob = await createPlayer(database, 'bob', 20);
    const visible = await database.asUser(alice.id, (tx) => tx.query<{user_id: string}>('SELECT user_id FROM public.wallets'));
    expect(visible.rows.map((row) => row.user_id)).toEqual([alice.id]);
    expect((await state(database, bob.id)).wallet.balance).toBe(20);
    await expect(database.asUser(alice.id, (tx) => tx.query('UPDATE public.wallets SET balance=9999 WHERE user_id=$1', [alice.id]))).rejects.toThrow();
    await expect(database.asUser(alice.id, (tx) => tx.query('DELETE FROM public.coin_transactions WHERE user_id=$1', [alice.id]))).rejects.toThrow();
    await expect(database.asUser(alice.id, (tx) => tx.query('SELECT * FROM local_auth.credentials'))).rejects.toThrow();
    await expect(database.asUser(alice.id, (tx) => tx.query('SELECT public.game_state_for($1)', [bob.id]))).rejects.toThrow();
    await expect(database.asAnonymous((tx) => tx.query('SELECT public.game_state()'))).rejects.toThrow();
  });

  it('serializes concurrent commands and replays a key without double credit', async () => {
    const player = await createPlayer(database, 'double');
    const task = (await state(database, player.id)).tasks.find((entry) => entry.reward === 10)!;
    expect(task).toBeDefined();
    const key = randomUUID();
    const replies = await Promise.all(Array.from({length: 8}, () => runCommand(database, player.id, 'task_complete', {task_id: task.id}, key)));
    expect(replies).toHaveLength(8);
    const saved = await state(database, player.id);
    expect(saved.wallet.balance).toBe(task.reward);
    expect(saved.completions.filter((entry) => entry.task_id === task.id)).toHaveLength(1);
    await expect(runCommand(database, player.id, 'task_complete', {task_id: task.id})).rejects.toThrow(/daily_limit/i);
    await expect(runCommand(database, player.id, 'profile_update', {display_name: 'Conflict'}, key)).rejects.toThrow(/idempotency_conflict/i);
    const other = await createPlayer(database, 'race');
    const otherTask = (await state(database, other.id)).tasks.find((entry) => entry.reward === 10)!;
    const concurrent = await Promise.allSettled([runCommand(database, other.id, 'task_complete', {task_id: otherTask.id}), runCommand(database, other.id, 'task_complete', {task_id: otherTask.id})]);
    expect(concurrent.filter((reply) => reply.status === 'fulfilled')).toHaveLength(1);
    expect((await state(database, other.id)).wallet.balance).toBe(otherTask.reward);
  });

  it('pays completed study minutes and the 60-minute bonus once using server elapsed time', async () => {
    const player = await createPlayer(database, 'study');
    await runCommand(database, player.id, 'study_start');
    let snapshot = await state(database, player.id);
    const session = snapshot.study_sessions[0]!;
    await runCommand(database, player.id, 'study_heartbeat', {session_id: session.id, seconds: 3600, reward: 99999});
    expect((await state(database, player.id)).wallet.balance).toBe(0);
    // A privileged fixture advances persisted server timestamps, never the RPC payload.
    await database.owner((tx) => tx.query("UPDATE public.study_sessions SET active_seconds=59,last_tick_at=now()-interval '1.1 seconds' WHERE id=$1", [session.id]));
    await runCommand(database, player.id, 'study_heartbeat', {session_id: session.id});
    expect((await state(database, player.id)).wallet.balance).toBe(1);
    await database.owner((tx) => tx.query("UPDATE public.study_sessions SET active_seconds=3599,credited_minutes=59,last_tick_at=now()-interval '1.1 seconds' WHERE id=$1", [session.id]));
    const milestoneKey = randomUUID();
    await runCommand(database, player.id, 'study_heartbeat', {session_id: session.id}, milestoneKey);
    await runCommand(database, player.id, 'study_heartbeat', {session_id: session.id}, milestoneKey);
    await runCommand(database, player.id, 'study_heartbeat', {session_id: session.id});
    snapshot = await state(database, player.id);
    expect(snapshot.wallet.balance).toBe(22);
    expect(snapshot.study_sessions[0]!.bonus_awarded).toBe(true);
    expect(snapshot.study_sessions[0]!.credited_minutes).toBe(60);
    await runCommand(database, player.id, 'study_pause', {session_id: session.id});
    await runCommand(database, player.id, 'study_resume', {session_id: session.id});
    await runCommand(database, player.id, 'study_finish', {session_id: session.id});
    expect((await state(database, player.id)).wallet.balance).toBe(22);
  });

  it('caps questionable idle elapsed time and pauses the recovered session', async () => {
    const player = await createPlayer(database, 'idle');
    await runCommand(database, player.id, 'study_start');
    const session = (await state(database, player.id)).study_sessions[0]!;
    await database.owner((tx) => tx.query("UPDATE public.study_sessions SET last_tick_at=now()-interval '4 hours' WHERE id=$1", [session.id]));
    await runCommand(database, player.id, 'study_heartbeat', {session_id: session.id});
    const saved = await state(database, player.id);
    expect(saved.wallet.balance).toBe(1);
    expect(saved.study_sessions[0]!.active_seconds).toBeLessThanOrEqual(90);
    expect(saved.study_sessions[0]!.status).toBe('paused');
    expect(saved.study_sessions[0]!.idle_capped).toBe(true);
  });

  it('records prayer rewards once, requires missed confirmation and compensates corrections', async () => {
    const player = await createPlayer(database, 'prayers');
    expect((await state(database, player.id)).wallet.balance).toBe(0);
    for (const prayer of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      await runCommand(database, player.id, 'prayer_set', {prayer, status: 'completed'});
      await runCommand(database, player.id, 'prayer_set', {prayer, status: 'completed'});
    }
    // Five distinct prayers retain 110 base units and unlock the separate +30 milestone.
    expect((await state(database, player.id)).wallet.balance).toBe(140);
    await expect(runCommand(database, player.id, 'prayer_set', {prayer: 'fajr', status: 'missed'})).rejects.toThrow(/confirm_missed/i);
    const key = randomUUID();
    await runCommand(database, player.id, 'prayer_set', {prayer: 'fajr', status: 'missed', confirmed_missed: true}, key);
    await runCommand(database, player.id, 'prayer_set', {prayer: 'fajr', status: 'missed', confirmed_missed: true}, key);
    expect((await state(database, player.id)).wallet.balance).toBe(10);
    await runCommand(database, player.id, 'prayer_set', {prayer: 'fajr', status: 'excused'});
    const corrected = await state(database, player.id);
    expect(corrected.wallet.balance).toBe(110);
    expect(corrected.wallet.player_xp).toBeGreaterThanOrEqual(110);
    const audit = await database.owner((tx) => tx.query('SELECT * FROM public.prayer_audit WHERE user_id=$1', [player.id]));
    expect(audit.rows.length).toBeGreaterThanOrEqual(7);
    const debt = await createPlayer(database, 'debt');
    await runCommand(database, debt.id, 'prayer_set', {prayer: 'isha', status: 'missed', confirmed_missed: true});
    await runCommand(database, debt.id, 'prayer_set', {prayer: 'fajr', status: 'excused'});
    expect((await state(database, debt.id)).wallet.balance).toBe(-100);
    await expect(runCommand(database, debt.id, 'purchase', {catalog_id: 'road'})).rejects.toThrow(/insufficient_balance/i);
  });
});
