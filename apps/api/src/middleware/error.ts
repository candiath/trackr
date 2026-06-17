import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/http-error';

/**
 * Central error handler: maps known HttpErrors to their status, validation
 * failures (ZodError) to a 400 with the first readable message, and anything else
 * to a 500. Always answers as an { error } envelope so the frontend unwraps it the
 * same way.
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

  if (err instanceof ZodError) {
    const first = err.issues[0];
    // Prefix with the field path (when present) so "name: Name is required" is
    // actionable in the UI rather than a bare message.
    const path = first?.path.join('.');
    const message = path ? `${path}: ${first.message}` : (first?.message ?? 'Invalid request');
    res.status(400).json({ error: message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
