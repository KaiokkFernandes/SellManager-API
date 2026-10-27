import { setupServer } from 'msw/node';

/** Servidor MSW compartilhado; os testes adicionam handlers com `server.use`. */
export const server = setupServer();
