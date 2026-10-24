# SellManager API — instruções para o Claude

## Fluxo de trabalho (obrigatório)

- **Um commit a cada passo concluído.** Cada etapa (ou sub-etapa) do trabalho vira
  seu próprio commit, para que o dono do projeto acompanhe e controle o que está
  sendo feito. Nunca acumule várias etapas em um commit só.
- Antes de cada commit, rode build e testes (`yarn build` e `yarn test`, quando
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
- Monorepo e front-end ficam para depois: não iniciar sem pedido explícito.
