# PLAN — Aplicación de Gestión de Calidad Analítica (JPQC)

> Documento de plan y checklist de ejecución.
> Product Owner: Bacterióloga / especialista en control de calidad analítica.
> Fecha: 2026-07-18 · Estado: aprobado (fase de documentación).

---

## 1. Contexto

La IPS de laboratorio clínico no cuenta hoy con una herramienta que integre el **Control de
Calidad Interno (CCI)** con el **Control de Calidad Externo (CCE)**, parametrice los lotes de
controles de **tercera opinión** (independientes del reactivo del equipo) con los valores del
inserto, grafique **Levey-Jennings**, aplique **reglas de Westgard** y calcule los **indicadores
de competencia analítica** (imprecisión, sesgo, error total, Sigma) e **incertidumbre**.

Las soluciones del mercado (Bio-Rad Unity, CIPROS de PROASECAL) son de pago, cerradas y no
siempre cubren incertidumbre ni observaciones cualitativas. Se construye una **aplicación web
propia**, en español, con entorno profesional (no juvenil), para uso en la IPS.

Ubicación del proyecto: `C:\Users\jplab\OneDrive\Documentos\JPQC`.

---

## 2. Decisiones acordadas con la PO

| Tema | Decisión |
|------|----------|
| Alcance v1 | **Completo**: CCI + CCE + incertidumbre + informes PDF firmables |
| Áreas | Química (2 niveles), Coagulación (2 niveles), Hematología (3 niveles) — motor genérico de N niveles |
| Usuarios | **Sin login ahora**, pero arquitectura *cloud-ready* multiusuario a futuro |
| Despliegue | **Servidor en red (LAN)** vía docker-compose; acceso por navegador desde varios equipos |
| Reglas Westgard | **Automáticas por métrica Sigma**; regla de racha **10x** + se muestra el **N recomendado** |
| Media/DS gráfica | **Híbrido**: inserto = provisional; a 20 corridas se **propone** y **la supervisora aprueba** antes de establecer |
| Sesgo sin CCE | Estimado **vs inserto**, rotulado "provisional – sin CCE" |
| Informe formal | Cierre e informe firmable **mensual** |
| Corridas | 1 o **varias por día** (flexible, no obligatorio), con evento disparador |
| Catálogos | **Editables por la PO**: Áreas, Eventos disparadores, Proveedores de CCE y Analitos (con seed) |
| CCE | **Multiproveedor**: la PO crea sus proveedores y vincula los analitos que cada uno controla |
| Analitos | **28 precargados** en 5 áreas (Química, Química especial, Hematología, Coagulación, Inmunoensayo); ampliables |

---

## 3. Stack técnico

- **Next.js 15 (App Router) + TypeScript** — full-stack (UI + API en Route Handlers / Server Actions)
- **PostgreSQL 16** + **Prisma ORM** (migraciones versionadas)
- **Tailwind CSS + shadcn/ui** (Radix) — componentes accesibles, look clínico
- **Recharts** — gráficas Levey-Jennings (`ReferenceLine` para ±1/2/3 DS) y dashboards
- **Zod** — validación de formularios y de la capa API
- **@react-pdf/renderer** — informe mensual PDF firmable
- **Vitest** — pruebas unitarias del motor de cálculo
- **Docker Compose** — servicios `db` (postgres) + `app` (next), migración automática al arrancar

### Preparación para la nube / multiusuario (sin construir login aún)
- Todas las tablas de datos incluyen columnas nullable `created_by` (texto) y `tenant_id`
  (texto, default `'default'`). Hoy no se usan; a futuro un middleware de auth las llena sin
  cambiar el esquema.
- Capa de acceso a datos aislada en `src/server/` para insertar auth/tenancy después.
- Firma de aprobación como **nombre digitado + fecha/hora**, migrable a firma autenticada.

---

## 4. Módulos de la aplicación

1. **Parámetros** — CRUD de analitos; fuente ETa (CLIA/Ricós/manual) autocompleta el valor;
   unidad, decimales, CVi/CVg.
2. **Lotes** — lotes de control de tercera opinión con datos del inserto (diana + DS por nivel),
   fechas y vencimiento; `insert_cv` calculado.
3. **Ingreso diario** — resultado por nivel; evaluación Westgard-Sigma en vivo (verde/ámbar/rojo)
   antes de guardar; observación, acción correctiva y evento disparador.
4. **Levey-Jennings** — gráfica por analito/nivel con líneas ±1/2/3 DS (efectivas); puntos por
   estado; marca provisional vs establecida.
5. **Indicadores** — CV, sesgo, ET vs ETa, Sigma e incertidumbre por analito; muestra el set de
   reglas recomendado por Sigma.
6. **CCE / Externo** — captura de resultados del programa externo; sesgo y SDI automáticos.
7. **Resumen / Informe** — consolidado mensual con análisis cualitativo y firma (nombre+fecha),
   exportable a PDF.
8. **Configuración** — perfil de la IPS (encabezado de informes) y **catálogos editables**
   (Áreas, Eventos disparadores, Proveedores de CCE).

*(El detalle de arquitectura, modelo de datos y algoritmos está en `SDD.md`.)*

---

## 5. Lista de TODO / Checklist por fases

### Fase 0 — Andamiaje
- [ ] Scaffold Next.js + TS + Tailwind + shadcn/ui en JPQC
- [ ] Configurar Prisma + docker-compose (db + app) + `.env`
- [ ] Esquema Prisma inicial + primera migración + seed mínimo (LabProfile)

### Fase 1 — Parametrización
- [ ] Catálogos editables (Áreas, Eventos disparadores) + seed de 5 áreas y 28 analitos
- [ ] Módulo Analitos (CRUD, fuentes ETa CLIA/Ricós/manual, CVi/CVg)
- [ ] Módulo Lotes de control + valores del inserto por nivel

### Fase 2 — Motor + ingreso
- [ ] Motor QC: estadística acumulada + propuesta a 20 corridas + **aprobación de supervisora** para establecer
- [ ] Reglas de Westgard + selección Sigma automática (10x + N recomendado) (tests Vitest)
- [ ] Módulo Ingreso diario con evaluación en vivo, observación y acción correctiva

### Fase 3 — Visualización e indicadores
- [ ] Gráfica Levey-Jennings (Recharts)
- [ ] Módulo Indicadores (CV, sesgo, ET, Sigma, incertidumbre)

### Fase 4 — Externo + informes
- [ ] Catálogo de Proveedores de CCE + vínculo proveedor↔analitos
- [ ] Módulo CCE + cálculo de sesgo/SDI e integración con indicadores
- [ ] Resumen mensual + informe PDF firmable
- [ ] Configuración (perfil IPS)

### Fase 5 — Cierre
- [ ] Datos de ejemplo para demo, pulido UI, README y guía de uso

---

## 6. Verificación

- **Motor**: tests unitarios (Vitest) de reglas Westgard, Sigma, CV/sesgo/ET/incertidumbre con
  datasets de referencia (incluye el caso de transición a los 20 datos).
- **End-to-end manual**: `docker compose up`, crear un analito, un lote con inserto, ingresar
  ~25 corridas y comprobar: gráfica LJ con líneas correctas, disparo de reglas esperado, cambio a
  media/DS establecida, indicadores y Sigma calculados, y generación del PDF del informe.
- Verificación en navegador (MCP) del flujo de los 8 módulos.

---

## 7. Decisiones pendientes (no bloquean)

- **Valores de ETa / CVi / CVg** de cada analito — se precargan desde la referencia CLIA 88 / Ricós
  donde exista; la PO valida y completa los faltantes (varios inmunoensayos quedan en modo MANUAL).
- **Proveedores de CCE** — la PO los crea en la app y vincula los analitos de cada uno (multiproveedor).
