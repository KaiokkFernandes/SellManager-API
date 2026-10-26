import { createApiClient } from '@sellmanager/api-client';

const TOKEN_KEY = 'sellmanager:token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Client único do app, tipado pelo openapi.json da API. */
export const api = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: tokenStore.get,
  // token expirado/inválido: o app decide; aqui só esquecemos o token
  onUnauthorized: tokenStore.clear,
});
