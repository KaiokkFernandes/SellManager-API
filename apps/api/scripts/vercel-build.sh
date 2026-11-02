#!/usr/bin/env bash
# Build do serviço backend na Vercel. Roda pela raiz do monorepo (scripts/vercel-run.sh).
set -euo pipefail

# Pacotes do workspace (shared) e a API. A função em si sai do builder da
# Vercel, a partir de src/index.ts; o dist/ daqui serve às migrations.
node_modules/.bin/turbo run build --filter=@sellmanager/api

# Só produção: preview nunca aplica migration, para não alterar o banco de produção.
if [ "${VERCEL_ENV:-}" != "production" ]; then
  echo "VERCEL_ENV=${VERCEL_ENV:-indefinido}: migrations não aplicadas."
  exit 0
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Erro: DATABASE_URL não está definida no ambiente Production." >&2
  # só os NOMES: valores nunca aparecem no log do build
  similar="$(compgen -e | grep -Ei 'DATABASE|POSTGRES|NEON|^PG' || true)"
  if [ -n "$similar" ]; then
    echo "Variáveis parecidas encontradas:" >&2
    echo "$similar" | sed 's/^/  - /' >&2
  else
    echo "Nenhuma variável parecida encontrada." >&2
  fi
  echo "Marque a variável para Production no painel da Vercel e faça Redeploy." >&2
  exit 1
fi

node apps/api/dist/shared/infra/cli/migrate.js
