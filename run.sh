#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT_DIRECTORY="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=8080
FRONTEND_PORT=5173

stop_all_child_processes() {
  trap - INT TERM EXIT
  echo
  echo "Parando backend e frontend..."
  kill 0 2>/dev/null || true
  wait 2>/dev/null || true
}
trap stop_all_child_processes INT TERM EXIT

for port_to_check in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if lsof -iTCP:"$port_to_check" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Porta $port_to_check já está em uso. Libere antes de rodar."
    exit 1
  fi
done

if [ ! -d "$PROJECT_ROOT_DIRECTORY/frontend/node_modules" ]; then
  (cd "$PROJECT_ROOT_DIRECTORY/frontend" && npm install)
fi

(cd "$PROJECT_ROOT_DIRECTORY/backend" && mvn -q spring-boot:run 2>&1 | sed -l 's/^/[backend]  /') &
backend_pipeline_pid=$!

(cd "$PROJECT_ROOT_DIRECTORY/frontend" && npm run dev 2>&1 | sed -l 's/^/[frontend] /') &
frontend_pipeline_pid=$!

echo "Backend: http://127.0.0.1:$BACKEND_PORT | Frontend: http://localhost:$FRONTEND_PORT | Ctrl+C para parar"

while kill -0 "$backend_pipeline_pid" 2>/dev/null && kill -0 "$frontend_pipeline_pid" 2>/dev/null; do
  sleep 1
done

echo "Um dos processos terminou; encerrando o outro."
