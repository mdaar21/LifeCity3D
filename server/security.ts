import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { IncomingMessage } from 'node:http';

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = 'lifecity_session';
export const randomToken = (): string => randomBytes(32).toString('base64url');
export const digestToken = (token: string): string => createHash('sha256').update(token).digest('hex');

export async function hashPassword(password: string, salt = randomBytes(16).toString('hex')): Promise<{hash: string; salt: string}> {
  const derived = await scrypt(password, salt, 64) as Buffer;
  return { hash: derived.toString('hex'), salt };
}

// Use identical expensive work for nonexistent accounts to reduce account enumeration.
export async function verifyPassword(password: string, hash?: string, salt?: string): Promise<boolean> {
  const calculated = await hashPassword(password, salt ?? '0'.repeat(32));
  const expected = Buffer.from(hash ?? '0'.repeat(128), 'hex');
  const actual = Buffer.from(calculated.hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected) && Boolean(hash);
}

export function sessionCookie(token: string, secure: boolean, clear = false): string {
  return `${SESSION_COOKIE}=${clear ? '' : token}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : 60 * 60 * 24 * 7}${secure ? '; Secure' : ''}`;
}

export function readSessionCookie(request: IncomingMessage): string | null {
  const match = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const token = match.slice(SESSION_COOKIE.length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

/** Bounded, process-local burst limiter; authoritative game limits remain in SQL. */
export class RateLimiter {
  private readonly entries = new Map<string, {count: number; expires: number}>();
  constructor(private readonly limit: number, private readonly windowMs: number) {}

  allow(key: string): boolean {
    const now = Date.now();
    if (this.entries.size > 10_000) {
      for (const [entryKey, entry] of this.entries) if (entry.expires <= now) this.entries.delete(entryKey);
      if (this.entries.size > 10_000) return false;
    }
    const entry = this.entries.get(key);
    if (!entry || entry.expires <= now) {
      this.entries.set(key, {count: 1, expires: now + this.windowMs});
      return true;
    }
    if (entry.count >= this.limit) return false;
    entry.count += 1;
    return true;
  }
}
