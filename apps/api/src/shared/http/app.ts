import 'reflect-metadata';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from '@config/env';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import uploadConfig from '@config/upload';
import { Container } from '@shared/container';
import { logger } from '@shared/logger';
import { generateOpenApiDocument } from './docs/openapi';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { createRoutes } from './routes';

export function createApp(container: Container): Express {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY);

  app.use(pinoHttp({ logger }));
  // cross-origin: o front-end (outra origem) precisa carregar os avatares em /files
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({ origin: env.CORS_ORIGIN.includes('*') ? '*' : env.CORS_ORIGIN }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use('/files', express.static(uploadConfig.uploadsFolder));
  const openApiDocument = generateOpenApiDocument(env.APP_API_URL);
  app.get('/docs.json', (_request, response) => {
    response.json(openApiDocument);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(createRoutes(container));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
