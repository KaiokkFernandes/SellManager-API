import 'reflect-metadata';
import '@config/zod';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { API_BASE_PATH } from '@sellmanager/shared';
import { env } from '@config/env';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import uploadConfig from '@config/upload';
import { Container } from '@shared/container';
import { logger, requestSerializers } from '@shared/logger';
import { generateOpenApiDocument } from './contract/openapi';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { createRoutes } from './routes';

interface AppOptions {
  /** Swagger UI e documento OpenAPI (padrão: tudo menos produção). */
  docs?: boolean;
}

export function createApp(
  container: Container,
  { docs = env.NODE_ENV !== 'production' }: AppOptions = {},
): Express {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY);

  app.use(pinoHttp({ logger, serializers: requestSerializers }));
  // cross-origin: o front-end (outra origem) precisa carregar os avatares em /files
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({ origin: env.CORS_ORIGIN.includes('*') ? '*' : env.CORS_ORIGIN }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(`${API_BASE_PATH}/files`, express.static(uploadConfig.uploadsFolder));
  // Fora de produção: o documento revela todas as rotas e o mapa de permissões,
  // a API não tem consumidores externos e os arquivos estáticos do Swagger não
  // são servidos na função da Vercel. Gerado em memória: nada é lido do disco.
  if (docs) {
    const openApiDocument = {
      ...generateOpenApiDocument(),
      servers: [{ url: `${env.APP_API_URL}${API_BASE_PATH}` }],
    } as swaggerUi.JsonObject;
    app.get(`${API_BASE_PATH}/docs.json`, (_request, response) => {
      response.json(openApiDocument);
    });
    app.use(
      `${API_BASE_PATH}/docs`,
      swaggerUi.serve,
      swaggerUi.setup(openApiDocument),
    );
  }

  app.use(API_BASE_PATH, createRoutes(container));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
