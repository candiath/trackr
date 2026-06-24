import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { CookieOptions } from 'express';
import { HttpError } from './http-error';

/**
 * Single-user authentication primitives.
 *
 * The app has one owner, so there are no user/session tables: a single password
 * (stored hashed in `AUTH_PASSWORD_HASH`) is exchanged for a stateless JWT, kept in
 * an httpOnly cookie and signed with `AUTH_JWT_SECRET`. Verifying the cookie needs
 * no database hit, so auth keeps working the instant a cold server wakes up — even
 * before Postgres is reachable.
 */

/** Name of the session cookie carrying the signed JWT. */
export const COOKIE_NAME = 'track_session';

/** Session lifetime: 30 days, shared by the JWT `exp` and the cookie `maxAge`. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** scrypt output length in bytes (matches what `hashPassword` produces). */
const KEY_LENGTH = 32;

/**
 * A missing server-side secret is a misconfiguration (500), not a client error —
 * the gate must never be silently open. Mirrors the old shared-secret middleware.
 */
function jwtSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) throw new HttpError(500, 'AUTH_JWT_SECRET is not configured');
  return new TextEncoder().encode(secret);
}

/**
 * Hashes a plaintext password with a fresh random salt, returning the
 * `"<saltHex>:<hashHex>"` string to store in `AUTH_PASSWORD_HASH`. Used by the
 * `auth:hash` helper script; never called at request time.
 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEY_LENGTH);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Constant-time check of a submitted password against `AUTH_PASSWORD_HASH`. Returns
 * false on any malformed/missing stored hash rather than throwing, so a bad config
 * reads as "wrong password" to the client (the 500 path is reserved for the JWT
 * secret, which the gate also depends on).
 */
export function verifyPassword(plain: string): boolean {
  const stored = process.env.AUTH_PASSWORD_HASH;
  if (!stored) throw new HttpError(500, 'AUTH_PASSWORD_HASH is not configured');

  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(plain, Buffer.from(saltHex, 'hex'), expected.length);
  // timingSafeEqual throws on length mismatch, so guard it first.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** A verified session: the absolute expiry, as epoch milliseconds. */
export interface Session {
  expiresAt: number;
}

/**
 * Signs a new session JWT. Returns the token and its absolute expiry (epoch ms) so
 * the caller can both set the cookie and hand the expiry to the client as a
 * non-sensitive "logged in until" hint.
 */
export async function signSession(): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(jwtSecret());
  return { token, expiresAt };
}

/**
 * Verifies a session token (signature + expiry). Resolves to the session, or null
 * when the token is missing/invalid/expired — callers turn null into a 401.
 */
export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    return { expiresAt: (payload.exp ?? 0) * 1000 };
  } catch {
    return null;
  }
}

/**
 * Cookie attributes for the session. `secure` only in production so http://localhost
 * dev still works; `sameSite: 'lax'` is enough for a same-site SPA + a top-level
 * login POST. `clear` zeroes the maxAge for logout.
 */
export function cookieOptions(clear = false): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: clear ? 0 : MAX_AGE_SECONDS * 1000,
  };
}
