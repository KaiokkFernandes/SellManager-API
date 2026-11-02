import 'reflect-metadata';
import '@config/zod';
import express, { Express } from 'express';
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
import { originPolicy } from './middlewares/originPolicy';
import { createRoutes } from './routes';

interface AppOptions {
  /** Swagger UI e documento OpenAPI (padrão: tudo menos produção). */
  docs?: boolean;
  /** Origens de outros domínios aceitas (padrão: CORS_ORIGIN). */
  corsOrigins?: string[];
}

export function createApp(
  container: Container,
  {
    docs = env.NODE_ENV !== 'production',
    corsOrigins = env.CORS_ORIGIN,
  }: AppOptions = {},
): Express {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY);

  app.use(pinoHttp({ logger, serializers: requestSerializers }));
  // cross-origin: o front-end (outra origem) precisa carregar os avatares em /files
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(originPolicy(corsOrigins));
  app.use(express.json({ limit: '100kb' }));
  // só o provider de disco serve arquivos; o Blob entrega direto pela URL dele
  if (env.STORAGE_DRIVER === 'disk') {
    app.use(
      `${API_BASE_PATH}/files`,
      express.static(uploadConfig.uploadsFolder),
    );
  }
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
