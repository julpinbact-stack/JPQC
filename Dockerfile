# ── JPQC — imagen de la aplicación Next.js ───────────────────────────────────
# Imagen única con dependencias completas: en el arranque aplica migraciones,
# ejecuta el seed y levanta la app. Pensada para despliegue interno (LAN).

FROM node:22-bookworm-slim AS base
# openssl es requerido por los engines de Prisma.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── Dependencias ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
# Habilita los scripts de postinstalación bloqueados por npm 11 (prisma, esbuild...).
RUN npm ci --foreground-scripts

# ── Build ────────────────────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app ./
COPY docker/entrypoint.sh /app/docker/entrypoint.sh
RUN chmod +x /app/docker/entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
