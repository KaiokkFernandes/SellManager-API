# SellManager

Sales management platform — a REST API, a web front-end and the contracts they share —
organized as a **pnpm + Turborepo monorepo**.

It started as a study project for Clean Architecture in Node.js. The API keeps the domain free
of frameworks; the monorepo adds a single source of truth for request/response contracts that
both the API and the front-end import.

## Repository layout

```
.
├── apps/
│   ├── api/            @sellmanager/api     Express 5 + TypeORM + PostgreSQL REST API
│   └── web/            @sellmanager/web     Vite + React front-end (skeleton only, no screens yet)
├── packages/
│   ├── shared/         @sellmanager/shared      the API contract: zod schemas, DTOs and the route registry
│   ├── api-client/     @sellmanager/api-client  typed client generated from openapi.json
│   └── config/         @sellmanager/config  shared tsconfig, ESLint and Prettier configs
├── docker-compose.yml  PostgreSQL (dev + test) and Mailpit
├── turbo.json          task pipeline (build, dev, lint, typecheck, tests)
├── pnpm-workspace.yaml workspace packages, overrides and allowed build scripts
└── package.json        private root: only scripts and tooling
```

| Package                   | What it is                                                                                   | Docs                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `@sellmanager/api`        | Users, products, customers and orders; JWT auth, OpenAPI at `/docs`                          | [apps/api/README.md](apps/api/README.md)                       |
| `@sellmanager/web`        | Front-end: login, dashboard, customers, products (with images) and orders                    | [apps/web/README.md](apps/web/README.md)                       |
| `@sellmanager/shared`     | The contract: request schemas, response DTOs, error format and the registry of every route   | [packages/shared/README.md](packages/shared/README.md)         |
| `@sellmanager/api-client` | `openapi-fetch` client typed from `apps/api/openapi.json`: JWT, 401 callback, errors, upload | [packages/api-client/README.md](packages/api-client/README.md) |
| `@sellmanager/config`     | `tsconfig.*.json`, `createConfig()` for ESLint, Prettier config                              | —                                                              |

## The API contract

The front-end and the back-end can't drift apart, because both follow one contract:

```
packages/shared  (zod schemas + route registry)
      │  build
      ▼
apps/api         mountRoute: routing, validation and typed replies from the registry
      │  openapi:generate
      ▼
apps/api/openapi.json   (committed; served at /docs)
      │  generate (openapi-typescript)
      ▼
packages/api-client     (typed openapi-fetch client)
      │
      ▼
apps/web
```

Turborepo runs this chain in order and caches each step. Here is what fails when someone
changes the contract and forgets something:

- **TypeScript:** if a response field is renamed in `shared`, the API (`reply`/mappers), the
  api-client and the web all fail to compile.
- **Tests:** in the test environment every API response is checked against its schema, so a
  mismatch makes the request return 500.
- **CI:** `pnpm lint` runs `openapi:check`, and after the build CI runs
  `git diff --exit-code -- apps/api/openapi.json`. Either fails if the committed `openapi.json`
  is out of date.

Two conventions hold across the whole API:

- **Money** is an integer number of cents, in fields ending with `_cents`.
- **Errors** have the shape `{ status, code, message, issues?, details? }`, and `code` is a stable value that clients can rely on.

Dates are ISO 8601 strings, and ids are UUIDs.

Dependency graph: `config` ← `shared` ← `api`, `web`. `api-client` is generated from the API's
`openapi.json`, but it doesn't import `api`. `api` and `web` never import each other.

## Access control (roles and permissions)

Every user has one role. What each role may do is a **map in code**:
[`packages/shared/src/permissions.ts`](packages/shared/src/permissions.ts) (`ROLE_PERMISSIONS`
and `can(role, permission)`). The same map is used everywhere:

- **API**: every authenticated route in the contract declares `permission` (it does not
  compile without one), and `mountRoute` adds `authorize(permission)`. A role without the
  permission gets `403 FORBIDDEN` before validation runs. The role is read from the database
  on every request, so a role change or a deactivated account takes effect immediately.
- **Front-end**: `usePermission('product:delete')` hides menu items and buttons, and each route
  declares the permission it needs. Opening a forbidden URL shows a 403 page.
- **Tests and docs**: the integration test builds the role × route matrix from the map, and
  the table below is generated from it. A unit test fails if this table is out of date
  (`pnpm --filter api docs:permissions` rewrites it).

<!-- permissions:start -->
<!-- prettier-ignore-start -->

| Permission | ADMIN | MANAGER | SELLER | Routes |
| --- | :-: | :-: | :-: | --- |
| `customer:read` | ✅ | ✅ | ✅ | `GET /customers`, `GET /customers/{id}` |
| `customer:create` | ✅ | ✅ | ✅ | `POST /customers` |
| `customer:update` | ✅ | ✅ | — | `PUT /customers/{id}` |
| `customer:delete` | ✅ | ✅ | — | `DELETE /customers/{id}` |
| `product:read` | ✅ | ✅ | ✅ | `GET /products`, `GET /products/{id}`, `GET /categories` |
| `product:create` | ✅ | ✅ | — | `POST /products` |
| `product:update` | ✅ | ✅ | — | `PUT /products/{id}`, `PATCH /products/{id}/image`, `DELETE /products/{id}/image` |
| `product:delete` | ✅ | ✅ | — | `DELETE /products/{id}` |
| `category:create` | ✅ | ✅ | — | `POST /categories` |
| `category:update` | ✅ | ✅ | — | `PUT /categories/{id}` |
| `category:delete` | ✅ | ✅ | — | `DELETE /categories/{id}` |
| `stock:read` | ✅ | ✅ | — | `GET /products/{id}/stock-movements` |
| `stock:adjust` | ✅ | ✅ | — | `POST /products/{id}/stock-movements` |
| `order:read` | ✅ | ✅ | ✅ | `GET /orders`, `GET /orders/{id}` |
| `order:create` | ✅ | ✅ | ✅ | `POST /orders` |
| `order:pay` | ✅ | ✅ | ✅ | `PATCH /orders/{id}/pay` |
| `order:ship` | ✅ | ✅ | — | `PATCH /orders/{id}/ship` |
| `order:deliver` | ✅ | ✅ | — | `PATCH /orders/{id}/deliver` |
| `order:cancel` | ✅ | ✅ | — | `PATCH /orders/{id}/cancel` |
| `report:read` | ✅ | ✅ | — | _reserved_ |
| `user:read` | ✅ | — | — | `GET /users`, `GET /users/{id}` |
| `user:create` | ✅ | — | — | `POST /users` |
| `user:update` | ✅ | — | — | `PUT /users/{id}`, `PATCH /users/{id}/status` |

Any signed-in user: `PATCH /users/avatar`, `GET /profile`, `PUT /profile`, `PUT /profile/password`.

<!-- prettier-ignore-end -->
<!-- permissions:end -->

Rules that are not a permission:

- Users are never deleted, only deactivated. A deactivated user cannot log in
  (`403 ACCOUNT_DISABLED`, and only after the correct password) and their open sessions stop
  working at once.
- An ADMIN cannot change their own role or deactivate themselves, and the last active ADMIN
  can never be demoted or deactivated (`409 CONFLICT`, `details.reason`: `SELF` | `LAST_ADMIN`).
- Changing your own password (`PUT /profile/password`) or resetting it by e-mail ends every
  other session.

**Adding a permission**: add it to `PERMISSIONS` and to the roles in `ROLE_PERMISSIONS`, use it
in the route (`permission: '…'`) and in the UI (`usePermission`), then run
`pnpm openapi:generate` and `pnpm --filter api docs:permissions`.

### Development users

Created by `pnpm --filter api seed`. These are **development values only**: never use them
in a real environment.

| Role    | E-mail                     | Password        |
| ------- | -------------------------- | --------------- |
| ADMIN   | `admin@sellmanager.dev`    | `admin12345`    |
| MANAGER | `gerente@sellmanager.dev`  | `gerente12345`  |
| SELLER  | `vendedor@sellmanager.dev` | `vendedor12345` |

## Requirements

- **Node.js 24** (see `.nvmrc`)
- **pnpm 12**. The exact version is pinned in `packageManager`. Use `corepack enable pnpm`, or
  `npm install -g pnpm`: pnpm switches itself to the pinned version.
- **Docker**, for PostgreSQL and the local mail inbox

## Getting started

```bash
git clone https://github.com/KaiokkFernandes/SellManager-API.git
cd SellManager-API
pnpm install

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# set JWT_SECRET in apps/api/.env to a random value:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

docker compose up -d postgres mailpit
pnpm --filter api migration:run
pnpm --filter api seed   # optional: one user per role + sample data (see below)
pnpm dev
```

`pnpm dev` builds `@sellmanager/shared` once, then runs all of these in parallel:

| URL                        | App                                         |
| -------------------------- | ------------------------------------------- |
| http://localhost:3333      | API (`apps/api`)                            |
| http://localhost:3333/docs | API docs (Swagger UI)                       |
| http://localhost:3000      | Web (`apps/web`)                            |
| http://localhost:8025      | Mailpit: inbox for password-recovery emails |

`shared` also runs in watch mode, so editing a schema rebuilds it, and the API restarts by itself.

### Running a single app

Any script of a package can be run from the root with `--filter` (the scope is optional):

```bash
pnpm --filter api dev            # only the API
pnpm --filter web dev            # only the front-end
pnpm --filter api migration:run  # also migration:revert, migration:create
pnpm --filter api test:integration
pnpm --filter api seed           # development data (idempotent)
pnpm --filter web e2e            # Playwright against the real API (needs the seed)
pnpm --filter shared build
```

`turbo run dev --filter=@sellmanager/web...` runs the web app together with everything it depends on.

API docs (Swagger UI, generated from the contract): http://localhost:3333/docs

## Environment variables

Each app has its own `.env.example`, and the variables are documented there.

| App        | File                                             | Variables                                                                                                                                                                                |
| ---------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api` | [`apps/api/.env.example`](apps/api/.env.example) | `NODE_ENV`, `PORT`, `APP_API_URL`, `APP_WEB_URL`, `DB_*`, `JWT_SECRET` (required), `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `CORS_ORIGIN`, `TRUST_PROXY`, `MAIL_*`, `SMTP_*`, `LOG_LEVEL` |
| `apps/web` | [`apps/web/.env.example`](apps/web/.env.example) | `VITE_API_URL`: `/api` in dev (Vite proxy) or the API URL. Only `VITE_*` variables reach the browser                                                                                     |

- The API checks its variables with zod at startup and refuses to start if one is invalid.
  The full table is in the [API README](apps/api/README.md#environment-variables).
- `apps/api/.env.test` is committed and points to the test database. It is used when `NODE_ENV=test`.
- The defaults line up across apps: the web runs on port 3000, and the API defaults
  `APP_WEB_URL` and `CORS_ORIGIN` to `http://localhost:3000`.

## Scripts (root)

| Script                         | What it does                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `pnpm dev`                     | `turbo run dev`: shared (watch), api and web in parallel                           |
| `pnpm build`                   | Build every package (`shared` first)                                               |
| `pnpm typecheck`               | `tsc --noEmit` in every package                                                    |
| `pnpm lint`                    | ESLint in every package                                                            |
| `pnpm test`                    | Unit and integration tests. Integration needs `docker compose up -d postgres-test` |
| `pnpm test:unit`               | Unit tests only (no database)                                                      |
| `pnpm test:integration`        | API HTTP tests against PostgreSQL (port 5434)                                      |
| `pnpm format` / `format:check` | Prettier at the root and in every package                                          |
| `pnpm openapi:generate`        | Rewrite `apps/api/openapi.json` from the contract (`pnpm build` also does it)      |
| `pnpm openapi:check`           | Fail if `apps/api/openapi.json` is out of date (also part of `pnpm lint`)          |

### Turborepo

[`turbo.json`](turbo.json) defines these tasks:

- **`build`**: depends on `^build`, which builds a package's dependencies first. Outputs go to `dist/**`.
- **`typecheck`**, **`lint`** and **`test:unit`**: also depend on `^build`, because
  `api` and `web` read the compiled types of `shared`.
- **`test:integration`**: never cached, because its result depends on the database.
- **`openapi:generate`** (api) → **`generate`** (api-client): the contract chain. Its outputs
  are `openapi.json` and `src/generated/**`.
- **`openapi:check`**: runs before `lint` in a separate step, so that nothing regenerates the file first.
- **`dev`**: persistent, never cached.

When nothing has changed, Turborepo replays results from its cache. A second `pnpm build`
finishes in milliseconds (`FULL TURBO`). Use `--force` to skip the cache.

## The shared package

`@sellmanager/shared` is built with **tsup** to ESM, CommonJS and `.d.ts`/`.d.cts`. The API
runs as compiled CommonJS in production, and Node doesn't execute TypeScript inside
`node_modules`. Vite uses the ESM build. Rules:

- Only `zod` is allowed as a dependency: no Express, TypeORM or React. `zod` is a
  **peerDependency**, so each app has a single zod instance.
- Response DTOs carry `.meta({ id: 'Product' })`. The API's OpenAPI generator turns that into
  a named component.
- After changing a schema, `pnpm dev` rebuilds it automatically. Otherwise run `pnpm build`.

```ts
import {
  createOrderBodySchema,
  type Order,
  ORDER_STATUSES,
} from '@sellmanager/shared';
```

## How to add or change a route

Example: a `GET /products/{id}/stock` route.

1. **Schemas** (`packages/shared/src/<resource>.ts`): add or adjust the zod schemas for the
   body, query and response.
   - Response DTOs get `.meta({ id: 'Name', example })`.
   - Money goes in `*_cents` fields; dates use `isoDateSchema`; ids use `z.uuid()`.
2. **Registry** (`packages/shared/src/contract/routes.ts`): declare the route with `defineRoute()`.
   Give it `method`, `path` (OpenAPI style, `/products/{id}/stock`), a unique `operationId`, `tags`,
   `auth`, `request` (`params`/`query`/`body`), `responses` (`{ 200: schema }` or `{ 204: null }`)
   and the domain `errors` (`404`, `409`). The 400, 401, 413, 429 and 500 responses are added
   automatically.
3. **Handler** (`apps/api/src/modules/<module>/infra/http/`):
   - In the controller, write a `RouteHandler<Routes['stock']>` that uses `input` (already
     validated) and `reply(200, body)`. The compiler checks `body` against the DTO.
   - Convert the entity in a typed mapper. Use `toCents()` for money.
   - Register the route in `routes/index.ts` with `mount(routes.products.stock, controller.stock)`.
     Extra middlewares, such as multer, go after the handler.
4. **Generate:** run `pnpm openapi:generate`, or `pnpm build`. Commit `apps/api/openapi.json`
   together with the change. `/docs` shows the new route right away.
5. **Use it in the front-end:** `await unwrap(api.GET('/products/{id}/stock', { params: { path: { id } } }))`
   is typed by path, params and response. `pnpm build` regenerates the api-client types.
6. **Tests:** add an integration test in `apps/api/test/integration`. The response check in the
   test environment already validates the body against the contract.

For a breaking change (renaming or removing a field, changing a type), run `pnpm typecheck`.
It lists everything that needs fixing in the API, the api-client and the web.

## Adding a new package

1. Create the folder under `apps/` (an application) or `packages/` (a library). Both are already
   matched by `pnpm-workspace.yaml`.
2. Add a `package.json` named `@sellmanager/<name>`, with `"private": true` and the scripts that
   Turborepo knows about: `build`, `dev`, `typecheck`, `lint`, `test:unit`, `format`, `format:check`.
   A package doesn't need all of them; missing scripts are skipped.
3. Reuse the shared tooling:
   - tsconfig: `"extends": "@sellmanager/config/tsconfig.base.json"`, or the `.node.json` or `.react.json` variant
   - ESLint: in `eslint.config.mjs`, `export default createConfig({ tsconfigRootDir: import.meta.dirname })`
     from `@sellmanager/config/eslint`
   - Prettier: `"prettier": "@sellmanager/config/prettier"` in `package.json`
   - Add `"@sellmanager/config": "workspace:*"` (and `"@sellmanager/shared": "workspace:*"` if
     needed) to the dependencies.
4. Libraries that others import must expose `exports` and a `build` script whose output goes to `dist/`.
   Turborepo then builds them before their dependents.
5. Run `pnpm install` at the root.

## Infrastructure

`docker-compose.yml` (at the root, shared by every app):

| Service         | Port        | Use                                              |
| --------------- | ----------- | ------------------------------------------------ |
| `postgres`      | 5433        | Development database                             |
| `postgres-test` | 5434        | Throwaway database for integration tests (tmpfs) |
| `mailpit`       | 1025 / 8025 | SMTP and web inbox for development emails        |

On every push and pull request, CI (GitHub Actions) installs with pnpm and runs
`lint`, `format:check`, `typecheck`, `build`, `test:unit` and `test:integration` through
Turborepo, against a PostgreSQL service.

## License

MIT
