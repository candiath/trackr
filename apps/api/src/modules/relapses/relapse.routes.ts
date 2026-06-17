import { Router } from 'express';
import {
  relapseCreateSchema,
  relapseUpdateSchema,
  relapseEventCreateSchema,
} from '@track/shared';
import { validate } from '../../middleware/validate';
import * as relapseController from './relapse.controller';
import * as eventController from '../relapse-events/relapse-event.controller';

export const relapsesRouter = Router();

// Behaviors (the tracked entity).
relapsesRouter.get('/', relapseController.list);
relapsesRouter.post('/', validate(relapseCreateSchema), relapseController.create);

// Relapse events. The literal `/events/:id` is declared before the dynamic
// `/:id` so deleting an event is never captured as a behavior id.
relapsesRouter.delete('/events/:id', eventController.remove);
relapsesRouter.get('/:id/events', eventController.listByRelapse);
relapsesRouter.post(
  '/:id/events',
  validate(relapseEventCreateSchema),
  eventController.create,
);

relapsesRouter.get('/:id', relapseController.getById);
relapsesRouter.put('/:id', validate(relapseUpdateSchema), relapseController.update);
relapsesRouter.delete('/:id', relapseController.remove);
