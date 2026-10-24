# @sellmanager/shared

Contracts shared by the API and the front-end. The package depends only on **zod**, which is a
peer dependency.

| Module         | Exports                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `common.ts`    | `idParamsSchema`, `paginationQuerySchema`, `paginatedSchema()`, `Paginated<T>`, `apiErrorSchema`, `validationIssueSchema`                    |
| `users.ts`     | Inputs: `createUserBody`, `sessionBody`, `forgotPasswordBody`, `resetPasswordBody`, `updateProfileBody`. DTOs: `userSchema`, `sessionSchema` |
| `products.ts`  | `productBodySchema`, `productSchema`                                                                                                         |
| `customers.ts` | `customerBodySchema`, `customerSchema`                                                                                                       |
| `orders.ts`    | `ORDER_STATUSES`, `orderStatusSchema`, `createOrderBody`, `listOrdersQuery`, `updateOrderStatusBody`, `orderItemSchema`, `orderSchema`       |

Every schema also exports its `z.infer` type (`Product`, `CreateOrderBody`, `OrderStatus`…).
DTO dates are ISO strings, which is what the API sends in JSON.

## Build

`tsup` writes ESM (`dist/index.js`), CommonJS (`dist/index.cjs`) and type declarations, which
`exports` selects through the `import`/`require` conditions:

- the API runs as compiled CommonJS, and Node won't run `.ts` files from `node_modules`;
- Vite and other ESM consumers use the ESM build.

`pnpm dev` keeps the build updated through `tsup --watch`.

## Rules

- No Express, TypeORM, React or any other runtime dependency besides `zod`.
- Response DTOs carry `.meta({ id })`, which becomes the component name in the API's OpenAPI
  document.
- The API's `test/integration/contracts.test.ts` checks real responses against these
  schemas. If you change a DTO, that test shows what has to change in the API.
