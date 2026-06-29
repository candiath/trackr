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
 * POST /api/auth/login — exchange the single password for a session cookie.
 * Reachable without a session (mounted before the gate). Wrong password → 401.
 */
export const login = asyncHandler(async (req, res) => {
  const result = passwordSchema.safeParse(req.body?.password);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0].message);
  }
  if (!(await verifyPassword(result.data))) {
    notifyDiscord({
      title: "Failed Login Attempt",
      description: `An attempt to log in with an invalid password was made.`,
      color: 0xED4245, // Red color
      timestamp: new Date().toISOString(),
    });
    throw new HttpError(401, 'Invalid password');
  }

  notifyDiscord({
    title: "User Logged In",
    description: `A user has successfully logged in.`,
    color: 0x57F287, // Green color
    timestamp: new Date().toISOString(),
  });
  
  const { token, expiresAt } = await signSession();
  res.cookie(COOKIE_NAME, token, cookieOptions());
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
