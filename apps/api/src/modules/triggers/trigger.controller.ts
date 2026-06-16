import { asyncHandler } from '../../lib/async-handler';
import { ok } from '../../lib/envelope';
import { triggerService } from './trigger.service';

export const list = asyncHandler(async (_req, res) => {
  ok(res, await triggerService.list());
});
