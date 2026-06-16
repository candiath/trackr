import { asyncHandler } from '../../lib/async-handler';
import { ok } from '../../lib/envelope';
import { relapseEventService } from './relapse-event.service';

export const listByRelapse = asyncHandler(async (req, res) => {
  ok(res, await relapseEventService.listByRelapse(req.params.id));
});

export const create = asyncHandler(async (req, res) => {
  ok(res, await relapseEventService.create(req.params.id, req.body), 201);
});

export const remove = asyncHandler(async (req, res) => {
  await relapseEventService.remove(req.params.id);
  res.status(204).end();
});
