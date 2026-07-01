import fs from 'node:fs';
import path from 'node:path';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { router } from './routes';
import { authRouter } from './modules/auth/auth.routes';
import { notFoundMiddleware } from './middleware/not-found';
import { errorMiddleware } from './middleware/error';
import { requireSession } from './middleware/require-session';

// Built web app (apps/web/dist). Resolved from the cwd, which the run scripts set to
// apps/api (the same assumption Prisma makes to load .env). Served same-origin when
// present (see below).
const webDist = path.resolve(process.cwd(), '../web/dist');

/**
 * Builds the Express app.
 *
 * CORS allows the `CORS_ORIGIN` allowlist (comma-separated) when set, and otherwise
 * only localhost (dev) — it never reflects an arbitrary origin, so a missing
 * CORS_ORIGIN fails closed. Everything under /api requires a valid session cookie;
 * /api/auth/* and /health are public so a logged-out client can authenticate and
 * hosts can health-check.
 *
 * If the web build exists, the same server also serves the PWA (same origin as the
 * API, so no CORS and no mixed-content over Tailscale (DEPRECATED)): static assets first, then a
 * SPA fallback to index.html for client-side routes. The error/404 middlewares
 * always answer non-app requests with the { data } / { error } envelope.
 */
export function createApp(): Express {
  const app = express();

  // Behind a hosting proxy (Render/Railway/Envoy), the TCP peer is the proxy, not the
  // client; the real client IP arrives in X-Forwarded-For. Trust exactly ONE hop so
  // `req.ip` resolves to the real, non-spoofable client (and the login rate limiter
  // keys on it). NOT `true`: trust-all would let an attacker spoof X-Forwarded-For and
  // rotate fake IPs.
  app.set('trust proxy', 1);

  // Security headers (CSP, HSTS, X-Content-Type-Options, frame-ancestors, …). helmet's
  // defaults suit this same-origin app: the bundled JS/CSS/fonts resolve to 'self', the
  // same-origin /api is covered by default-src 'self', and the default style-src allows
  // the inline styles React emits (style={{…}}). Only affects responses the API serves
  // (prod, where it also serves the PWA) — in dev the web is served by Vite. Verify the
  // browser console for CSP violations after a deploy; relaxing a directive is one line.
  app.use(helmet());

  // Credentials are on because auth rides in a cookie. With credentials, reflecting
  // an arbitrary origin is unsafe, so we NEVER do it: allow the explicit CORS_ORIGIN
  // allowlist when set, otherwise only localhost (dev). Forgetting CORS_ORIGIN in
  // production therefore rejects internet origins (fails closed) instead of opening
  // the API to every site. Requests without an Origin header (same-origin, curl,
  // health checks) are not gated.
  const allowlist = process.env.CORS_ORIGIN?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const isLocalhost = (origin: string): boolean =>
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  app.use(
    cors({
      credentials: true,
      origin(origin, cb) { // ?
        if (!origin) return cb(null, true);
        if (allowlist?.length) return cb(null, allowlist.includes(origin));
        return cb(null, isLocalhost(origin));
      },
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  // Auth routes (login/logout/me) are mounted BEFORE the gate so a logged-out
  // client can still authenticate; everything else under /api requires a session.
  app.use('/api/auth', authRouter);
  app.use('/api', requireSession, router);

  if (fs.existsSync(path.join(webDist, 'index.html'))) {
    app.use(express.static(webDist));
    // SPA fallback: any other GET (not /api) returns index.html so deep links and
    // client-side routes work; the service worker takes over once installed.
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.sendFile(path.join(webDist, 'index.html'));
    });
  }

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
