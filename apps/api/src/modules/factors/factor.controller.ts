import type { FactorFormData } from '@track/shared';
import { asyncHandler } from '../../lib/async-handler';
import { ok } from '../../lib/envelope';
import { factorService } from './factor.service';

export const list = asyncHandler(async (_req, res) => {
  ok(res, await factorService.list());
});

export const create = asyncHandler(async (req, res) => {
  const { name } = req.body as FactorFormData;
  ok(res, await factorService.create(name), 201);
});
