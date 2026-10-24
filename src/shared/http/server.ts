import { env } from '@config/env';
import { AppDataSource } from '@shared/infra/typeorm/data-source';
import app from './app';

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();

  const server = app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}! 🚀`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} recebido, encerrando...`);
    server.close(() => {
      AppDataSource.destroy().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch(error => {
  console.error('Falha ao iniciar a aplicação:', error);
  process.exit(1);
});
