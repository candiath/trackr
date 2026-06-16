import { Router } from 'express';
import * as moodController from './mood.controller';

export const moodsRouter = Router();

moodsRouter.get('/', moodController.list);
moodsRouter.post('/', moodController.create);
moodsRouter.delete('/:id', moodController.remove);
