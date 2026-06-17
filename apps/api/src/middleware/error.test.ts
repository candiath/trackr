import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError, z } from 'zod';
import { HttpError } from '../lib/http-error';
import { errorMiddleware } from './error';

// Minimal Response double: records the status and json payload the middleware sets.
function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

const run = (err: unknown) => {
  const res = mockRes();
  errorMiddleware(err, {} as never, res, vi.fn());
  return res;
};

describe('errorMiddleware', () => {
  it('maps an HttpError to its status and message', () => {
    const res = run(new HttpError(404, 'Behavior not found'));
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Behavior not found' });
  });

  it('maps a ZodError to 400 with the field-prefixed message', () => {
    const err = z
      .object({ name: z.string().min(1, 'Name is required') })
      .safeParse({ name: '' }).error as ZodError;
    const res = run(err);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'name: Name is required' });
  });

  it('maps a Prisma initialization error to 503 (database unreachable)', () => {
    const err = new Prisma.PrismaClientInitializationError(
      "Can't reach database server",
      '6.5.0',
    );
    const res = run(err);
    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ error: "Can't reach the database" });
  });

  it('maps the P1001 "can\'t reach the server" code to 503', () => {
    const err = new Prisma.PrismaClientKnownRequestError('unreachable', {
      code: 'P1001',
      clientVersion: '6.5.0',
    });
    const res = run(err);
    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ error: "Can't reach the database" });
  });

  it('keeps a non-connection Prisma error (e.g. P2002) as a generic 500', () => {
    const err = new Prisma.PrismaClientKnownRequestError('unique constraint', {
      code: 'P2002',
      clientVersion: '6.5.0',
    });
    const res = run(err);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('falls back to 500 for any unknown error', () => {
    const res = run(new Error('boom'));
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});
