import type { SigmaPlan } from "@/lib/qc/sigma";

export type EntryAnalyte = {
  id: string;
  nombre: string;
  areaNombre: string;
  levelCount: number;
};

export type EntryLevel = {
  lotId: string;
  lotLabel: string; // "Bio-Rad Liquichek · Nivel 1"
  levelIndex: number;
  mean: number;
  sd: number;
  source: "PROVISIONAL" | "PROPUESTA" | "ESTABLECIDA";
  history: number[]; // z-scores previos (cronológicos)
};

export type EntryContext = {
  analyteId: string;
  nombre: string;
  unidad: string | null;
  decimales: number;
  etaValue: number | null;
  cvPct: number | null;
  biasPct: number;
  sigma: number | null;
  plan: SigmaPlan;
  levels: EntryLevel[];
};

export type TriggerOption = { id: string; nombre: string };

export type RunLevelInput = {
  lotId: string;
  value: number;
};

export type SaveRunInput = {
  analyteId: string;
  fecha: string; // "YYYY-MM-DD"
  hora?: string | null; // "HH:mm"
  triggerEventId?: string | null;
  operador?: string | null;
  notas?: string | null;
  correctiveAction?: string | null;
  levels: RunLevelInput[];
};

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };
