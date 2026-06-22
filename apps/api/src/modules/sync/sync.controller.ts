import { asyncHandler } from '../../lib/async-handler';
import { ok } from '../../lib/envelope';
import { syncService } from './sync.service';

export const changes = asyncHandler(async (req, res) => {
  const since = typeof req.query.since === 'string' ? req.query.since : undefined;
  ok(res, await syncService.changes(since));
});

export const push = asyncHandler(async (req, res) => {
  ok(res, await syncService.push(req.body));
});
