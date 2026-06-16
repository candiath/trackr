import { Router } from 'express';
import * as triggerController from './trigger.controller';

export const triggersRouter = Router();

triggersRouter.get('/', triggerController.list);
