import { env } from '@config/env';
import { makeContainer } from '@shared/container';
import { AppDataSource } from '@shared/infra/typeorm/data-source';
import { logger } from '@shared/logger';
import { createApp } from './app';

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();

  const app = createApp(makeContainer(AppDataSource));

  const server = app.listen(env.PORT, () => {
    logger.info(`Server is running on port ${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} recebido, encerrando...`);
    server.close(() => {
      void AppDataSource.destroy().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch(error => {
  logger.fatal({ err: error }, 'Falha ao iniciar a aplicação');
  process.exit(1);
});
