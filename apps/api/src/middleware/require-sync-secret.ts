import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/http-error';

/**
 * Gate for the API: the request must carry the shared `X-Sync-Secret` header that
 * matches `process.env.SYNC_SECRET`. The endpoint is only meant to be reached over
 * the private tailnet, so a single shared secret (not per-user auth) is enough.
 *
 * A missing server-side secret is a misconfiguration (500), not a client error, so
 * it is never silently open.
 */
export function requireSyncSecret(req: Request, _res: Response, next: NextFunction): void {
  const expected = process.env.SYNC_SECRET;
  if (!expected) throw new HttpError(500, 'SYNC_SECRET is not configured');
  if (req.header('X-Sync-Secret') !== expected) throw new HttpError(401, 'Unauthorized');
  next();
}
