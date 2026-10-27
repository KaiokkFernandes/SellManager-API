import { createApiClient } from '@sellmanager/api-client';
import { env } from './env';
import { tokenStorage } from './tokenStorage';

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | undefined;

/**
 * O AuthProvider registra aqui o que fazer em um 401 de requisição autenticada
 * (logout + ida ao login). Fica fora do client para ele ser criado uma única vez.
 */
export function setUnauthorizedHandler(
  handler: UnauthorizedHandler | undefined,
): void {
  unauthorizedHandler = handler;
}

/** Client único do app, tipado pelo openapi.json da API. */
export const api = createApiClient({
  baseUrl: env.VITE_API_URL,
  // resolve o fetch a cada chamada (e não na criação): testes com MSW o substituem depois
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: tokenStorage.get,
  onUnauthorized: () => unauthorizedHandler?.(),
});
