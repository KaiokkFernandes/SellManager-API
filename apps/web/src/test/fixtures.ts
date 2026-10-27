import type { ApiError, Product, Session, User } from '@sellmanager/api-client';
import { HttpResponse } from 'msw';

// Tipados pelo contrato gerado: se o openapi.json mudar, estes fixtures quebram no typecheck.

export const user = {
  id: '5c301fd4-233e-4eac-bb22-994b162e70d2',
  name: 'Kaio Teste',
  email: 'kaio@example.com',
  avatar: null,
  avatar_url: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
} satisfies User;

export const product = {
  id: '9f8c1a52-4d4e-4a1b-9d0c-2f6a7b8c9d01',
  name: 'Cabo USB-C',
  price_cents: 4990,
  quantity: 10,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
} satisfies Product;

/** JWT sem assinatura válida, só com o `exp` (o front não valida a assinatura). */
export function makeToken(expiresAtSeconds: number): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${encode({ alg: 'HS256' })}.${encode({ sub: user.id, exp: expiresAtSeconds })}.sig`;
}

export const inOneHour = () => Math.floor(Date.now() / 1000) + 3600;

export function session(token = makeToken(inOneHour())): Session {
  return { user, token };
}

export function errorResponse(
  status: number,
  code: ApiError['code'],
  message: string,
  extra: Partial<ApiError> = {},
) {
  const body: ApiError = { status: 'error', code, message, ...extra };
  return HttpResponse.json(body, { status });
}

export function page<T>(data: T[], total = data.length) {
  return {
    data,
    meta: {
      page: 1,
      limit: 20,
      total,
      total_pages: Math.max(1, Math.ceil(total / 20)),
    },
  };
}
