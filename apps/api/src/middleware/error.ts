import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpError } from '../lib/http-error';

/**
 * Prisma error codes that mean "the database is unreachable" (not a bad request):
 * P1000 auth failed, P1001 can't reach the server, P1002 connection timed out,
 * P1008 operation timed out, P1017 server closed the connection. We surface these
 * as 503 so the client can tell "DB down" apart from a real 500 bug.
 */
const DB_UNREACHABLE_CODES = new Set(['P1000', 'P1001', 'P1002', 'P1008', 'P1017']);

function isDatabaseUnreachable(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientInitializationError ||
    (err instanceof Prisma.PrismaClientKnownRequestError &&
      DB_UNREACHABLE_CODES.has(err.code))
  );
}

/**
 * Central error handler: maps known HttpErrors to their status, validation
 * failures (ZodError) to a 400 with the first readable message, database-down
 * errors to a 503, and anything else to a 500. Always answers as an { error }
 * envelope so the frontend unwraps it the same way.
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

  if (isDatabaseUnreachable(err)) {
    console.error(err);
    res.status(503).json({ error: "Can't reach the database" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
