# JPQC — Guía del proyecto (para Claude y desarrolladores)

Aplicación web de **gestión de calidad analítica** para una IPS de laboratorio clínico:
control de calidad interno (CCI) + externo (CCE), Levey-Jennings, reglas de Westgard por
métrica Sigma e indicadores de competencia analítica.

Documentos de diseño: `../PLAN.md` y `../SDD.md` viven en la carpeta OneDrive
`Documentos/JPQC/docs/` (el código está en `C:\dev\jpqc`, fuera de OneDrive).

## Stack
- Next.js 15 (App Router) + TypeScript, Tailwind CSS v4
- PostgreSQL + Prisma 7 (usa **driver adapter** `@prisma/adapter-pg`; la URL va por
  `prisma.config.ts`/adapter, **no** en el `datasource` del esquema)
- Recharts (Levey-Jennings), Zod (validación), @react-pdf/renderer (informes), Vitest (tests)
- docker-compose (servicios `db` + `app`)

## Comandos
- `npm run dev` — servidor de desarrollo (localhost:3000)
- `npm run build` — build de producción
- `npm run db:migrate` — crear/aplicar migración (dev, requiere Postgres)
- `npm run db:deploy` — aplicar migraciones (producción/Docker)
- `npm run db:seed` — poblar catálogos + 28 analitos
- `npm run db:studio` — Prisma Studio
- `npm test` — pruebas (Vitest)
- `docker compose up --build` — levantar todo (migra, seed y arranca)

## Convenciones
- Cliente Prisma generado en `src/generated/prisma` (ignorado por git). Importar en app vía
  `@/generated/prisma/client`; singleton en `src/lib/prisma.ts`.
- El motor de cálculo (estadística, Westgard, Sigma, indicadores) irá en `src/server/qc/`
  como funciones puras testeables. No poner lógica de negocio en componentes.
- Columnas `tenantId`/`createdBy` existen para futura migración multiusuario; hoy sin uso.
- UI en español, tono clínico profesional. Tokens de color en `src/app/globals.css`
  (estados: success/warning/danger). Componentes base en `src/components/ui/`.
- **Casing en Windows**: la carpeta es `C:\dev\jpqc` (minúsculas). Usar siempre esa
  capitalización para evitar duplicación de módulos en webpack.
