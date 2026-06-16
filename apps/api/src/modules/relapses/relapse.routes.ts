import { Router } from 'express';
import * as relapseController from './relapse.controller';
import * as eventController from '../relapse-events/relapse-event.controller';

export const relapsesRouter = Router();

// Behaviors (the tracked entity).
relapsesRouter.get('/', relapseController.list);
relapsesRouter.post('/', relapseController.create);

// Relapse events. The literal `/events/:id` is declared before the dynamic
// `/:id` so deleting an event is never captured as a behavior id.
relapsesRouter.delete('/events/:id', eventController.remove);
relapsesRouter.get('/:id/events', eventController.listByRelapse);
relapsesRouter.post('/:id/events', eventController.create);

relapsesRouter.get('/:id', relapseController.getById);
relapsesRouter.put('/:id', relapseController.update);
relapsesRouter.delete('/:id', relapseController.remove);
