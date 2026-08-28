import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api', routes);

  // 404 for unknown API routes.
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Central error handler.
  app.use((err: Error & { name?: string }, _req: Request, res: Response, _next: NextFunction) => {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid id' });
    }
    console.error('[error]', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
