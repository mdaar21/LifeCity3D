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
  directory = await mkdtemp(join(tmpdir(), 'lifecity-schedules-'));
  database = await createLocalDatabase({path: join(directory, 'db')});
}, 60_000);
afterAll(async () => {
  await database?.close();
  if (directory) await rm(directory, {recursive: true, force: true});
});

describe('owner-configured task schedules and profile avatar presets', () => {
  it('enforces a weekly cap across dates and allows a new ISO week', async () => {
    const player = await createPlayer(database, 'weekly');
    await runCommand(database, player.id, 'profile_update', {task_daily_limit: 2});
    const created = await runCommand(database, player.id, 'task_create', {
      title: 'Weekly tidy', reward: 7, category: 'home', frequency: 'weekly', daily_limit: 2,
    });
    const taskId = String(created.result.task_id);
    expect(created.state!.tasks.find((task) => task.id === taskId)).toMatchObject({frequency: 'weekly', daily_limit: 2});
    await runCommand(database, player.id, 'task_complete', {task_id: taskId});
    // Owner fixtures move recorded dates; ordinary clients cannot submit dates.
    // Pick a different date in this ISO week, including a later date if today is
    // Monday, to verify the full week also remains safe after timezone changes.
    await database.owner((tx) => tx.query(`
      UPDATE public.task_completions
      SET day=date_trunc('week',clock_timestamp() AT TIME ZONE 'Asia/Riyadh')::date
        + CASE WHEN extract(isodow FROM clock_timestamp() AT TIME ZONE 'Asia/Riyadh')=1 THEN 1 ELSE 0 END
      WHERE task_id=$1
    `, [taskId]));
    const key = randomUUID();
    await runCommand(database, player.id, 'task_complete', {task_id: taskId}, key);
    await runCommand(database, player.id, 'task_complete', {task_id: taskId}, key);
    await expect(runCommand(database, player.id, 'task_complete', {task_id: taskId})).rejects.toThrow(/DAILY_LIMIT/);
    expect((await state(database, player.id)).wallet.balance).toBe(14);
    await database.owner((tx) => tx.query('UPDATE public.task_completions SET day=day-7 WHERE task_id=$1', [taskId]));
    await runCommand(database, player.id, 'task_complete', {task_id: taskId});
    expect((await state(database, player.id)).wallet.balance).toBe(21);
  });

  it('resets daily tasks by local date while one-time tasks remain exhausted for life', async () => {
    const player = await createPlayer(database, 'daily-once');
    await runCommand(database, player.id, 'profile_update', {task_daily_limit: 2});
    const daily = await runCommand(database, player.id, 'task_create', {title: 'Daily care', reward: 9, daily_limit: 1});
    const dailyId = String(daily.result.task_id);
    expect(daily.state!.tasks.find((task) => task.id === dailyId)).toMatchObject({frequency: 'daily'});
    await runCommand(database, player.id, 'task_complete', {task_id: dailyId});
    await expect(runCommand(database, player.id, 'task_complete', {task_id: dailyId})).rejects.toThrow(/DAILY_LIMIT/);
    await database.owner((tx) => tx.query('UPDATE public.task_completions SET day=day-1 WHERE task_id=$1', [dailyId]));
    await runCommand(database, player.id, 'task_complete', {task_id: dailyId});
    const once = await runCommand(database, player.id, 'task_create', {title: 'One milestone', reward: 11, frequency: 'once', daily_limit: 2});
    const onceId = String(once.result.task_id);
    await runCommand(database, player.id, 'task_complete', {task_id: onceId});
    await database.owner((tx) => tx.query('UPDATE public.task_completions SET day=day-400 WHERE task_id=$1', [onceId]));
    await expect(runCommand(database, player.id, 'task_complete', {task_id: onceId})).rejects.toThrow(/DAILY_LIMIT/);
    expect((await state(database, player.id)).wallet.balance).toBe(29);
  });

  it('allows only owners to edit custom rules without resetting completion history', async () => {
    const owner = await createPlayer(database, 'task-owner');
    const stranger = await createPlayer(database, 'task-stranger');
    await runCommand(database, owner.id, 'profile_update', {task_daily_limit: 3});
    const created = await runCommand(database, owner.id, 'task_create', {title: 'Original task', reward: 7});
    const taskId = String(created.result.task_id);
    await expect(runCommand(database, stranger.id, 'task_update', {task_id: taskId, reward: 100})).rejects.toThrow(/NOT_FOUND/);
    const edited = await runCommand(database, owner.id, 'task_update', {
      task_id: taskId, title: '  Weekly exercise  ', reward: 25, category: 'health', frequency: 'weekly', daily_limit: 2,
    });
    expect(edited.state!.tasks.find((task) => task.id === taskId)).toMatchObject({
      title: 'Weekly exercise', reward: 25, category: 'health', frequency: 'weekly', daily_limit: 2,
    });
    await runCommand(database, owner.id, 'task_complete', {task_id: taskId});
    await runCommand(database, owner.id, 'task_update', {task_id: taskId, frequency: 'once'});
    await expect(runCommand(database, owner.id, 'task_complete', {task_id: taskId})).rejects.toThrow(/DAILY_LIMIT/);
    await runCommand(database, owner.id, 'task_update', {task_id: taskId, frequency: 'daily'});
    await runCommand(database, owner.id, 'task_complete', {task_id: taskId});
    await expect(runCommand(database, owner.id, 'task_update', {task_id: taskId, reward: 501})).rejects.toThrow(/INVALID_PAYLOAD/);
    await expect(runCommand(database, owner.id, 'task_update', {task_id: taskId, frequency: 'yearly'})).rejects.toThrow(/INVALID_PAYLOAD/);
    await expect(runCommand(database, owner.id, 'task_create', {title: 'Invalid schedule', reward: 7, frequency: null})).rejects.toThrow(/INVALID_PAYLOAD/);
    const saved = await state(database, owner.id);
    expect(saved.wallet.balance).toBe(50);
    expect(saved.wallet.player_xp).toBe(50);
    expect(saved.completions.filter((completion) => completion.task_id === taskId)).toHaveLength(2);
    expect(saved.tasks.find((task) => task.id === taskId)).toMatchObject({reward: 25, frequency: 'daily'});
  });

  it('keeps prescribed built-in rewards fixed while respecting individual and global caps', async () => {
    const player = await createPlayer(database, 'builtin-limits');
    let saved = await state(database, player.id);
    const clean = saved.tasks.find((task) => task.key === 'clean_room')!;
    const bed = saved.tasks.find((task) => task.key === 'make_bed')!;
    await expect(runCommand(database, player.id, 'task_update', {task_id: clean.id, reward: 999})).rejects.toThrow(/TASK_FIXED/);
    await expect(runCommand(database, player.id, 'task_update', {task_id: clean.id, frequency: 'weekly'})).rejects.toThrow(/TASK_FIXED/);
    await runCommand(database, player.id, 'profile_update', {task_daily_limit: 3});
    await runCommand(database, player.id, 'task_update', {task_id: clean.id, daily_limit: 1});
    await runCommand(database, player.id, 'task_complete', {task_id: clean.id});
    await expect(runCommand(database, player.id, 'task_complete', {task_id: clean.id})).rejects.toThrow(/DAILY_LIMIT/);
    for (let index = 0; index < 3; index += 1) await runCommand(database, player.id, 'task_complete', {task_id: bed.id});
    await expect(runCommand(database, player.id, 'task_complete', {task_id: bed.id})).rejects.toThrow(/DAILY_LIMIT/);
    saved = await state(database, player.id);
    expect(saved.tasks.find((task) => task.id === clean.id)).toMatchObject({reward: 40, frequency: 'daily', daily_limit: 1});
    expect(saved.wallet.balance).toBe(70);
    // A global change is an explicit reset of the built-in task limits.
    const reduced = await runCommand(database, player.id, 'profile_update', {task_daily_limit: 1});
    expect(reduced.state!.tasks.filter((task) => task.key !== null).every((task) => task.daily_limit === 1)).toBe(true);
  });

  it('persists only supported avatar preset keys and rejects external media values', async () => {
    const player = await createPlayer(database, 'avatar-presets');
    expect((await state(database, player.id)).profile.avatar).toBe('sprout');
    for (const avatar of ['sun', 'moon', 'home', 'sprout']) {
      const updated = await runCommand(database, player.id, 'profile_update', {avatar});
      expect(updated.state!.profile.avatar).toBe(avatar);
    }
    for (const avatar of ['https://example.test/avatar.svg', '', 'unknown', null, 42]) {
      await expect(runCommand(database, player.id, 'profile_update', {avatar})).rejects.toThrow(/INVALID_PAYLOAD/);
    }
    expect((await state(database, player.id)).profile.avatar).toBe('sprout');
  });
});
