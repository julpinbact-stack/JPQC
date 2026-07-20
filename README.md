# JPQC — Sistema de Control de Calidad Analítica

Aplicación web para la gestión de calidad analítica de una IPS de laboratorio clínico:
control de calidad **interno (CCI)** y **externo (CCE)**, gráficas de **Levey-Jennings**,
reglas de **Westgard** por métrica **Sigma** e **indicadores de competencia analítica**
(imprecisión, sesgo, error total, incertidumbre).

> Documentos de diseño: `docs/PLAN.md` (plan y checklist) y `docs/SDD.md` (diseño de software).

## Requisitos previos
- [Node.js 20+](https://nodejs.org)
- **PostgreSQL nativo** (servicio de Windows) — camino actual, no requiere WSL.
  Alternativa: Docker Desktop (requiere WSL2).

## Puesta en marcha sin Docker (PostgreSQL nativo) — recomendado hoy
1. Instala PostgreSQL (servicio de Windows) y crea la base y el rol de la app:
   ```sql
   CREATE ROLE jpqc WITH LOGIN PASSWORD 'jpqc_dev_pw';
   CREATE DATABASE jpqc OWNER jpqc;
   ```
2. Copia `.env.example` a `.env` (la `DATABASE_URL` ya apunta a `localhost:5432/jpqc`).
3. Prepara e inicia:
   ```bash
   npm install
   npm run db:deploy   # aplica migraciones (crea las tablas)
   npm run db:seed     # datos iniciales: 5 áreas, eventos, 28 analitos
   npm run dev         # http://localhost:3000
   ```
   Para producción en el servidor LAN: `npm run build` y `npm run start`
   (accesible en `http://IP-DEL-SERVIDOR:3000`).

## Puesta en marcha con Docker (requiere WSL2)
1. Copia `.env.example` a `.env`.
2. `docker compose up --build` — arranca PostgreSQL, migra, seedea y sirve la app.
3. Abre **http://localhost:3000**.

## Comandos útiles
| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run db:migrate` | Crear/aplicar migración (desarrollo) |
| `npm run db:deploy` | Aplicar migraciones (producción) |
| `npm run db:seed` | Poblar catálogos y analitos |
| `npm run db:studio` | Explorar la base con Prisma Studio |
| `npm test` | Pruebas unitarias (Vitest) |

## Estructura
```
prisma/            Esquema, migraciones y seed
src/app/           Rutas y páginas (App Router) — un módulo por carpeta
src/components/    UI (layout, componentes base)
src/lib/           Utilidades y cliente Prisma
src/server/qc/     Motor de cálculo de calidad (próximas fases)
docker/            Entrypoint del contenedor de la app
docs/              PLAN.md y SDD.md
```

## Estado
Fase 0 (andamiaje) completa. Próximo: Fase 1 (módulos de Parámetros y Lotes).
Ver el avance en `docs/PLAN.md`.
