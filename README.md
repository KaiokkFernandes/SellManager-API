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
│   ├── shared/         @sellmanager/shared  zod schemas, response DTOs and types (no back-end deps)
│   └── config/         @sellmanager/config  shared tsconfig, ESLint and Prettier configs
├── docker-compose.yml  PostgreSQL (dev + test) and Mailpit
├── turbo.json          task pipeline (build, dev, lint, typecheck, tests)
├── pnpm-workspace.yaml workspace packages, overrides and allowed build scripts
└── package.json        private root: only scripts and tooling
```

| Package               | What it is                                                                  | Docs                                                   |
| --------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------ |
| `@sellmanager/api`    | Users, products, customers and orders; JWT auth, OpenAPI at `/docs`         | [apps/api/README.md](apps/api/README.md)               |
| `@sellmanager/web`    | Front-end placeholder that proves the integration with `shared`             | [apps/web/README.md](apps/web/README.md)               |
| `@sellmanager/shared` | Request schemas, response DTOs (`User`, `Product`, `Order`…), enums, errors | [packages/shared/README.md](packages/shared/README.md) |
| `@sellmanager/config` | `tsconfig.*.json`, `createConfig()` for ESLint, Prettier config             | —                                                      |

Dependency graph: `config` ← `shared` ← `api`, `web`. `api` and `web` never import each other.

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
pnpm --filter shared build
```

`turbo run dev --filter=@sellmanager/web...` runs the web app together with everything it depends on.

## Environment variables

Each app has its own `.env.example`, and the variables are documented there.

| App        | File                                             | Variables                                                                                                                                                                                |
| ---------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api` | [`apps/api/.env.example`](apps/api/.env.example) | `NODE_ENV`, `PORT`, `APP_API_URL`, `APP_WEB_URL`, `DB_*`, `JWT_SECRET` (required), `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `CORS_ORIGIN`, `TRUST_PROXY`, `MAIL_*`, `SMTP_*`, `LOG_LEVEL` |
| `apps/web` | [`apps/web/.env.example`](apps/web/.env.example) | `VITE_API_URL`: API base URL. Only `VITE_*` variables reach the browser                                                                                                                  |

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

### Turborepo

[`turbo.json`](turbo.json) defines these tasks:

- **`build`**: depends on `^build`, which builds a package's dependencies first. Outputs go to `dist/**`.
- **`typecheck`**, **`lint`** and **`test:unit`**: also depend on `^build`, because
  `api` and `web` read the compiled types of `shared`.
- **`test:integration`**: never cached, because its result depends on the database.
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
