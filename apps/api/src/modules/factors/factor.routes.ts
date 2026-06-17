import { Router } from 'express';
import { factorCreateSchema } from '@track/shared';
import { validate } from '../../middleware/validate';
import * as factorController from './factor.controller';

export const factorsRouter = Router();

factorsRouter.get('/', factorController.list);
factorsRouter.post('/', validate(factorCreateSchema), factorController.create);
