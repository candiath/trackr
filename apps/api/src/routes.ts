import { Router } from 'express';
import { relapsesRouter } from './modules/relapses/relapse.routes';
import { triggersRouter } from './modules/triggers/trigger.routes';
import { factorsRouter } from './modules/factors/factor.routes';
import { moodsRouter } from './modules/moods/mood.routes';

/** Composes every module router under /api. */
export const router = Router();

router.use('/relapses', relapsesRouter);
router.use('/triggers', triggersRouter);
router.use('/factors', factorsRouter);
router.use('/moods', moodsRouter);
