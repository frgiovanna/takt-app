import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { categoriesRouter } from './routes/categories.js';
import { activitiesRouter } from './routes/activities.js';
import { calendarRouter } from './routes/calendar.js';

export function createServer() {
  const app = express();

  app.use(cors({
    origin: '*', // For development, allow any origin
  }));
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // Register routers
  app.use('/api/auth', authRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/time-entries', activitiesRouter);
  app.use('/api/calendar', calendarRouter);

  // Global Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  return app;
}
