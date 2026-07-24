#!/bin/sh
set -e

# Espera activa a que PostgreSQL acepte conexiones antes de migrar. En Coolify
# (o cualquier orquestador sin healthcheck de dependencia) la DB puede tardar en
# levantar; sin esto, `migrate deploy` falla y el contenedor reinicia en bucle.
# Se prueba la conexión con el cliente 'pg' (ya es dependencia del proyecto), sin
# necesidad de pg_isready. Efecto neutro: solo conecta y cierra.
echo "[JPQC] Esperando a PostgreSQL..."
ATTEMPTS=0
MAX_ATTEMPTS=30
until node -e "const{Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>c.end()).then(()=>process.exit(0)).catch(()=>process.exit(1))" 2>/dev/null; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "[JPQC] PostgreSQL no respondió tras $MAX_ATTEMPTS intentos. Abortando."
    exit 1
  fi
  echo "[JPQC] PostgreSQL no disponible aún (intento $ATTEMPTS/$MAX_ATTEMPTS). Reintentando en 2s..."
  sleep 2
done
echo "[JPQC] PostgreSQL disponible."

# Aplica migraciones (crea el esquema si no existe).
npx prisma migrate deploy

echo "[JPQC] Ejecutando seed base (catálogos + analitos, idempotente)..."
npx prisma db seed || echo "[JPQC] Seed base omitido o ya aplicado."

# Datos de DEMOSTRACIÓN (ficticios): solo si DEMO_MODE=true. Idempotente: no
# hace nada si ya existen lotes, por lo que un despliegue real nunca los inyecta.
if [ "$DEMO_MODE" = "true" ]; then
  echo "[JPQC] DEMO_MODE=true → poblando datos de demostración (ficticios)..."
  npm run db:seed:demo || echo "[JPQC] Seed de demostración omitido o ya aplicado."
fi

echo "[JPQC] Iniciando aplicación en el puerto 3000..."
exec npm run start -- -H 0.0.0.0 -p 3000
