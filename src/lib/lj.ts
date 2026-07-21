// Tipos client-safe para Levey-Jennings.

export type LJPoint = {
  /** Id del QcResult: identifica la corrida al establecer media/DS. */
  resultId: string;
  seq: number;
  date: string; // ISO
  value: number;
  z: number;
  status: string; // ACEPTADA | ADVERTENCIA | RECHAZADA
};

export type LJLevel = {
  /** Id del LotAnalyteTarget (lote-nivel × analito). */
  targetId: string;
  lotId: string;
  lotLabel: string;
  levelIndex: number;
  /** Media/DS en uso: la establecida si status = ESTABLECIDA, si no la del inserto. */
  mean: number;
  sd: number;
  source: "PROVISIONAL" | "PROPUESTA" | "ESTABLECIDA";
  insertMean: number;
  insertSd: number;
  establishedMean: number | null;
  establishedSd: number | null;
  nEstablished: number;
  approvedBy: string | null;
  approvedAt: string | null; // ISO
  points: LJPoint[];
};

export type LJContext = {
  analyteId: string;
  nombre: string;
  unidad: string | null;
  decimales: number;
  levels: LJLevel[];
};

/** Datos que el panel envía para establecer la media/DS del laboratorio. */
export type EstablishTargetInput = {
  targetId: string;
  /** Ids de QcResult seleccionados (solo corridas no rechazadas). */
  resultIds: string[];
  approvedBy: string;
};

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

// ─────────────────────────────────────────────────────────────
// Fechas
// ─────────────────────────────────────────────────────────────

/**
 * Partes calendario de una fecha ISO, leídas en UTC.
 *
 * Las corridas se guardan ancladas a medianoche UTC (`YYYY-MM-DDT00:00:00Z`),
 * así que hay que leerlas en UTC: usar los getters locales en Colombia (UTC−5)
 * devolvería el día anterior.
 */
export function ljDateParts(iso: string): { day: string; month: string; year: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) return { year: m[1], month: m[2], day: m[3] };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: "??", month: "??", year: "????" };
  return {
    year: String(d.getUTCFullYear()).padStart(4, "0"),
    month: String(d.getUTCMonth() + 1).padStart(2, "0"),
    day: String(d.getUTCDate()).padStart(2, "0"),
  };
}

/** Día del mes de la corrida, para la marca del eje X ("21"). */
export function ljDayOfMonth(iso: string): string {
  return String(Number(ljDateParts(iso).day));
}

/** Fecha completa en formato DD/MM/AAAA. */
export function ljFormatDate(iso: string): string {
  const { day, month, year } = ljDateParts(iso);
  return `${day}/${month}/${year}`;
}

// ─────────────────────────────────────────────────────────────
// Reglas del panel de establecer media/DS
// ─────────────────────────────────────────────────────────────

/** Mínimo de datos recomendado por CLSI C24 (recomendación, no bloqueo). */
export const CLSI_MIN_N = 20;

/** Una corrida rechazada tuvo error analítico: no entra en ningún cálculo. */
export function isRejected(status: string): boolean {
  return status === "RECHAZADA";
}

/** Corridas que pueden entrar al cálculo de la media/DS del laboratorio. */
export function eligiblePoints(points: LJPoint[]): LJPoint[] {
  return points.filter((p) => !isRejected(p.status));
}
