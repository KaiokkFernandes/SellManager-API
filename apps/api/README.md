# SellManager API (`apps/api`)

> Part of the SellManager monorepo — see the [root README](../../README.md) for setup,
> the workspace layout and how to run everything together.

REST API for sales management — users, products, customers and orders — built with
**Node.js, TypeScript, Express and TypeORM** on **PostgreSQL**.

It is a study project for **Clean Architecture**: the domain has no framework
dependencies, repositories live behind interfaces, and every dependency is wired in a
single composition root.

> Educational project. It follows production practices (validation, transactions,
> rate limiting, tests, CI), but it was not built or audited for production use.

## Features

- **Authentication** with JWT (HS256, with expiration), bcrypt password hashing, and generic
  login errors so the API doesn't reveal which emails exist
- **Users and roles:** ADMIN creates users with a role (ADMIN, MANAGER, SELLER); profile
  view/update (changing the password requires the current one), avatar upload (jpeg/png/webp,
  max 2 MB)
- **Password recovery** by email. The token is random, single-use, expires in 2 hours and is
  stored only as a SHA-256 hash
- **Products** with categories and minimum stock, plus a low-stock list
- **Customers** CRUD
- **Orders** with a state machine (`pending → paid → shipped → delivered`, cancel from
  `pending`/`paid` with a reason) validated in the domain, and a status history. Creating an
  order runs in a **transaction** that locks the products, checks stock, copies the current
  price, computes the total in cents and takes the stock. Canceling returns it. Concurrent
  orders cannot oversell
- **Stock ledger:** every stock change is a movement (initial, entry, sale, cancel return,
  manual adjustment); the balance always equals their sum. Rules and diagram in the
  [root README](../../README.md#orders-and-stock)
- **Sales metrics and CSV reports**: one definition of a sale (paid and not canceled, on the
  payment date, in the business time zone), aggregated in SQL; CSV streamed from a cursor and
  ready for Excel in Portuguese. Definitions in the
  [root README](../../README.md#sales-metrics-and-reports)
- **Pagination** on every list (`?page=&limit=`)
- **One contract** in [`@sellmanager/shared`](../../packages/shared): routing, input validation,
  response checks and the committed `openapi.json` all come from it
- **OpenAPI 3.1 docs** at `/docs`, with examples, auth and error responses
- **Money in integer cents** (`price_cents`, `total_cents`) and a standard error format with a
  stable `code`
- **Security:** helmet, CORS allow-list, rate limiting on auth routes, and structured logs
  (pino) that redact tokens and passwords

## Tech stack

| Area       | Choice                                                     |
| ---------- | ---------------------------------------------------------- |
| Runtime    | Node.js 24 LTS                                             |
| Language   | TypeScript 6 (strict)                                      |
| HTTP       | Express 5, helmet, cors, express-rate-limit, multer 2      |
| Database   | PostgreSQL 18 + TypeORM 1.x (`DataSource`, `EntitySchema`) |
| Validation | zod 4                                                      |
| Auth       | jose (JWT), bcryptjs                                       |
| Email      | nodemailer (SMTP or Ethereal) + Handlebars templates       |
| Docs       | zod-to-openapi → `openapi.json` + swagger-ui-express       |
| Logs       | pino, pino-http                                            |
| Tests      | Vitest + supertest                                         |
| Quality    | ESLint 10 (typescript-eslint, type-checked), Prettier      |
| Dev & CI   | tsx, Docker Compose, GitHub Actions                        |

## Architecture

```
src/
├── config/                 env validation (zod), upload settings
├── modules/
│   └── <module>/           users | products | customers | orders
│       ├── domain/         entities (plain interfaces) and repository interfaces
│       ├── services/       use cases; receive dependencies through the constructor
│       ├── fakes/          in-memory repositories for unit tests
│       └── infra/
│           ├── typeorm/    EntitySchema mappings and repository implementations
│           └── http/       typed handlers (controllers), mappers, route registration
└── shared/
    ├── container/          composition root: the only place that knows concrete classes
    ├── domain/             pagination types
    ├── errors/             AppError
    ├── http/               app factory, server, middlewares, contract/ (mountRoute, OpenAPI)
    ├── infra/typeorm/      DataSource and migrations
    └── providers/          Hash, Token, Mail, MailTemplate and Storage (interface + impl + fake)
test/integration/           HTTP tests against a real PostgreSQL
scripts/generate-openapi.ts writes openapi.json from the contract
```

### The contract

Every route is declared once, in `routes` from
[`@sellmanager/shared`](../../packages/shared). Each declaration holds the method, path, auth,
rate limit, input schemas, response schemas and domain errors. The API never repeats any of that:

- **`mountRoute`** (`src/shared/http/contract/mountRoute.ts`) registers the Express route, the
  rate limiter, auth and input validation directly from the declaration.
- **Handlers** are `RouteHandler<typeof routes.products.show>`. Their `input` is already validated
  and typed, and `reply(status, body)` only accepts the DTO that the contract declares for that
  status. Renaming a field in the contract breaks this compilation.
- **Response checks:** every response is compared against its schema. In tests a mismatch becomes
  a 500 and the test fails. In development the mismatch is logged. Production skips the check.
  Fields that the contract doesn't declare count as a mismatch, so a leaked password hash
  would be caught.
- **`openapi.json`** is generated from the contract and committed, and `/docs` serves it.

Dependencies point inward: `infra → services → domain`. Services depend only on interfaces
(`IUsersRepository`, `IHashProvider`, `IOrdersUnitOfWork`…). `makeContainer(dataSource)`
builds the concrete implementations, and `createApp(container)` builds the Express app.
Integration tests use the same app factory with a fake mail provider.

## Getting started

### Running

From the repository root (see the [root README](../../README.md#getting-started)):

```bash
cp apps/api/.env.example apps/api/.env      # then set JWT_SECRET
docker compose up -d postgres mailpit
pnpm --filter api migration:run
pnpm --filter api seed                      # optional: dev data (see below)
pnpm dev                                    # api + web; or: pnpm --filter api dev
```

### Development seed

`pnpm --filter api seed` fills the **development** database so pagination, search and filters
can be tried for real: one user per role (ADMIN, MANAGER and SELLER, credentials in the
[root README](../../README.md#development-users)), 30 customers, 11 categories, 50 products
with a minimum stock (several below it) and **12 months of sales** (≈2,200 orders: more on
weekdays and in November/December, a growing trend, repeat customers, all three roles
selling). Old orders are mostly delivered, ≈8% are canceled (from pending and from paid), and
recent ones are still in progress. Stock is restocked before it runs out, and orders, history
and stock movements share the same dates. It takes about 40 seconds.

- It goes through the services, so stock, prices and totals follow the same rules as the API.
- It is idempotent: it only removes what it created itself (customers `@seed.sellmanager.dev`,
  their orders and stock movements, and the seed products and categories not used elsewhere),
  then creates them again.
- It refuses to run with `NODE_ENV=production`.

| URL                        | What                                           |
| -------------------------- | ---------------------------------------------- |
| http://localhost:3333      | API                                            |
| http://localhost:3333/docs | Swagger UI (`/docs.json` for the raw document) |
| http://localhost:8025      | Mailpit: inbox for password-recovery emails    |

The Docker PostgreSQL listens on port **5433**, so it won't clash with a local install on 5432.
`.env` and `.env.test` are read from `apps/api/` no matter where the command runs from.

### Environment variables

The app checks every variable at startup and refuses to start if one is invalid. All
variables are listed with comments in [`.env.example`](.env.example).

| Variable                                                              | Default                                           | Notes                                             |
| --------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| `NODE_ENV`                                                            | `development`                                     | `development` \| `test` \| `production`           |
| `PORT`                                                                | `3333`                                            |                                                   |
| `APP_API_URL`                                                         | `http://localhost:3333`                           | Used to build `avatar_url` and docs server        |
| `APP_WEB_URL`                                                         | `http://localhost:3000`                           | Front-end URL used in the recovery link           |
| `BUSINESS_TIMEZONE`                                                   | `America/Sao_Paulo`                               | IANA zone of the metrics: what "one day" means    |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`         | Docker values                                     | PostgreSQL connection                             |
| `JWT_SECRET`                                                          | —                                                 | **Required**, at least 32 characters              |
| `JWT_EXPIRES_IN`                                                      | `2h`                                              |                                                   |
| `BCRYPT_SALT_ROUNDS`                                                  | `12`                                              | 10–15                                             |
| `CORS_ORIGIN`                                                         | `http://localhost:3000`                           | Comma-separated; `*` allows any origin            |
| `TRUST_PROXY`                                                         | `0`                                               | Number of reverse proxies in front                |
| `MAIL_DRIVER`                                                         | `ethereal`                                        | `smtp` (Mailpit in `.env.example`) or `ethereal`  |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | — / `587` / `false`                               | `SMTP_HOST` is required with `smtp`               |
| `MAIL_FROM_NAME` / `MAIL_FROM_EMAIL`                                  | `Equipe SellManager` / `no-reply@sellmanager.dev` | Sender                                            |
| `LOG_LEVEL`                                                           | by `NODE_ENV`                                     | `debug` in dev, `info` in prod, `silent` in tests |

## Scripts

Run them inside `apps/api`, or from the root with `pnpm --filter api <script>`.

| Script                                                           | Description                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------ |
| `pnpm dev`                                                       | Start in watch mode (tsx)                              |
| `pnpm build` / `pnpm start`                                      | Compile to `dist/` and run the compiled app            |
| `pnpm typecheck`                                                 | Type-check without emitting                            |
| `pnpm lint` / `pnpm lint:fix`                                    | ESLint                                                 |
| `pnpm format` / `pnpm format:check`                              | Prettier                                               |
| `pnpm test`                                                      | Run all tests (unit + integration)                     |
| `pnpm test:unit` / `pnpm test:watch`                             | Unit tests only; no database needed                    |
| `pnpm test:integration`                                          | HTTP tests; needs `docker compose up -d postgres-test` |
| `pnpm test:coverage`                                             | Run tests with coverage                                |
| `pnpm migration:run` / `migration:revert`                        | Apply or revert migrations (dev)                       |
| `pnpm migration:create src/shared/infra/typeorm/migrations/Name` | New empty migration (register it in `data-source.ts`)  |
| `pnpm migration:run:prod`                                        | Apply migrations from the compiled `dist/`             |
| `pnpm seed`                                                      | Development data (idempotent, never in production)     |
| `pnpm create-admin` / `create-admin:prod`                        | Create the first ADMIN (installation; see below)       |
| `pnpm openapi:generate`                                          | Write `openapi.json` from the contract                 |
| `pnpm openapi:check`                                             | Fail if `openapi.json` is out of date                  |

## API overview

All bodies are JSON. Full schemas and examples are at **`/docs`**. 🔒 means the route requires
`Authorization: Bearer <token>`.

| Method | Path                            | Auth | Description                                            |
| ------ | ------------------------------- | :--: | ------------------------------------------------------ |
| POST   | `/users`                        |  🔒  | Create a user with role and initial password (ADMIN)   |
| GET    | `/users`                        |  🔒  | List users (`?q=&role=&status=`, ADMIN)                |
| GET    | `/users/:id`                    |  🔒  | Get a user (ADMIN)                                     |
| PUT    | `/users/:id`                    |  🔒  | Change name and role (ADMIN)                           |
| PATCH  | `/users/:id/status`             |  🔒  | Activate / deactivate (ADMIN; users are never deleted) |
| PATCH  | `/users/avatar`                 |  🔒  | Upload avatar (`multipart/form-data`, field `avatar`)  |
| POST   | `/sessions`                     |      | Log in, returns `{ user, token }`                      |
| GET    | `/profile`                      |  🔒  | Current user's profile (with `role`)                   |
| PUT    | `/profile`                      |  🔒  | Change your own name                                   |
| PUT    | `/profile/password`             |  🔒  | Change your password (needs the current one)           |
| POST   | `/password/forgot`              |      | Send recovery email (always `204`)                     |
| POST   | `/password/reset`               |      | Reset password with the emailed token                  |
| GET    | `/products`                     |  🔒  | List products (`?q=&category_id=&sort=&order=`)        |
| GET    | `/products/low-stock`           |  🔒  | Products below their minimum stock                     |
| GET    | `/products/:id`                 |  🔒  | Get a product                                          |
| POST   | `/products`                     |  🔒  | Create a product (`quantity` = initial stock)          |
| PUT    | `/products/:id`                 |  🔒  | Update name, price, category, minimum (not stock)      |
| DELETE | `/products/:id`                 |  🔒  | Delete a product (`409` if it is in orders)            |
| GET    | `/products/:id/stock-movements` |  🔒  | Stock movements, newest first                          |
| POST   | `/products/:id/stock-movements` |  🔒  | Stock entry or manual adjustment (reason required)     |
| PATCH  | `/products/:id/image`           |  🔒  | Upload/replace the image (`multipart`, field `image`)  |
| DELETE | `/products/:id/image`           |  🔒  | Remove the image                                       |
| GET    | `/categories`                   |  🔒  | List categories (with `products_count`)                |
| POST   | `/categories`                   |  🔒  | Create a category                                      |
| PUT    | `/categories/:id`               |  🔒  | Rename a category                                      |
| DELETE | `/categories/:id`               |  🔒  | Delete a category (`409` if it has products)           |
| GET    | `/customers`                    |  🔒  | List customers (`?q=&sort=&order=`, paginated)         |
| GET    | `/customers/:id`                |  🔒  | Get a customer                                         |
| POST   | `/customers`                    |  🔒  | Create a customer                                      |
| PUT    | `/customers/:id`                |  🔒  | Update a customer                                      |
| DELETE | `/customers/:id`                |  🔒  | Delete a customer (`409` if they have orders)          |
| GET    | `/orders`                       |  🔒  | List orders (`?status=&customer_id=&from=&to=`)        |
| GET    | `/orders/:id`                   |  🔒  | Get an order with items and status history             |
| POST   | `/orders`                       |  🔒  | Create an order (takes the stock)                      |
| PATCH  | `/orders/:id/pay`               |  🔒  | `pending → paid`                                       |
| PATCH  | `/orders/:id/ship`              |  🔒  | `paid → shipped`                                       |
| PATCH  | `/orders/:id/deliver`           |  🔒  | `shipped → delivered`                                  |
| PATCH  | `/orders/:id/cancel`            |  🔒  | Cancel a pending/paid order (`{ reason }`, stock back) |

`/sessions` and `/password/*` are rate limited to 20 requests per 15 minutes per IP.

🔒 routes also need a **permission** for the user's role (ADMIN, MANAGER or SELLER). Without
it the answer is `403 FORBIDDEN` with `details.permission`. The matrix is in the
[root README](../../README.md#access-control-roles-and-permissions), and `/docs` shows the
permission on each operation. There is no public sign-up: an ADMIN creates users.

**Listing options**

- `q`: partial, case-insensitive search (customers: name or e-mail; products: name). `%` and
  `_` are literal characters, not wildcards.
- `sort` + `order` (`asc` | `desc`): customers by `name`, `email` or `created_at`; products by
  `name`, `price`, `quantity` or `created_at`. Default: `name` ascending.
- Orders: `status`, `customer_id`, `from` (inclusive) and `to` (exclusive), as ISO 8601 instants with a
  time zone offset, e.g. `from=2026-10-01T00:00:00-03:00`. The client decides where the day
  starts. `to` must be after `from` (`400` otherwise). Newest orders come first.

**Images**: jpeg, png or webp up to 2 MB, for avatars and products. The limits live in
`IMAGE_UPLOAD` in `@sellmanager/shared`, and the front-end validates with the same values.
Replacing an image deletes the previous file, and so does deleting the product. Files are
served from `/files/<name>`, and responses carry the full URL in `avatar_url` / `image_url`.

**Business rules**

- Product names are unique without regard to case ("Cabo" and "cabo" clash). Customer e-mails
  are stored trimmed and in lower case.
- Customers with orders, and products that appear in orders, cannot be deleted (`409
RESOURCE_IN_USE` with `details.orders_count`). Orders are sales history.
- Order transitions follow the state machine; anything else is `409 INVALID_TRANSITION`
  with `details.allowed_actions`. See the [root README](../../README.md#orders-and-stock).
- Stock only changes through movements; a change that would make it negative is
  `409 INSUFFICIENT_STOCK`.
- The price of an order item is the product's price at the moment of purchase. Changing the
  product later does not change past orders. The item also carries `product: { id, name }`,
  with the current name.

### Example: placing an order

```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": "6e2ba4c6-96f5-4d7f-9303-6f6b91a1a960",
  "products": [{ "id": "5c301fd4-233e-4eac-bb22-994b162e70d2", "quantity": 2 }]
}
```

```json
{
  "id": "…",
  "customer_id": "6e2ba4c6-96f5-4d7f-9303-6f6b91a1a960",
  "customer": {
    "id": "6e2ba4c6-…",
    "name": "Ana Souza",
    "email": "ana@example.com"
  },
  "status": "pending",
  "total_cents": 39980,
  "items": [
    {
      "id": "…",
      "order_id": "…",
      "product_id": "5c301fd4-…",
      "product": { "id": "5c301fd4-…", "name": "Teclado mecânico" },
      "price_cents": 19990,
      "quantity": 2
    }
  ],
  "created_at": "…",
  "updated_at": "…"
}
```

The client never sends prices: they are copied from the product when the order is placed.

**Money** is always an integer number of cents, in fields ending with `_cents`. For example,
R$ 199,90 is `19990`. That includes `price_cents` in the product body. Divide by 100 only for display.

### Responses

Lists return `{ "data": [...], "meta": { "page", "limit", "total", "total_pages" } }`.
Errors always have the same shape:
`{ status: 'error', code, message, issues?, details? }`.

```json
{
  "status": "error",
  "code": "VALIDATION_FAILED",
  "message": "Validation failed",
  "issues": [
    { "segment": "body", "path": "email", "message": "Invalid email address" }
  ]
}
```

- `code` is stable: clients branch on it, not on `message`. The codes are `VALIDATION_FAILED`,
  `BAD_REQUEST`, `INVALID_UPLOAD`, `UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`, `ALREADY_EXISTS`,
  `INSUFFICIENT_STOCK`, `RESOURCE_IN_USE`, `PAYLOAD_TOO_LARGE`, `RATE_LIMITED` and `INTERNAL_ERROR`.
- `issues` appears on `VALIDATION_FAILED` (one entry per invalid field) and on `ALREADY_EXISTS`
  (the unique field in conflict, e.g. `{ segment: 'body', path: 'email' }`), so a form can mark
  the field.
- `details` carries domain data: `[{ product_id, available, requested }]` on `INSUFFICIENT_STOCK`,
  `{ product_ids }` on a `NOT_FOUND` for missing products, `{ orders_count }` on `RESOURCE_IN_USE`.

| Case                                      | Status / `code`                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| Duplicate customer e-mail or product name | `409 ALREADY_EXISTS` + `issues` with the field (also on concurrent requests) |
| Delete a customer/product that has orders | `409 RESOURCE_IN_USE` + `details.orders_count`                               |
| Order with more than the stock            | `409 INSUFFICIENT_STOCK` + `details` per product; nothing is changed         |
| Order with a missing customer / product   | `404 NOT_FOUND` (+ `details.product_ids`)                                    |
| Status change from a finished order       | `409 CONFLICT`                                                               |

| Status | When                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------- |
| 400    | Invalid input, malformed JSON, invalid upload, invalid/expired reset token                         |
| 413    | JSON body over 100 KB                                                                              |
| 401    | Missing/invalid token or wrong credentials                                                         |
| 404    | Resource or route not found                                                                        |
| 409    | Email/name already in use, insufficient stock, invalid status change, deleting a referenced record |
| 429    | Rate limit exceeded                                                                                |
| 500    | Unexpected error                                                                                   |

## Tests

```bash
pnpm test:unit                         # services with fake repositories (no database)

docker compose up -d postgres-test     # throwaway database on port 5434
pnpm test:integration                  # HTTP tests with supertest against PostgreSQL
```

The integration setup drops and re-creates the `sellmanager_test` schema before running
migrations. It refuses to run against any other database. One test sends concurrent orders
for the same product to check that stock is never oversold.

CI (GitHub Actions) runs lint, format check, type-check, build, and the unit and
integration tests on every push and pull request.

## Production build

```bash
pnpm build          # from the root: builds @sellmanager/shared first (Turborepo)
NODE_ENV=production pnpm --filter api migration:run:prod
NODE_ENV=production pnpm --filter api create-admin:prod   # first install only
NODE_ENV=production pnpm --filter api start
```

**First ADMIN.** There is no public sign-up and the seed refuses to run in production, so a new
database starts with nobody able to log in. `create-admin:prod` creates the first ADMIN, who
then adds everyone else under Usuários. It reads `ADMIN_NAME`, `ADMIN_EMAIL` and
`ADMIN_PASSWORD`, asks in the terminal for whatever is missing (the password is not echoed),
and applies the same validation as the API. The password is never a command-line argument,
because that would end up in the shell history and in the process list. In a pipeline, pass
the variables from your secret store and remove them afterwards.

It only acts when there is no active ADMIN. Otherwise it changes nothing and exits with 0, so
it is safe to leave in a deploy script. An e-mail that already belongs to another user is
refused (exit 1) and that account is not promoted. With only deactivated ADMINs it creates a new
one, which also recovers a store locked out of its admin accounts.

In production, use `MAIL_DRIVER=smtp` with a real provider. Set `CORS_ORIGIN` to the
front-end origin and `TRUST_PROXY` if the app runs behind a proxy. Uploaded avatars are
stored on local disk (`apps/api/tmp/uploads`), so mount a persistent volume or replace the
`IStorageProvider` implementation.

## License

MIT
