import { asyncHandler } from '../../lib/async-handler';
import { ok } from '../../lib/envelope';
import { moodService } from './mood.service';

export const list = asyncHandler(async (_req, res) => {
  ok(res, await moodService.list());
});

export const create = asyncHandler(async (req, res) => {
  ok(res, await moodService.create(req.body), 201);
});

export const remove = asyncHandler(async (req, res) => {
  await moodService.remove(req.params.id);
  res.status(204).end();
});
