import express, { type Express } from 'express';
import cors from 'cors';
import { router } from './routes';
import { notFoundMiddleware } from './middleware/not-found';
import { errorMiddleware } from './middleware/error';

/**
 * Builds the Express app. CORS is open because the frontend runs on a different
 * origin (and over the LAN for mobile testing). Routes are mounted under /api and
 * the error/404 middlewares always answer with the { data } / { error } envelope.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  app.use('/api', router);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
