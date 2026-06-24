import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from './auth.controller';

/**
 * Throttle login to blunt brute-force against the single password: at most 10
 * attempts per IP per 15 minutes. Answers with the `{ error }` envelope so the
 * frontend unwraps it like any other failure. Successful logins don't count, so a
 * normal user is never locked out.
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
