import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from './auth.controller';

/**
 * Throttle login to blunt brute-force against the single password: at most 10
 * attempts per IP per 15 minutes. Answers with the `{ error }` envelope so the
 * frontend unwraps it like any other failure. Successful logins don't count, so a
 * normal user is never locked out.
 *
 * KNOWN LIMITATION (accepted, not fixed — see issue #6): this uses the default
 * in-memory store, which is per-process and non-persistent. The free-tier host
 * sleeps after ~15 min idle and restarts on wake, wiping the counter, so an
 * attacker effectively gets a fresh quota after each cold start; the store also
 * isn't shared if the service is ever scaled out. Given the threat model
 * (single-user, hobby app), the real brute-force defense is password strength
 * (a high-entropy secret, bounded to 22 chars by `passwordSchema`), not this
 * limiter — which only blunts casual/accidental hammering. A persistent/shared
 * store (e.g. Redis) would fix it but is deliberately out of scope here.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many login attempts. Try again later.' });
  },
});

/** Auth routes. Mounted at /api/auth, BEFORE the session gate. */
export const authRouter = Router();

authRouter.post('/login', loginLimiter, authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authController.me);
