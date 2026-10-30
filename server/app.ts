import {fetchFx} from '../supabase/functions/_shared/fx.ts';
import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { z } from 'zod';
import type { CityVisit, CommandResponse, GameSnapshot, SessionUser } from '../src/lib/types.js';
import { createLocalDatabase, type LocalDatabase } from './database.js';
import { digestToken, hashPassword, randomToken, RateLimiter, readSessionCookie, sessionCookie, verifyPassword } from './security.js';

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string().min(10).max(256);
const registration = z.object({email, password, name: z.string().trim().min(1).max(60),language:z.enum(['ar-SA','en']).optional()}).strict();
const login = z.object({email, password: z.string().min(1).max(256)}).strict();
const command = z.object({action: z.string().regex(/^[a-z_]+$/).max(80), payload: z.record(z.string(), z.unknown()), key: z.string().uuid()}).strict();

class HttpError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); }
}

export interface LocalServerOptions {
  database?: LocalDatabase;
  databasePath?: string;
  allowedOrigins?: string[];
  secureCookies?: boolean;
  authRateLimit?: number;
  commandRateLimit?: number;
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'JSON_REQUIRED');
  if (Number(request.headers['content-length'] ?? 0) > 32_768) {
    request.resume();
    throw new HttpError(413, 'PAYLOAD_TOO_LARGE');
  }
  const chunks: Buffer[] = [];
  let size = 0;
  let tooLarge = false;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
    size += buffer.length;
    if (size > 32_768) tooLarge = true;
    if (!tooLarge) chunks.push(buffer);
  }
  if (tooLarge) throw new HttpError(413, 'PAYLOAD_TOO_LARGE');
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown; }
  catch { throw new HttpError(400, 'INVALID_PAYLOAD'); }
}

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer'});
  response.end(JSON.stringify(body));
}

function safeError(error: unknown): {status: number; code: string} {
  if (error instanceof HttpError) return error;
  if (error instanceof z.ZodError) return {status: 400, code: 'INVALID_PAYLOAD'};
  const record = error as {code?: string; message?: string};
  if (record?.code === '23505') return {status: 409, code: 'CONFLICT'};
  const code = record?.message?.match(/^([a-z][a-z_]{2,})(?:$|:)/i)?.[1]?.toUpperCase();
  if (code) return {status: code === 'AUTH_REQUIRED' ? 401 : 400, code};
  console.error('[LifeCity local reference] Request failed:', record?.code ?? 'internal_error');
  return {status: 500, code: 'INTERNAL_ERROR'};
}

/** Development reference only. Production authentication is Supabase Auth. */
export async function createLocalServer(options: LocalServerOptions = {}) {
  const database = options.database ?? await createLocalDatabase({path: options.databasePath});
  const ownsDatabase = !options.database;
  const secureCookies = options.secureCookies ?? process.env.LOCAL_COOKIE_SECURE === 'true';
  const allowedOrigins = new Set(options.allowedOrigins ?? (process.env.LOCAL_ALLOWED_ORIGINS?.split(',').map((value) => value.trim()).filter(Boolean) ?? [
    'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4174', 'http://127.0.0.1:4174',
  ]));
  const authLimiter = new RateLimiter(options.authRateLimit ?? 25, 60_000);
  const commandLimiter = new RateLimiter(options.commandRateLimit ?? 180, 60_000);
  const visitLimiter = new RateLimiter(60, 60_000);

  async function currentUser(request: IncomingMessage): Promise<SessionUser | null> {
    const token = readSessionCookie(request);
    if (!token) return null;
    return database.owner(async (tx) => {
      const result = await tx.query<{id: string; email: string; display_name: string}>(`
        SELECT u.id,u.email,coalesce(p.display_name,u.raw_user_meta_data->>'display_name','') AS display_name
        FROM local_auth.sessions s JOIN auth.users u ON u.id=s.user_id
        LEFT JOIN public.profiles p ON p.id=u.id
        WHERE s.token_hash=$1 AND s.expires_at>now()
      `, [digestToken(token)]);
      return result.rows[0] ?? null;
    });
  }

  async function requireUser(request: IncomingMessage): Promise<SessionUser> {
    const user = await currentUser(request);
    if (!user) throw new HttpError(401, 'AUTH_REQUIRED');
    return user;
  }

  function requireSameOrigin(request: IncomingMessage): void {
    const origin = request.headers.origin;
    if (!origin || !allowedOrigins.has(origin) || request.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'CSRF_REJECTED');
  }

  async function newSession(userId: string): Promise<string> {
    const token = randomToken();
    await database.owner(async (tx) => {
      await tx.query('DELETE FROM local_auth.sessions WHERE expires_at<=now()');
      await tx.query("INSERT INTO local_auth.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')", [digestToken(token), userId]);
    });
    return token;
  }

  const handler = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const route = url.pathname;
      const method = request.method;
      if (method === 'POST') requireSameOrigin(request);
      if (method === 'GET' && route === '/api/health') {
        json(response, 200, {ok: true, mode: 'local', development_reference: true, email_delivery: false});
        return;
      }
      if (method === 'GET' && route === '/api/auth/user') {
        json(response, 200, {user: await currentUser(request)});
        return;
      }
      if (method === 'GET' && route === '/api/visit') {
        if (!visitLimiter.allow(request.socket.remoteAddress ?? 'unknown')) throw new HttpError(429, 'RATE_LIMIT');
        const code=z.string().regex(/^[0-9a-f]{64}$/).parse(url.searchParams.get('code'));
        const view=await database.asAnonymous(async tx=>(await tx.query<{view:CityVisit}>('SELECT public.city_visit($1) AS view',[code])).rows[0]?.view);
        json(response,200,view);
        return;
      }
      if (method === 'POST' && (route === '/api/auth/register' || route === '/api/auth/login')) {
        const remote = request.socket.remoteAddress ?? 'unknown';
        if (!authLimiter.allow(remote)) throw new HttpError(429, 'RATE_LIMIT');
        const input = await readJson(request);
        let user: SessionUser;
        if (route.endsWith('/register')) {
          const fields = registration.parse(input);
          const derived = await hashPassword(fields.password);
          user = {id: randomUUID(), email: fields.email, display_name: fields.name};
          await database.owner(async (tx) => {
            const existing = await tx.query('SELECT id FROM auth.users WHERE email=$1', [fields.email]);
            if (existing.rows.length) throw new HttpError(409, 'ACCOUNT_EXISTS');
            await tx.query('INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3::jsonb)', [user.id, user.email, JSON.stringify({display_name: fields.name, name: fields.name,language:fields.language??'ar-SA'})]);
            await tx.query('INSERT INTO local_auth.credentials(user_id,password_hash,password_salt) VALUES($1,$2,$3)', [user.id, derived.hash, derived.salt]);
          });
        } else {
          const fields = login.parse(input);
          const credential = await database.owner(async (tx) => (await tx.query<{id: string; email: string; display_name: string; password_hash: string; password_salt: string}>(`
            SELECT u.id,u.email,coalesce(p.display_name,'') AS display_name,c.password_hash,c.password_salt
            FROM auth.users u JOIN local_auth.credentials c ON c.user_id=u.id
            LEFT JOIN public.profiles p ON p.id=u.id WHERE u.email=$1
          `, [fields.email])).rows[0]);
          if (!await verifyPassword(fields.password, credential?.password_hash, credential?.password_salt) || !credential) throw new HttpError(401, 'INVALID_CREDENTIALS');
          user = {id: credential.id, email: credential.email, display_name: credential.display_name};
        }
        response.setHeader('Set-Cookie', sessionCookie(await newSession(user.id), secureCookies));
        json(response, 200, route.endsWith('/register') ? {user, confirmation_required: false, mode: 'local'} : {user});
        return;
      }
      if (method === 'POST' && route === '/api/auth/logout') {
        const token = readSessionCookie(request);
        if (token) await database.owner(async (tx) => { await tx.query('DELETE FROM local_auth.sessions WHERE token_hash=$1', [digestToken(token)]); });
        response.setHeader('Set-Cookie', sessionCookie('', secureCookies, true));
        json(response, 200, {ok: true});
        return;
      }
      if (method === 'POST' && ['/api/auth/reset', '/api/auth/update-password', '/api/auth/reset/update-password'].includes(route)) {
        throw new HttpError(501, 'LOCAL_RECOVERY_NOT_CONFIGURED');
      }
      if (method === 'GET' && (route === '/api/state' || route === '/api/export')) {
        const user = await requireUser(request);
        const state = await database.asUser(user.id, async (tx) => (await tx.query<{state: GameSnapshot}>('SELECT public.game_state() AS state')).rows[0]?.state);
        if (route === '/api/export') response.setHeader('Content-Disposition', 'attachment; filename="lifecity-export.json"');
        json(response, 200, route === '/api/export' ? {format_version: 1, exported_at: new Date().toISOString(), mode: 'local', state} : state);
        return;
      }
      if(method==='POST'&&route==='/api/fx/refresh'){
        const user=await requireUser(request);
        if(!commandLimiter.allow(user.id))throw new HttpError(429,'RATE_LIMIT');
        const cached=await database.owner(tx=>tx.query<{rate_time:string}>('select rate_time from public.fx_rate_snapshots order by rate_time desc limit 1'));
        if(!cached.rows[0]||Date.now()-Date.parse(cached.rows[0].rate_time)>=24*3600_000){const rates=await fetchFx();await database.owner(tx=>tx.query('select public.fx_store_snapshot($1::jsonb)',[JSON.stringify(rates)]));}
        json(response,200,{ok:true});return;
      }
      if (method === 'POST' && (route === '/api/command' || route === '/api/auth/delete')) {
        const user = await requireUser(request);
        if (!commandLimiter.allow(user.id)) throw new HttpError(429, 'RATE_LIMIT');
        const body = await readJson(request);
        const input = route === '/api/auth/delete'
          ? {action: 'delete_account', payload: z.object({confirmation: z.literal('DELETE')}).strict().parse(body), key: randomUUID()}
          : command.parse(body);
        const result = await database.asUser(user.id, async (tx) => (await tx.query<{response: CommandResponse}>('SELECT public.game_command($1,$2::jsonb,$3::uuid) AS response', [input.action, JSON.stringify(input.payload), input.key])).rows[0]?.response);
        if (input.action === 'delete_account') {
          await database.owner(async (tx) => { await tx.query('DELETE FROM auth.users WHERE id=$1', [user.id]); });
          response.setHeader('Set-Cookie', sessionCookie('', secureCookies, true));
        }
        json(response, 200, result);
        return;
      }
      throw new HttpError(404, 'NOT_FOUND');
    } catch (error) {
      const safe = safeError(error);
      if (!response.headersSent) json(response, safe.status, {error: safe.code});
      else response.end();
    }
  };
  const server = createServer((request, response) => { void handler(request, response); });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  return {
    database, server, handler,
    async listen(port = Number(process.env.LOCAL_API_PORT ?? 4174), host = process.env.LOCAL_API_HOST ?? '127.0.0.1'): Promise<string> {
      await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(port, host, () => { server.off('error', reject); resolve(); }); });
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('LOCAL_LISTEN_FAILED');
      return `http://${host}:${address.port}`;
    },
    async close(): Promise<void> {
      if (server.listening) await new Promise<void>((resolve, reject) => { server.close((error) => { if (error) reject(error); else resolve(); }); server.closeIdleConnections(); });
      if (ownsDatabase) await database.close();
    },
  };
}
