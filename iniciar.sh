#!/bin/sh
set -e
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] Instalá Docker Desktop y volvé a intentar."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "[ERROR] Docker no está en ejecución. Abrí Docker Desktop y reintentá."
  exit 1
fi

if [ ! -f .env ]; then
  echo "No hay .env — se copia .env.example (Postgres local)."
  cp .env.example .env
fi

echo "Primera vez puede tardar 5-15 minutos."
docker compose up -d --build

echo "Esperando al backend..."
i=0
until curl -sf "http://127.0.0.1:8000/" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 40 ]; then
    echo "[AVISO] El API aún no responde. Revisá: docker compose logs backend"
    break
  fi
  sleep 3
done

echo
echo "App web:  http://localhost:3000"
echo "API:      http://localhost:8000/docs"
echo "pgAdmin:  http://localhost:5050   admin@petmatch.com / admin"
echo "Manual:   MANUAL_TECNICO.md"
