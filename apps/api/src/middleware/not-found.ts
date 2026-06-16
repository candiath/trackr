import type { Request, Response } from 'express';

/** Fallback for unmatched routes → 404 envelope. */
export function notFoundMiddleware(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}
