import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/http-error';

/**
 * Central error handler: maps known HttpErrors to their status and anything else
 * to a 500, always as an { error } envelope.
 */
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
