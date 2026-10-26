# @sellmanager/shared

The API contract, shared by the API and the front-end. The package depends only on **zod**, which is a
peer dependency.

| Module         | Exports                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `common.ts`    | `idParamsSchema`, `paginationQuerySchema`, `paginatedSchema()`, `Paginated<T>`, `apiErrorSchema`, `validationIssueSchema`                    |
| `users.ts`     | Inputs: `createUserBody`, `sessionBody`, `forgotPasswordBody`, `resetPasswordBody`, `updateProfileBody`. DTOs: `userSchema`, `sessionSchema` |
| `products.ts`  | `productBodySchema`, `productSchema`                                                                                                         |
| `customers.ts` | `customerBodySchema`, `customerSchema`                                                                                                       |
| `orders.ts`    | `ORDER_STATUSES`, `orderStatusSchema`, `createOrderBody`, `listOrdersQuery`, `updateOrderStatusBody`, `orderItemSchema`, `orderSchema`       |

| `contract/` | `defineRoute()`, `routes` (every route of the API), `allRoutes`, `RouteInput`, `RouteResponseBody` |

Every schema also exports its `z.infer` type (`Product`, `CreateOrderBody`, `OrderStatus`…).
Conventions:

- **Dates** are ISO strings, which is what the API sends in JSON.
- **Ids** are UUIDs.
- **Money** is an integer number of cents (`moneyCentsSchema`), in fields ending with `_cents`.
- **Errors** follow `apiErrorSchema`, `{ status, code, message, issues?, details? }`, and
  `API_ERROR_CODES` lists the stable codes.

The route registry (`contract/routes.ts`) is the single source for the API's routing and
validation, for `apps/api/openapi.json` and, through that file, for `@sellmanager/api-client`.
The steps to add a route are in the [root README](../../README.md#how-to-add-or-change-a-route).

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
