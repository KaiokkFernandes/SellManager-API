# @sellmanager/api-client

Typed client for the SellManager API. Its types are **generated from
[`apps/api/openapi.json`](../../apps/api/openapi.json)** with
[`openapi-typescript`](https://openapi-ts.dev), and requests go through
[`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/), which adds about 6 KB.

```ts
import {
  createApiClient,
  unwrap,
  ApiClientError,
} from '@sellmanager/api-client';

const api = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('token'),
  onUnauthorized: () => logout(), // 401 on an authenticated request
});

const session = await unwrap(
  api.POST('/sessions', { body: { email, password } }),
);
const page = await unwrap(
  api.GET('/products', { params: { query: { limit: 10 } } }),
);
const product = await unwrap(
  api.GET('/products/{id}', { params: { path: { id } } }),
);
await api.uploadAvatar(file); // multipart/form-data

try {
  await unwrap(api.POST('/orders', { body }));
} catch (error) {
  if (error instanceof ApiClientError && error.code === 'INSUFFICIENT_STOCK') {
    // error.details: [{ product_id, available, requested }]
  }
}
```

| Export                                             | What it does                                                                                             |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `createApiClient(options)`                         | `openapi-fetch` client with `baseUrl`, JWT injection and an `onUnauthorized` callback                    |
| `unwrap(request)`                                  | Returns `data`, or throws `ApiClientError`. Returns `undefined` for 204                                  |
| `ApiClientError`                                   | `status`, `code`, `message`, `issues`, `details` and `fieldErrors`. Network failures get `NETWORK_ERROR` |
| `client.uploadAvatar(file)`                        | Avatar upload as multipart. The generator types binary bodies as `string`, so this helper exists         |
| `paths`, `components`, `User`, `Product`, `Order`… | Generated types                                                                                          |

`onUnauthorized` runs only when a request **with a token** gets a 401. A failed login with a
wrong password doesn't trigger it.

There are no wrapper functions per resource. `client.GET('/products/{id}')` is already typed by
path, params and response, so wrappers would only duplicate the contract.

## Scripts

| Script                             | Description                                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| `generate`                         | `openapi.json` → `src/generated/openapi.ts`. Not committed; Turborepo generates and caches it |
| `build` / `dev`                    | tsup (ESM + CJS + types)                                                                      |
| `typecheck` / `lint` / `test:unit` | Checks and unit tests (with a fake `fetch`)                                                   |

Turborepo runs `generate` after `@sellmanager/api#openapi:generate`, so `pnpm build` at the
root is enough.
