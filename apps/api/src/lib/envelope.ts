import type { Response } from 'express';

/**
 * Envelope helpers. Every success travels as { data } and every error as
 * { error }, so the frontend HTTP client always unwraps the same shape.
 */
export function ok<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ data });
}

export function fail(res: Response, message: string, status = 400): void {
  res.status(status).json({ error: message });
}
