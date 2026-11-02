import 'reflect-metadata';
import { makeContainer } from '@shared/container';
import { createApp } from '@shared/http/createApp';
import { AppDataSource } from '@shared/infra/typeorm/data-source';

// Entrada da Vercel: exporta o app e não chama listen. A conexão com o banco
// nasce na primeira requisição (databaseReady). Fora da Vercel: shared/http/server.ts.
export default createApp(makeContainer(AppDataSource));
