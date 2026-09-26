// Tipos y funciones puras (client-safe) de la auditoría del CCI.

import type { QcStatus } from "@/components/ui/StatusBadge";

/** Resultado de un nivel dentro de una corrida, tal como quedó registrado. */
export type AuditCell = {
  resultId: string;
  lotLabel: string; // "Bio-Rad Liquichek · Nivel 1"
  numeroLote: string;
  value: number;
  /** z-score calculado y guardado al momento del ingreso (no se recalcula). */
  z: number | null;
};

/** Una corrida (un analito, una fecha) con todos sus niveles. */
export type AuditRow = {
  runId: string;
  fecha: string; // ISO (medianoche UTC)
  analyteId: string;
  analyteNombre: string;
  areaNombre: string;
  unidad: string | null;
  decimales: number;
  /** Resultados por índice de nivel (1, 2, 3…). */
  levels: Record<number, AuditCell>;
  trigger: string | null;
  operador: string | null;
  notas: string | null;
  correctiveAction: string | null;
  /** Bitácora de seguimiento posterior (entradas agregadas, nunca sobrescritas). */
  followUp: string | null;
  status: QcStatus;
  /** Reglas de rechazo violadas; 1_2s se infiere del estado ADVERTENCIA. */
  violated: string[];
};

export type AuditFilter = "todas" | "observaciones" | "no-aceptadas" | "advertencia" | "rechazada";

export const AUDIT_FILTERS: { value: AuditFilter; label: string }[] = [
  { value: "todas", label: "Todas las corridas" },
  { value: "observaciones", label: "Con observaciones o seguimiento" },
  { value: "no-aceptadas", label: "Advertencias y rechazos" },
  { value: "advertencia", label: "Solo advertencias" },
  { value: "rechazada", label: "Solo rechazadas" },
];

export function parseAuditFilter(v: string | undefined): AuditFilter {
  return AUDIT_FILTERS.some((f) => f.value === v) ? (v as AuditFilter) : "todas";
}

// ─────────────────────────────────────────────────────────────
// Rango de fechas
// ─────────────────────────────────────────────────────────────

/** Días del rango por defecto (hacia atrás desde hoy). */
export const DEFAULT_RANGE_DAYS = 30;

/** Límite del rango para no traer años de corridas de una vez. */
export const MAX_RANGE_DAYS = 366;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function isValidDay(v: string | undefined): v is string {
  if (!v || !ISO_DAY.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
}

/** Suma días a una fecha "YYYY-MM-DD" (aritmética en UTC). */
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000
  );
}

/**
 * Normaliza el rango pedido por URL. Fechas inválidas caen al rango por
 * defecto; si vienen invertidas se intercambian; si exceden el máximo se
 * recorta el inicio.
 */
export function resolveRange(
  desde: string | undefined,
  hasta: string | undefined,
  today: string
): { desde: string; hasta: string } {
  let to = isValidDay(hasta) ? hasta : today;
  let from = isValidDay(desde) ? desde : addDays(to, -DEFAULT_RANGE_DAYS);
  if (from > to) [from, to] = [to, from];
  if (daysBetween(from, to) > MAX_RANGE_DAYS) from = addDays(to, -MAX_RANGE_DAYS);
  return { desde: from, hasta: to };
}

// ─────────────────────────────────────────────────────────────
// Filtros y resumen
// ─────────────────────────────────────────────────────────────

const hasText = (s: string | null) => s != null && s.trim().length > 0;

/** La corrida tiene alguna nota, acción correctiva o seguimiento escrito. */
export function hasObservations(row: AuditRow): boolean {
  return hasText(row.notas) || hasText(row.correctiveAction) || hasText(row.followUp);
}

export function applyAuditFilter(rows: AuditRow[], filter: AuditFilter): AuditRow[] {
  switch (filter) {
    case "observaciones":
      return rows.filter(hasObservations);
    case "no-aceptadas":
      return rows.filter((r) => r.status !== "ACEPTADA");
    case "advertencia":
      return rows.filter((r) => r.status === "ADVERTENCIA");
    case "rechazada":
      return rows.filter((r) => r.status === "RECHAZADA");
    default:
      return rows;
  }
}

/** Columnas de nivel a mostrar: siempre 1–3, más cualquier nivel adicional presente. */
export function levelColumns(rows: AuditRow[]): number[] {
  const set = new Set([1, 2, 3]);
  for (const r of rows) for (const k of Object.keys(r.levels)) set.add(Number(k));
  return [...set].sort((a, b) => a - b);
}

export type AuditSummary = {
  total: number;
  aceptadas: number;
  advertencias: number;
  rechazadas: number;
  conObservaciones: number;
};

export function summarize(rows: AuditRow[]): AuditSummary {
  return {
    total: rows.length,
    aceptadas: rows.filter((r) => r.status === "ACEPTADA").length,
    advertencias: rows.filter((r) => r.status === "ADVERTENCIA").length,
    rechazadas: rows.filter((r) => r.status === "RECHAZADA").length,
    conObservaciones: rows.filter(hasObservations).length,
  };
}

/** Estado más severo entre los resultados de una corrida. */
export function worstStatus(statuses: string[]): QcStatus {
  if (statuses.includes("RECHAZADA")) return "RECHAZADA";
  if (statuses.includes("ADVERTENCIA")) return "ADVERTENCIA";
  return "ACEPTADA";
}

// ─────────────────────────────────────────────────────────────
// Bitácora de seguimiento
// ─────────────────────────────────────────────────────────────

/**
 * Agrega una entrada fechada y firmada a la bitácora de seguimiento.
 * Nunca reemplaza lo anterior: la trazabilidad exige conservar el histórico.
 */
export function appendFollowUp(
  existing: string | null,
  entry: string,
  day: string,
  author: string | null
): string {
  const [y, m, d] = day.split("-");
  const line = `[${d}/${m}/${y} · ${author ?? "sin usuario"}] ${entry.trim()}`;
  return hasText(existing) ? `${existing!.trimEnd()}\n${line}` : line;
}
