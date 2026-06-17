import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

/**
 * Body-validation middleware factory. Parses `req.body` against a Zod schema from
 * `@track/shared` (the same contract the frontend forms use) and replaces it with
 * the parsed, typed value so controllers can trust their input. A failure throws a
 * ZodError, which the error middleware turns into a 400 `{ error }` envelope.
 *
 * Validation lives in the route layer on purpose: controllers/services stay thin
 * and the schemas are the single source of truth for the shape of an entity.
 */
export function validate(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}
