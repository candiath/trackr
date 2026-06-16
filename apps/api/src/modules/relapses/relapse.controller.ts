import { asyncHandler } from '../../lib/async-handler';
import { ok } from '../../lib/envelope';
import { relapseService } from './relapse.service';

export const list = asyncHandler(async (_req, res) => {
  ok(res, await relapseService.list());
});

export const getById = asyncHandler(async (req, res) => {
  ok(res, await relapseService.getById(req.params.id));
});

export const create = asyncHandler(async (req, res) => {
  ok(res, await relapseService.create(req.body), 201);
});

export const update = asyncHandler(async (req, res) => {
  ok(res, await relapseService.update(req.params.id, req.body));
});

export const remove = asyncHandler(async (req, res) => {
  await relapseService.remove(req.params.id);
  res.status(204).end();
});
