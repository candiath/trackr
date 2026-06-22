import fs from 'node:fs';
import path from 'node:path';
import express, { type Express } from 'express';
import cors from 'cors';
import { router } from './routes';
import { notFoundMiddleware } from './middleware/not-found';
import { errorMiddleware } from './middleware/error';
import { requireSyncSecret } from './middleware/require-sync-secret';

// Built web app (apps/web/dist). Resolved from the cwd, which the run scripts set to
// apps/api (the same assumption Prisma makes to load .env). Served same-origin when
// present (see below).
const webDist = path.resolve(process.cwd(), '../web/dist');

/**
 * Builds the Express app.
 *
 * CORS is restricted to `CORS_ORIGIN` (comma-separated) when set, and otherwise
 * reflects the request origin for local dev. Everything under /api requires the
 * shared sync secret; only /health is public so hosts can health-check without it.
 *
 * If the web build exists, the same server also serves the PWA (same origin as the
 * API, so no CORS and no mixed-content over Tailscale): static assets first, then a
 * SPA fallback to index.html for client-side routes. The error/404 middlewares
 * always answer non-app requests with the { data } / { error } envelope.
 */
export function createApp(): Express {
  const app = express();

  const origins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim());
  app.use(cors({ origin: origins ?? true }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  app.use('/api', requireSyncSecret, router);

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
