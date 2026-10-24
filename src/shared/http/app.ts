import 'reflect-metadata';
import express, { Express } from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import uploadConfig from '@config/upload';
import { Container } from '@shared/container';
import { logger } from '@shared/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { createRoutes } from './routes';

export function createApp(container: Container): Express {
  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(cors());
  app.use(express.json());
  app.use('/files', express.static(uploadConfig.uploadsFolder));
  app.use(createRoutes(container));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
