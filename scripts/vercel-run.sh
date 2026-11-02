#!/usr/bin/env bash
# Roda um comando com o pnpm do campo packageManager no PATH. A Vercel escolhe o
# pnpm pela data do projeto e cai no 9, que não lê este lockfile. O Turborepo
# também chama o pnpm do PATH, então não basta instalar com outra versão.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(node -p "require('$ROOT/package.json').packageManager.split('@')[1]")"

if [ "$(pnpm --version 2>/dev/null || true)" != "$VERSION" ]; then
  TOOLS="$ROOT/.vercel-tools/pnpm-$VERSION"
  if [ ! -x "$TOOLS/node_modules/.bin/pnpm" ]; then
    npm install --prefix "$TOOLS" --no-save --no-audit --no-fund --silent "pnpm@$VERSION"
  fi
  export PATH="$TOOLS/node_modules/.bin:$PATH"
fi

cd "$ROOT"
exec "$@"
