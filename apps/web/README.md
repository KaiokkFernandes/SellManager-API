# @sellmanager/web

Front-end do SellManager: React 19 + Vite + TypeScript estrito. Esta etapa entrega a
**fundação** (login, layout, roteamento, componentes reutilizáveis e testes). As telas de
CRUD de clientes, produtos e pedidos são placeholders.

## Como rodar

```bash
docker compose up -d postgres mailpit   # na raiz
pnpm dev                                # api (3333) + web (3000)
```

Abra http://localhost:3000. Em dev o front chama `/api/...` e o proxy do Vite encaminha
para a API (sem CORS). Cadastre um usuário pelo Swagger (`/docs`) ou com
`POST /users` e entre pela tela de login.

| Script                                 | O que faz                           |
| -------------------------------------- | ----------------------------------- |
| `pnpm --filter web dev`                | Vite em modo desenvolvimento        |
| `pnpm --filter web build`              | build de produção                   |
| `pnpm --filter web test`               | Vitest + Testing Library + MSW      |
| `pnpm --filter web lint` / `typecheck` | ESLint (hooks, a11y, camadas) / tsc |

### Variáveis de ambiente

Validadas com zod em [`src/lib/env.ts`](src/lib/env.ts); se faltar ou for inválida, o app
falha ao iniciar com uma mensagem clara. Veja [`.env.example`](.env.example).

| Variável           | Descrição                                                  |
| ------------------ | ---------------------------------------------------------- |
| `VITE_API_URL`     | `/api` em dev (proxy) ou a URL absoluta da API em produção |
| `API_PROXY_TARGET` | só dev: destino do proxy (padrão `http://localhost:3333`)  |

## Estrutura e regra de dependência

```
src/
  app/          composition root: Providers, router, App, queryClient
  features/     um diretório por domínio: auth, dashboard, customers, products, orders
  components/   ui/ (base, estilo shadcn), form/, data-table/, confirm-dialog/, layout/, feedback/
  lib/          api client, tokenStorage, env, formatadores, erros da API, query keys, tema
  test/         setup do Vitest, servidor MSW, fixtures tipados, renderApp
```

```
app  ->  features  ->  components  ->  lib
```

Camadas internas nunca importam das externas, e uma feature não importa de outra (exceto
`auth`, que é transversal). Isso é **verificado pelo ESLint** (`no-restricted-imports` em
[`eslint.config.mjs`](eslint.config.mjs)). Código usado por duas features sobe para
`components` ou `lib`.

## Contrato único

Nada de tipos ou validações escritos à mão para a API:

- **Tipos e chamadas**: `@sellmanager/api-client` (gerado do `openapi.json`). Mudou o
  contrato, o `typecheck` aponta o que quebrou.
- **Validação de formulários**: os schemas de `@sellmanager/shared`, os mesmos da API.
- **Dinheiro** em centavos inteiros (`*_cents`). Use `MoneyField` e `formatCents`.

## Autenticação

- `POST /sessions` devolve `{ user, token }`. O JWT expira em **2h** (`JWT_EXPIRES_IN` da API).
- **Todo acesso ao token passa por [`src/lib/tokenStorage.ts`](src/lib/tokenStorage.ts)**
  (`get/set/clear`, memória + localStorage). Nenhum outro arquivo toca em localStorage para
  isso; migrar para cookie httpOnly é trocar só essa implementação.
- Recarregar a página **mantém a sessão**: o token persistido é reaproveitado e o usuário é
  buscado em `GET /profile`.
- Fim de sessão (`useAuth().logout`, 401 de requisição autenticada, ou o `exp` do token
  chegando): limpa token e cache, e o router leva a `/login?redirect=<rota de origem>`
  (logout manual vai ao login sem `redirect`). O `exp` lido no front só serve para sair
  cedo; a API continua a fonte de verdade.
- O `redirect` aceita só caminhos internos (`safeRedirect`), contra open redirect.
- Sincroniza login/logout entre abas pelo evento `storage`.

### Segurança

- Sem `dangerouslySetInnerHTML` (React escapa por padrão).
- **CSP** injetada no `index.html` do build ([`vite.config.ts`](vite.config.ts)):
  `script-src 'self'` (sem inline/eval), `connect-src 'self'` + origem da API, `object-src 'none'`,
  `base-uri 'self'`. Em dev ela não é aplicada (o HMR do Vite usa scripts inline). Em
  produção, sirva também por **header HTTP** (`frame-ancestors` só funciona assim).
- O script de tema é um arquivo externo (`public/theme-init.js`) para respeitar a CSP.

### Melhoria planejada: cookie httpOnly + refresh token

Hoje o token fica no localStorage, então um XSS poderia lê-lo. A evolução planejada é a API
emitir um access token curto e um refresh token em cookie `httpOnly; Secure; SameSite`
(com rotação e revogação), de modo que o JavaScript nunca veja o token. Exige tabela de
refresh tokens, `POST /sessions/refresh` e `DELETE /sessions`, CORS com `credentials` e proteção
CSRF (checagem de `Origin`). Foi adiada por ser bem mais código para o escopo atual;
graças ao `tokenStorage` isolado, o front muda pouco.

## Convenções

### Onde colocar uma feature nova

`src/features/<recurso>/` com `queries.ts` (hooks de dados), as páginas/componentes do
domínio e um `index.ts` com o que é público. Depois registre a rota em
[`src/app/router.tsx`](src/app/router.tsx) e o item de menu em
[`AuthenticatedLayout.tsx`](src/app/AuthenticatedLayout.tsx). Veja `features/products` como
modelo.

### Query keys

Sempre por [`lib/queryKeys.ts`](src/lib/queryKeys.ts), no padrão `[recurso, escopo, params]`:
`['products']` (tudo), `['products','list',params]`, `['products','detail',id]`. Para um
recurso novo, adicione-o ao objeto `queryKeys`.

### Criar uma query e uma mutation

Copie [`features/products/queries.ts`](src/features/products/queries.ts):

```ts
export function useProductsList(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => unwrap(api.GET('/products', { params: { query: params } })),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.DELETE('/products/{id}', { params: { path: { id } } })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all }); // chave RAIZ
      notify.success('Produto excluído.');
    },
  });
}
```

`unwrap` devolve o dado tipado ou lança `ApiClientError`. Erros: `getErrorMessage(error)`
(mapeia o `code` da API para texto amigável, em um só lugar) ou `notify.error(error)`.

### Criar um formulário

```tsx
const form = useZodForm(productBodySchema, { defaultValues: { name: '' } }); // schema do shared

<Form
  form={form}
  onSubmit={async values => {
    // values já validados/convertidos
    try {
      await create.mutateAsync(values);
    } catch (error) {
      applyApiError(form, error);
    } // erros da API -> campos / alerta geral
  }}
>
  <TextField control={form.control} name="name" label="Nome" />
  <MoneyField control={form.control} name="price_cents" label="Preço" />{' '}
  {/* centavos */}
  <NumberField control={form.control} name="quantity" label="Quantidade" />
  <Button type="submit" disabled={form.formState.isSubmitting}>
    Salvar
  </Button>
</Form>;
```

Campos: `TextField`, `TextareaField`, `NumberField`, `MoneyField`, `SelectField`. Não crie
regras de validação no front: se faltar, ajuste o schema em `packages/shared`.

### Tabela e confirmação

- `DataTable`: `columns` tipadas, `data`, `meta` (da resposta paginada), `onPageChange`,
  `isLoading`, `error`/`onRetry`, `emptyMessage`.
- `ConfirmDialog`: controle `open` e `isPending`; feche quando a mutation terminar.

### Testes

`renderApp('/rota')` monta o app inteiro com router em memória; use `server.use(http...)`
(MSW) com fixtures de `src/test/fixtures.ts`, que são tipados pelo contrato. Requisição sem
handler **falha** o teste.

### Componentes de UI

`components/ui` segue o estilo do shadcn/ui (Radix + Tailwind, código no projeto, sem
dependência de pacote). Para adicionar um, copie o componente do shadcn e ajuste os imports
para `@/lib/utils`.

## Pendências

- CRUD de clientes, produtos e pedidos (próximo passo); upload de imagem de produto não existe na API.
- Conferência visual em 375px e nos dois temas feita só por construção (classes responsivas);
  falta passar por um navegador de verdade e adicionar e2e (Playwright).
- CSP como header HTTP no deploy e `frame-ancestors`.
- Cookie httpOnly + refresh token (seção acima).
- Code splitting por rota (o bundle ainda é único).
- Dockerfile/deploy do web.
