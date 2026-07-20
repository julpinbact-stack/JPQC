#!/bin/sh
set -e

echo "[JPQC] Esperando a PostgreSQL..."
# Aplica migraciones (crea el esquema si no existe).
npx prisma migrate deploy

echo "[JPQC] Ejecutando seed (idempotente)..."
npx prisma db seed || echo "[JPQC] Seed omitido o ya aplicado."

echo "[JPQC] Iniciando aplicación en el puerto 3000..."
exec npm run start -- -H 0.0.0.0 -p 3000
