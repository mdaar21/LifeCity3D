import { randomUUID } from 'node:crypto';
import type { CommandResponse, GameSnapshot } from '../../src/lib/types.js';
import type { LocalDatabase } from '../../server/database.js';
import { hashPassword } from '../../server/security.js';

export const TEST_PASSWORD = 'Local-test-passphrase-482!';

export async function createPlayer(database: LocalDatabase, label = 'player', balance = 0) {
  const id = randomUUID();
  const email = `${label}-${id}@example.test`;
  const derived = await hashPassword(TEST_PASSWORD);
  await database.owner(async (tx) => {
    await tx.query('INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3::jsonb)', [id, email, JSON.stringify({display_name: label})]);
    await tx.query('INSERT INTO local_auth.credentials(user_id,password_hash,password_salt) VALUES($1,$2,$3)', [id, derived.hash, derived.salt]);
    if (balance) await tx.query('SELECT public.apply_coins($1,$2,$3,$4)', [id, balance, 'test_fixture', `fixture:${randomUUID()}`]);
  });
  return {id, email, password: TEST_PASSWORD};
}

export async function state(database: LocalDatabase, userId: string): Promise<GameSnapshot> {
  return database.asUser(userId, async (tx) => (await tx.query<{state: GameSnapshot}>('SELECT public.game_state() AS state')).rows[0]!.state);
}

export async function runCommand(database: LocalDatabase, userId: string, action: string, payload: Record<string, unknown> = {}, key = randomUUID()): Promise<CommandResponse> {
  return database.asUser(userId, async (tx) => (await tx.query<{response: CommandResponse}>('SELECT public.game_command($1,$2::jsonb,$3::uuid) AS response', [action, JSON.stringify(payload), key])).rows[0]!.response);
}
