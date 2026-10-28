import type {
  ApiError,
  Customer,
  Order,
  OrderDetails,
  Product,
  Session,
  User,
} from '@sellmanager/api-client';
import type { Role } from '@sellmanager/shared';
import { http, HttpResponse } from 'msw';
import { tokenStorage } from '@/lib/tokenStorage';
import { server } from './server';

// Tipados pelo contrato gerado: se o openapi.json mudar, estes fixtures quebram no typecheck.

export const user = {
  id: '5c301fd4-233e-4eac-bb22-994b162e70d2',
  name: 'Kaio Teste',
  email: 'kaio@example.com',
  avatar: null,
  avatar_url: null,
  role: 'ADMIN',
  active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
} satisfies User;

export const product = {
  id: '9f8c1a52-4d4e-4a1b-9d0c-2f6a7b8c9d01',
  name: 'Cabo USB-C',
  price_cents: 4990,
  quantity: 10,
  min_stock: 0,
  below_min_stock: false,
  category: null,
  image_url: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
} satisfies Product;

export const customer = {
  id: '6e2ba4c6-96f5-4d7f-9303-6f6b91a1a960',
  name: 'Ana Souza',
  email: 'ana@example.com',
  created_at: '2026-02-10T12:00:00.000Z',
  updated_at: '2026-02-10T12:00:00.000Z',
} satisfies Customer;

export function makeCustomer(index: number): Customer {
  return {
    ...customer,
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    name: `Cliente ${index}`,
    email: `cliente${index}@example.com`,
  };
}

export const order = {
  id: 'a7d0c3e1-1111-4a2b-8c3d-000000000001',
  customer_id: customer.id,
  customer: { id: customer.id, name: customer.name, email: customer.email },
  status: 'pending',
  total_cents: 9980,
  items: [
    {
      id: 'b1000000-0000-4000-8000-000000000001',
      order_id: 'a7d0c3e1-1111-4a2b-8c3d-000000000001',
      product_id: product.id,
      product: { id: product.id, name: product.name },
      price_cents: 4990,
      quantity: 2,
    },
  ],
  created_at: '2026-10-20T15:30:00.000Z',
  updated_at: '2026-10-20T15:30:00.000Z',
} satisfies Order;

/** Detalhe do pedido (GET /orders/{id} e transições): com o histórico. */
export const orderDetails = {
  ...order,
  history: [
    {
      id: 'c2000000-0000-4000-8000-000000000001',
      from_status: null,
      to_status: 'pending',
      changed_by: { id: 'u1000000-0000-4000-8000-000000000001', name: 'Vera' },
      reason: null,
      created_at: '2026-10-20T15:30:00.000Z',
    },
  ],
} satisfies OrderDetails;

/** Detalhe com o status trocado (o histórico ganha a linha da mudança). */
export function orderWith(
  status: OrderDetails['status'],
  reason: string | null = null,
): OrderDetails {
  return status === 'pending'
    ? orderDetails
    : {
        ...orderDetails,
        status,
        history: [
          ...orderDetails.history,
          {
            id: 'c2000000-0000-4000-8000-000000000002',
            from_status: 'pending',
            to_status: status,
            changed_by: {
              id: 'u1000000-0000-4000-8000-000000000002',
              name: 'Gil',
            },
            reason,
            created_at: '2026-10-21T10:00:00.000Z',
          },
        ],
      };
}

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

/** Sessão válida + GET /profile com o papel pedido (ADMIN por padrão). */
export function signIn(role: Role = 'ADMIN') {
  const profile = { ...user, role };
  tokenStorage.set(makeToken(inOneHour()));
  server.use(
    http.get('http://api.test/profile', () => HttpResponse.json(profile)),
  );
  return profile;
}
