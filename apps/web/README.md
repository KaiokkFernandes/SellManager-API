# SellManager Web (`apps/web`)

Front-end skeleton built with **Vite 8 + React 19 + TypeScript**. It has no screens yet.

The placeholder page is a minimal example: a login form and a "list products" button that call
the API through [`@sellmanager/api-client`](../../packages/api-client). The client is set up in
`src/api.ts`, with the token kept in `localStorage`. The page proves the whole chain works:
contract → `openapi.json` → typed client → web.

```bash
cp .env.example .env   # VITE_API_URL=http://localhost:3333
pnpm --filter web dev  # http://localhost:3000 (from the repository root)
```

| Variable       | Description                                |
| -------------- | ------------------------------------------ |
| `VITE_API_URL` | API base URL. Typed in `src/vite-env.d.ts` |

The app runs on port **3000**, which matches the API's default `CORS_ORIGIN` and `APP_WEB_URL`.

| Script                      | Description                 |
| --------------------------- | --------------------------- |
| `dev` / `build` / `preview` | Vite                        |
| `typecheck`                 | `tsc --noEmit`              |
| `lint`                      | ESLint (base + React rules) |
| `format` / `format:check`   | Prettier                    |
