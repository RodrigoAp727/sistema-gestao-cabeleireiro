#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "$0")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js nao foi encontrado. Instale Node.js 18+ e execute este script novamente."
  exit 1
fi

if [ ! -d "$ROOT/backend/node_modules" ]; then
  echo "Instalando dependencias do backend..."
  (cd "$ROOT/backend" && npm install --no-audit --no-fund)
fi

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "Instalando dependencias do frontend..."
  (cd "$ROOT/frontend" && npm install --no-audit --no-fund)
fi

osascript -e 'tell application "Terminal" to do script "cd \"'"$ROOT/backend"'\" && npm start"' >/dev/null 2>&1 || true
osascript -e 'tell application "Terminal" to do script "cd \"'"$ROOT/frontend"'\" && npm run dev -- --host 0.0.0.0 --port 5175"' >/dev/null 2>&1 || true

echo "Sistema iniciando..."
echo "Frontend: http://localhost:5175"
echo "Backend:  http://localhost:3001"
echo "Credenciais padrao:"
echo "Login: Rodrigo Campos"
echo "Senha: 100769"
