// Tipos y helpers client-safe para el Control de Calidad Externo (CCE).

export type ProviderItem = {
  id: string;
  nombre: string;
  acreditacion: string | null;
  activo: boolean;
  analyteIds: string[];
  resultCount: number;
};

export type CceResultRow = {
  id: string;
  providerNombre: string;
  analyteNombre: string;
  areaNombre: string;
  ciclo: string;
  nivel: string | null;
  labResult: number;
  targetValue: number | null;
  sdGroup: number | null;
  sdi: number | null;
  biasPct: number | null;
  evaluacion: string | null;
  fecha: string | null;
};

export type AnalyteOpt = { id: string; nombre: string; areaNombre: string };

export type ProviderInput = {
  nombre: string;
  acreditacion?: string | null;
  activo: boolean;
  analyteIds: string[];
};

export type CceResultInput = {
  providerId: string;
  analyteId: string;
  ciclo: string;
  nivel?: string | null;
  labResult: number;
  targetValue?: number | null;
  sdGroup?: number | null;
  evaluacion?: string | null;
  notas?: string | null;
  fecha?: string | null;
};

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/** Sesgo % = (resultado − valor diana) / valor diana × 100. */
export function calcBiasPct(labResult: number, targetValue: number | null): number | null {
  if (targetValue == null || targetValue === 0) return null;
  return ((labResult - targetValue) / targetValue) * 100;
}

/** Índice de desviación estándar (SDI) = (resultado − diana) / DS del grupo. */
export function calcSDI(
  labResult: number,
  targetValue: number | null,
  sdGroup: number | null
): number | null {
  if (targetValue == null || sdGroup == null || sdGroup === 0) return null;
  return (labResult - targetValue) / sdGroup;
}
