# SellManager Web (`apps/web`)

Front-end skeleton built with **Vite 8 + React 19 + TypeScript**. It has no screens yet.

The placeholder page imports a type, a schema and a constant from
[`@sellmanager/shared`](../../packages/shared) and renders them. This shows that the
workspace integration works in the browser build.

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
