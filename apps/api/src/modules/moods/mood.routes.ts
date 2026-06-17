import { Router } from 'express';
import { moodEntryCreateSchema } from '@track/shared';
import { validate } from '../../middleware/validate';
import * as moodController from './mood.controller';

export const moodsRouter = Router();

moodsRouter.get('/', moodController.list);
moodsRouter.post('/', validate(moodEntryCreateSchema), moodController.create);
moodsRouter.delete('/:id', moodController.remove);
