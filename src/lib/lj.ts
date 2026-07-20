// Tipos client-safe para Levey-Jennings.

export type LJPoint = {
  seq: number;
  date: string; // ISO
  value: number;
  z: number;
  status: string; // ACEPTADA | ADVERTENCIA | RECHAZADA
};

export type LJLevel = {
  lotId: string;
  lotLabel: string;
  levelIndex: number;
  mean: number;
  sd: number;
  source: "PROVISIONAL" | "PROPUESTA" | "ESTABLECIDA";
  points: LJPoint[];
};

export type LJContext = {
  analyteId: string;
  nombre: string;
  unidad: string | null;
  decimales: number;
  levels: LJLevel[];
};

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };
