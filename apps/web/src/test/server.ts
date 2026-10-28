import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const emptyPage = {
  data: [],
  meta: { page: 1, limit: 1, total: 0, total_pages: 0 },
};

/**
 * Servidor MSW compartilhado; os testes adicionam handlers com `server.use`.
 * Padrão: o alerta de estoque baixo do layout (feito em toda tela logada) vem
 * vazio; quem testa o alerta sobrescreve.
 */
export const server = setupServer(
  http.get('http://api.test/products/low-stock', () =>
    HttpResponse.json(emptyPage),
  ),
);
