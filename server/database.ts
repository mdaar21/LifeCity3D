import { PGlite } from '@electric-sql/pglite';
import { readFile,mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {dirname,resolve} from 'node:path';

export interface SqlExecutor {
  query<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<unknown>;
}

/** PGlite is one connection: lock the entire transaction, including SET LOCAL ROLE. */
export class LocalDatabase {
  private tail: Promise<void> = Promise.resolve();

  constructor(private readonly engine: PGlite) {}

  private async exclusive<T>(work: () => Promise<T>): Promise<T> {
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try { return await work(); } finally { release(); }
  }

  owner<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    return this.exclusive(() => this.engine.transaction((tx) => work(tx as SqlExecutor)));
  }

  asUser<T>(userId: string, work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    return this.owner(async (tx) => {
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
      await tx.exec('SET LOCAL ROLE authenticated');
      return work(tx);
    });
  }

  asAnonymous<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    return this.owner(async (tx) => {
      await tx.query("select set_config('request.jwt.claim.sub', '', true)");
      await tx.exec('SET LOCAL ROLE anon');
      return work(tx);
    });
  }

  close(): Promise<void> { return this.exclusive(() => this.engine.close()); }
}

export interface DatabaseOptions { path?: string; projectRoot?: string }

export async function createLocalDatabase(options: DatabaseOptions = {}): Promise<LocalDatabase> {
  const storagePath=options.path ?? process.env.LOCAL_DATABASE_PATH ?? '.data/lifecity';
  if(!storagePath.startsWith('memory://'))await mkdir(dirname(resolve(storagePath)),{recursive:true,mode:0o700});
  const engine = new PGlite(storagePath);
  await engine.waitReady;
  const database = new LocalDatabase(engine);
  const projectRoot = options.projectRoot ?? fileURLToPath(new URL('../', import.meta.url));
  try {
    await database.owner(async (tx) => {
      await tx.exec(`
        CREATE SCHEMA IF NOT EXISTS auth;
        CREATE TABLE IF NOT EXISTS auth.users (
          id uuid PRIMARY KEY, email text UNIQUE NOT NULL,
          raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb
        );
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
        END $$;
        CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
          SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
        $$;
        GRANT USAGE ON SCHEMA auth TO anon, authenticated;
        GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
        CREATE SCHEMA IF NOT EXISTS local_auth;
        REVOKE ALL ON SCHEMA local_auth FROM PUBLIC, anon, authenticated;
        CREATE TABLE IF NOT EXISTS local_auth.migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
        CREATE TABLE IF NOT EXISTS local_auth.credentials (
          user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          password_hash text NOT NULL, password_salt text NOT NULL
        );
        CREATE TABLE IF NOT EXISTS local_auth.sessions (
          token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS local_auth_sessions_expiry ON local_auth.sessions(expires_at);
      `);
      for (const name of ['migrations/001_core.sql', 'migrations/002_city_partner.sql', 'migrations/003_realtime.sql', 'migrations/004_schedule_avatar_upgrade.sql', 'migrations/005_signup_locale.sql', 'migrations/006_projects_visits.sql', 'seed.sql']) {
        const applied = await tx.query('SELECT name FROM local_auth.migrations WHERE name=$1', [name]);
        if (applied.rows.length) continue;
        const sql = await readFile(`${projectRoot}/supabase/${name}`, 'utf8');
        // Migrations also run directly in Supabase, where they carry BEGIN/COMMIT.
        // This loader already owns one atomic transaction covering all migrations.
        await tx.exec(sql.replace(/^\s*begin;\s*$/gmi, '').replace(/^\s*commit;\s*$/gmi, ''));
        await tx.query('INSERT INTO local_auth.migrations(name) VALUES($1)', [name]);
      }
    });
    return database;
  } catch (error) {
    await database.close();
    throw error;
  }
}
