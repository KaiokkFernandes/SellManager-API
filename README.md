# SellManager API

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
- **Users:** sign-up, profile view/update (changing the password requires the old one),
  avatar upload (jpeg/png/webp, max 2 MB)
- **Password recovery** by email. The token is random, single-use, expires in 2 hours and is
  stored only as a SHA-256 hash
- **Products** with public read access; changing them requires authentication
- **Customers** CRUD
- **Orders.** Creating an order runs in a **transaction** that locks the products,
  checks stock, copies the current price, computes the total in cents and decrements stock.
  Canceling an order restores the stock. Concurrent orders cannot oversell
- **Pagination** on every list (`?page=&limit=`)
- **Validation** of body, params and query with zod
- **OpenAPI 3.1 docs** at `/docs`, generated from the same zod schemas
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
| Docs       | zod-to-openapi + swagger-ui-express                        |
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
│           └── http/       controllers, routes, zod schemas, OpenAPI docs
└── shared/
    ├── container/          composition root: the only place that knows concrete classes
    ├── domain/             pagination types
    ├── errors/             AppError
    ├── http/               app factory, server, middlewares, OpenAPI document
    ├── infra/typeorm/      DataSource and migrations
    └── providers/          Hash, Token, Mail, MailTemplate and Storage (interface + impl + fake)
test/integration/           HTTP tests against a real PostgreSQL
```

Dependencies point inward: `infra → services → domain`. Services depend only on interfaces
(`IUsersRepository`, `IHashProvider`, `IOrdersUnitOfWork`…). `makeContainer(dataSource)`
builds the concrete implementations, and `createApp(container)` builds the Express app.
Integration tests use the same app factory with a fake mail provider.

## Getting started

### Requirements

- Node.js 24 (`.nvmrc`)
- pnpm 12 (version pinned in `packageManager`)
- Docker (for PostgreSQL and the local mail inbox)

### Setup

```bash
git clone https://github.com/KaiokkFernandes/SellManager-API.git
cd SellManager-API
pnpm install

cp .env.example .env
# set JWT_SECRET to a random value:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

docker compose up -d postgres mailpit
pnpm migration:run
pnpm dev
```

| URL                        | What                                           |
| -------------------------- | ---------------------------------------------- |
| http://localhost:3333      | API                                            |
| http://localhost:3333/docs | Swagger UI (`/docs.json` for the raw document) |
| http://localhost:8025      | Mailpit: inbox for password-recovery emails    |

The Docker PostgreSQL listens on port **5433**, so it won't clash with a local install on 5432.

### Environment variables

The app checks every variable at startup and refuses to start if one is invalid. All
variables are listed with comments in [`.env.example`](.env.example).

| Variable                                                              | Default                                           | Notes                                             |
| --------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| `NODE_ENV`                                                            | `development`                                     | `development` \| `test` \| `production`           |
| `PORT`                                                                | `3333`                                            |                                                   |
| `APP_API_URL`                                                         | `http://localhost:3333`                           | Used to build `avatar_url` and docs server        |
| `APP_WEB_URL`                                                         | `http://localhost:3000`                           | Front-end URL used in the recovery link           |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`         | Docker values                                     | PostgreSQL connection                             |
| `JWT_SECRET`                                                          | —                                                 | **Required**, at least 32 characters              |
| `JWT_EXPIRES_IN`                                                      | `1d`                                              |                                                   |
| `BCRYPT_SALT_ROUNDS`                                                  | `12`                                              | 10–15                                             |
| `CORS_ORIGIN`                                                         | `http://localhost:3000`                           | Comma-separated; `*` allows any origin            |
| `TRUST_PROXY`                                                         | `0`                                               | Number of reverse proxies in front                |
| `MAIL_DRIVER`                                                         | `ethereal`                                        | `smtp` (Mailpit in `.env.example`) or `ethereal`  |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | — / `587` / `false`                               | `SMTP_HOST` is required with `smtp`               |
| `MAIL_FROM_NAME` / `MAIL_FROM_EMAIL`                                  | `Equipe SellManager` / `no-reply@sellmanager.dev` | Sender                                            |
| `LOG_LEVEL`                                                           | by `NODE_ENV`                                     | `debug` in dev, `info` in prod, `silent` in tests |

## Scripts

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
| `pnpm migration:create src/shared/infra/typeorm/migrations/Name` | New empty migration                                    |
| `pnpm migration:run:prod`                                        | Apply migrations from the compiled `dist/`             |

## API overview

All bodies are JSON. Full schemas and examples are at **`/docs`**. 🔒 means the route requires
`Authorization: Bearer <token>`.

| Method | Path                 | Auth | Description                                           |
| ------ | -------------------- | :--: | ----------------------------------------------------- |
| POST   | `/users`             |      | Sign up                                               |
| GET    | `/users`             |  🔒  | List users (paginated)                                |
| PATCH  | `/users/avatar`      |  🔒  | Upload avatar (`multipart/form-data`, field `avatar`) |
| POST   | `/sessions`          |      | Log in, returns `{ user, token }`                     |
| GET    | `/profile`           |  🔒  | Current user's profile                                |
| PUT    | `/profile`           |  🔒  | Update profile / change password                      |
| POST   | `/password/forgot`   |      | Send recovery email (always `204`)                    |
| POST   | `/password/reset`    |      | Reset password with the emailed token                 |
| GET    | `/products`          |      | List products (paginated)                             |
| GET    | `/products/:id`      |      | Get a product                                         |
| POST   | `/products`          |  🔒  | Create a product                                      |
| PUT    | `/products/:id`      |  🔒  | Update a product                                      |
| DELETE | `/products/:id`      |  🔒  | Delete a product (`409` if it has orders)             |
| GET    | `/customers`         |  🔒  | List customers (paginated)                            |
| GET    | `/customers/:id`     |  🔒  | Get a customer                                        |
| POST   | `/customers`         |  🔒  | Create a customer                                     |
| PUT    | `/customers/:id`     |  🔒  | Update a customer                                     |
| DELETE | `/customers/:id`     |  🔒  | Delete a customer (`409` if they have orders)         |
| GET    | `/orders`            |  🔒  | List orders (paginated, `?customer_id=`)              |
| GET    | `/orders/:id`        |  🔒  | Get an order with its items                           |
| POST   | `/orders`            |  🔒  | Create an order                                       |
| PATCH  | `/orders/:id/status` |  🔒  | Change status: `pending → completed \| canceled`      |

`/sessions`, `/password/*` and `POST /users` are rate limited to 20 requests per 15 minutes per IP.

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
  "status": "pending",
  "total": 399.8,
  "items": [
    {
      "id": "…",
      "order_id": "…",
      "product_id": "5c301fd4-…",
      "price": 199.9,
      "quantity": 2
    }
  ],
  "created_at": "…",
  "updated_at": "…"
}
```

The client never sends prices: they are copied from the product when the order is placed.

### Responses

Lists return `{ "data": [...], "meta": { "page", "limit", "total", "total_pages" } }`.
Errors always have the same shape:

```json
{
  "status": "error",
  "message": "Validation failed",
  "details": [
    { "segment": "body", "path": "email", "message": "Invalid email address" }
  ]
}
```

| Status | When                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------- |
| 400    | Invalid input, malformed JSON, invalid upload, invalid/expired reset token                         |
| 401    | Missing/invalid token or wrong credentials                                                         |
| 404    | Resource or route not found                                                                        |
| 409    | Email/name already in use, insufficient stock, invalid status change, deleting a referenced record |
| 429    | Rate limit exceeded                                                                                |

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
pnpm build
NODE_ENV=production yarn migration:run:prod
NODE_ENV=production yarn start
```

In production, use `MAIL_DRIVER=smtp` with a real provider. Set `CORS_ORIGIN` to the
front-end origin and `TRUST_PROXY` if the app runs behind a proxy. Uploaded avatars are
stored on local disk (`tmp/uploads`), so mount a persistent volume or replace the
`IStorageProvider` implementation.

## License

MIT
