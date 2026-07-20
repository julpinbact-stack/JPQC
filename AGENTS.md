# AGENTS

Guía del proyecto en `CLAUDE.md`. Diseño en `docs/PLAN.md` y `docs/SDD.md`
(carpeta OneDrive `Documentos/JPQC/docs/`).

Nota: el proyecto usa **Next.js 15** (no 16). Prisma 7 requiere driver adapter
(`@prisma/adapter-pg`); la URL de la base va por el adapter / `prisma.config.ts`,
nunca en el bloque `datasource` del esquema.
