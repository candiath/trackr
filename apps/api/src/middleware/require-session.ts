import { asyncHandler } from '../lib/async-handler';
import { HttpError } from '../lib/http-error';
import { COOKIE_NAME, verifySession } from '../lib/auth';

/**
 * Gate for /api: the request must carry a valid session cookie (set by
 * /api/auth/login). Verification is stateless (JWT signature + expiry), so it adds
 * no database round-trip and works the moment a cold server wakes.
 *
 * Wrapped in `asyncHandler` so a rejected verification is forwarded to the error
 * middleware (a bare async middleware would leak an unhandled rejection instead).
 *
 * Replaces the old shared-secret gate now that the app is a real single-user login
 * over the public internet rather than a tailnet-only endpoint.
 */
export const requireSession = asyncHandler(async (req, _res, next) => {
  const session = await verifySession(req.cookies?.[COOKIE_NAME]);
  if (!session) throw new HttpError(401, 'Unauthorized');
  next();
});
