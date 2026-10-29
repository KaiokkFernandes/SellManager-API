import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import * as metrics from './metricsFixtures';

const API = 'http://api.test';
const emptyPage = {
  data: [],
  meta: { page: 1, limit: 1, total: 0, total_pages: 0 },
};

/**
 * Servidor MSW compartilhado; os testes adicionam handlers com `server.use`.
 * Padrões para o que toda tela logada pede: o alerta de estoque baixo (vazio)
 * e os blocos do dashboard (a tela inicial). Quem testa isso sobrescreve.
 */
export const server = setupServer(
  http.get(`${API}/products/low-stock`, () => HttpResponse.json(emptyPage)),
  http.get(`${API}/metrics/summary`, () => HttpResponse.json(metrics.summary)),
  http.get(`${API}/metrics/revenue`, () => HttpResponse.json(metrics.revenue)),
  http.get(`${API}/metrics/top-products`, () =>
    HttpResponse.json(metrics.topProducts),
  ),
  http.get(`${API}/metrics/top-customers`, () =>
    HttpResponse.json(metrics.topCustomers),
  ),
  http.get(`${API}/metrics/categories`, () =>
    HttpResponse.json(metrics.categories),
  ),
  http.get(`${API}/metrics/status`, () => HttpResponse.json(metrics.statuses)),
);
