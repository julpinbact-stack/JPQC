// Tipos y helpers de lotes de control, seguros para cliente y servidor (sin Prisma).

export type LotRow = {
  id: string;
  fabricante: string;
  nombreComercial: string | null;
  levelLabel: string;
  levelIndex: number;
  numeroLote: string;
  vencimiento: string | null; // "YYYY-MM-DD"
  apertura: string | null; // "YYYY-MM-DD"
  activo: boolean;
  targetCount: number;
};

export type TargetRow = {
  id: string;
  analyteId: string;
  analyteNombre: string;
  areaNombre: string;
  unidad: string | null;
  insertMean: number;
  insertSd: number;
  insertCv: number | null;
  status: string;
};

export type LotDetail = LotRow & { targets: TargetRow[] };

export type AnalyteOption = {
  id: string;
  nombre: string;
  areaNombre: string;
  unidad: string | null;
};

export type LotInput = {
  fabricante: string;
  nombreComercial?: string | null;
  levelLabel: string;
  levelIndex: number;
  numeroLote: string;
  vencimiento?: string | null;
  apertura?: string | null;
  activo: boolean;
};

export type TargetInput = {
  analyteId: string;
  insertMean: number;
  insertSd: number;
};

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/** %CV del inserto = DS / media × 100. */
export function calcInsertCv(mean: number, sd: number): number | null {
  if (!mean || mean <= 0) return null;
  return (sd / mean) * 100;
}

/** Formatea "YYYY-MM-DD" a "DD/MM/YYYY" para mostrar. */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}
