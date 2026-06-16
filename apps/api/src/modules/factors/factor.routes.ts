import { Router } from 'express';
import * as factorController from './factor.controller';

export const factorsRouter = Router();

factorsRouter.get('/', factorController.list);
factorsRouter.post('/', factorController.create);
