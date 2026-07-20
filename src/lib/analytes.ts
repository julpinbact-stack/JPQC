// Tipos y constantes de analitos seguros para cliente y servidor (sin Prisma).

export type AnalyteRow = {
  id: string;
  nombre: string;
  areaId: string;
  areaNombre: string;
  unidad: string | null;
  decimales: number;
  metodo: string | null;
  equipo: string | null;
  etaValue: number | null;
  etaSource: string;
  cvi: number | null;
  cvg: number | null;
  validated: boolean;
  activo: boolean;
};

export type AreaOption = { id: string; nombre: string };

export type AreaGroup = { area: AreaOption; analytes: AnalyteRow[] };

export const ETA_SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: "CLIA", label: "CLIA 2025" },
  { value: "RICOS_DES", label: "Ricós deseable" },
  { value: "RICOS_OPT", label: "Ricós óptimo" },
  { value: "RICOS_MIN", label: "Ricós mínimo" },
  { value: "MANUAL", label: "Manual" },
];

export function etaSourceLabel(value: string): string {
  return ETA_SOURCE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export type EtaSourceValue =
  | "CLIA"
  | "RICOS_OPT"
  | "RICOS_DES"
  | "RICOS_MIN"
  | "MANUAL";

export type AnalyteInput = {
  nombre: string;
  areaId: string;
  unidad?: string | null;
  decimales: number;
  metodo?: string | null;
  equipo?: string | null;
  etaSource: EtaSourceValue;
  etaValue: number | null;
  cvi: number | null;
  cvg: number | null;
  activo: boolean;
};

export type ActionResult = { ok: true } | { ok: false; error: string };
