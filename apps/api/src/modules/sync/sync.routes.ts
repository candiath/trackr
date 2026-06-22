import { Router } from 'express';
import { syncPushSchema } from '@track/shared';
import { validate } from '../../middleware/validate';
import * as syncController from './sync.controller';

export const syncRouter = Router();

// Pull: rows changed since the `?since=` cursor (tombstones included).
syncRouter.get('/changes', syncController.changes);
// Push: the rows the client decided should win.
syncRouter.post('/', validate(syncPushSchema), syncController.push);
