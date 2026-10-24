# SellManager API — instruções para o Claude

## Fluxo de trabalho (obrigatório)

- **Um commit a cada passo concluído.** Cada etapa (ou sub-etapa) do trabalho vira
  seu próprio commit, para que o dono do projeto acompanhe e controle o que está
  sendo feito. Nunca acumule várias etapas em um commit só.
- Antes de cada commit, rode build e testes (`pnpm build` e `pnpm test`, quando
  existirem) e mostre o resultado. O projeto deve continuar compilando e
  funcionando ao fim de cada passo.
- Mensagens de commit claras, em português, no formato `tipo: descrição`
  (ex.: `fix: corrige leitura do sub do JWT no middleware de autenticação`).
- As correções e a modernização do back-end são feitas na branch
  `modernize-backend`, nunca direto na `main`.

## Diretrizes técnicas

- Node LTS atual, TypeScript estrito, TypeORM com `DataSource`, PostgreSQL via
  docker-compose.
- Validação de entrada com zod.
- Clean Architecture: domínio sem dependência de framework, repositórios atrás de
  interfaces, injeção de dependência manual.
- Testes: unitários para os services (repositórios fake) e de integração das
  rotas principais (supertest).
- ESLint + Prettier, `.env.example`, documentação OpenAPI em `/docs`.
- O front-end (apps/web) é só um esqueleto: não criar telas sem pedido explícito.

## Comandos (rodar na raiz do monorepo)

- Banco e e-mail locais: `docker compose up -d postgres postgres-test mailpit`
- `pnpm dev` (shared em watch + api + web), `pnpm build`, `pnpm typecheck`,
  `pnpm lint`, `pnpm format:check` (todos via Turborepo)
- `pnpm test:unit` (sem banco) e `pnpm test:integration` (postgres-test, porta 5434)
- Um app só: `pnpm --filter api <script>` / `pnpm --filter web <script>`
- Migrations: `pnpm --filter api migration:run` / `migration:revert`; novas migrations
  precisam ser registradas em `apps/api/src/shared/infra/typeorm/data-source.ts`

## Estrutura

- Monorepo pnpm + Turborepo: `apps/api` (Express + TypeORM), `apps/web` (Vite +
  React), `packages/shared` (schemas zod e DTOs; só zod como dependência) e
  `packages/config` (tsconfig, ESLint, Prettier).
- Schemas de entrada e DTOs de resposta ficam em `@sellmanager/shared`; a api não
  define schemas de validação localmente.
- Cada módulo da api (`apps/api/src/modules/<m>`) tem `domain/` (interfaces puras),
  `services/` (casos de uso), `fakes/` (repositórios em memória) e `infra/{typeorm,http}`.
- Implementações concretas só são instanciadas em `apps/api/src/shared/container`.
- Entidades TypeORM via `EntitySchema` (sem decorators).
