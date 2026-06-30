import type { Request } from 'express';
import { passwordSchema } from '@track/shared';
import { asyncHandler } from '../../lib/async-handler';
import { ok } from '../../lib/envelope';
import { HttpError } from '../../lib/http-error';
import {
  COOKIE_NAME,
  cookieOptions,
  signSession,
  verifyPassword,
  verifySession,
} from '../../lib/auth';
import { notifyDiscord } from '../../lib/notify';

/**
 * Records a login attempt: a structured line to stdout (the durable record, kept in
 * the host logs) plus a best-effort Discord alert carrying the client IP and
 * user-agent, so a suspicious attempt is actionable. `||` (not `??`) also replaces an
 * empty string — Discord rejects an embed field whose value is empty with a 400.
 */
function recordLoginAttempt(req: Request, success: boolean): void {
  const ip = req.ip || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';
  console.log(`[auth] login ${success ? 'success' : 'invalid_password'} ip=${ip} ua=${userAgent}`);
  notifyDiscord({
    title: success ? 'Login succeeded' : 'Failed login attempt',
    color: success ? 0x57f287 : 0xed4245,
    fields: [
      { name: 'IP', value: ip, inline: true },
      { name: 'User-Agent', value: userAgent },
    ],
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/auth/login — exchange the single password for a session cookie.
 * Reachable without a session (mounted before the gate). Wrong password → 401.
 */
export const login = asyncHandler(async (req, res) => {
  const result = passwordSchema.safeParse(req.body?.password);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0].message);
  }

  if (!(await verifyPassword(result.data))) {
    recordLoginAttempt(req, false);
    throw new HttpError(401, 'Invalid password');
  }

  const { token, expiresAt } = await signSession();
  res.cookie(COOKIE_NAME, token, cookieOptions());
  // After the session is actually established, so a failing signSession can't alert "success".
  recordLoginAttempt(req, true);
  ok(res, { expiresAt });
});

/** POST /api/auth/logout — clear the session cookie. Idempotent. */
export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions(true));
  ok(res, { ok: true });
});

/**
 * GET /api/auth/me — report whether the cookie holds a valid session. Stateless
 * (no DB), so it answers immediately even while the database is still cold.
 */
export const me = asyncHandler(async (req, res) => {
  const session = await verifySession(req.cookies?.[COOKIE_NAME]);
  if (!session) throw new HttpError(401, 'Unauthorized');
  ok(res, { authenticated: true, expiresAt: session.expiresAt });
});
