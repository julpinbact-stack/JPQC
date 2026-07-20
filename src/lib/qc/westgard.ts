// Reglas de Westgard. Funciones puras y testeables.
// Definiciones (según la especificación de la PO):
//  1_2s   : advertencia — un punto excede ±2s.
//  1_3s   : un punto excede ±3s. (rechazo)
//  2_2s   : 2 puntos consecutivos del mismo nivel exceden ±2s en el mismo sentido,
//           o los 2 niveles de la misma corrida exceden ±2s en el mismo sentido. (rechazo)
//  R_4s   : diferencia ≥ 4s entre niveles en la misma corrida. (rechazo)
//  4_1s   : 4 puntos consecutivos del mismo nivel exceden ±1s al mismo lado. (rechazo)
//  10x    : 10 puntos consecutivos del mismo nivel al mismo lado de la media. (rechazo)
//  2de3_2s: 2 de 3 niveles de la corrida exceden ±2s en el mismo sentido. (rechazo, 3 niveles)
//  3_1s   : 3 puntos consecutivos del mismo nivel exceden ±1s al mismo lado. (rechazo, 3 niveles)

export type LevelMeasurement = {
  levelIndex: number;
  z: number; // z-score de la corrida actual para este nivel
  history: number[]; // z-scores previos de este nivel, cronológicos (viejo→nuevo)
};

export type WestgardStatus = "ACEPTADA" | "ADVERTENCIA" | "RECHAZADA";

export type WestgardResult = {
  status: WestgardStatus;
  violated: string[]; // reglas de rechazo violadas
  warnings: string[]; // p. ej. ["1_2s"]
};

export const REJECTION_RULES = [
  "1_3s",
  "2_2s",
  "R_4s",
  "4_1s",
  "10x",
  "2de3_2s",
  "3_1s",
] as const;

const sameSide = (a: number, b: number) => (a > 0 && b > 0) || (a < 0 && b < 0);
const seriesOf = (m: LevelMeasurement) => [...m.history, m.z];
const lastN = (xs: number[], n: number) => xs.slice(-n);

/** Evalúa las reglas habilitadas sobre la corrida actual. */
export function evaluateWestgard(
  levels: LevelMeasurement[],
  enabledRules: string[]
): WestgardResult {
  const enabled = new Set(enabledRules);
  const violated = new Set<string>();
  const warnings: string[] = [];

  const zs = levels.map((l) => l.z);

  // 1_2s — advertencia
  if (zs.some((z) => Math.abs(z) > 2)) warnings.push("1_2s");

  // 1_3s
  if (enabled.has("1_3s") && zs.some((z) => Math.abs(z) > 3)) violated.add("1_3s");

  // 2_2s (dentro de la corrida entre niveles, o 2 consecutivos del mismo nivel)
  if (enabled.has("2_2s")) {
    const highPos = levels.filter((l) => l.z > 2).length;
    const highNeg = levels.filter((l) => l.z < -2).length;
    const withinRun = highPos >= 2 || highNeg >= 2;
    const acrossRun = levels.some((l) => {
      const s = lastN(seriesOf(l), 2);
      return s.length === 2 && Math.abs(s[0]) > 2 && Math.abs(s[1]) > 2 && sameSide(s[0], s[1]);
    });
    if (withinRun || acrossRun) violated.add("2_2s");
  }

  // R_4s (rango ≥ 4s entre niveles de la misma corrida)
  if (enabled.has("R_4s") && zs.length >= 2) {
    const range = Math.max(...zs) - Math.min(...zs);
    if (range >= 4) violated.add("R_4s");
  }

  // 4_1s (4 consecutivos del mismo nivel al mismo lado, |z|>1)
  if (enabled.has("4_1s")) {
    const hit = levels.some((l) => {
      const s = lastN(seriesOf(l), 4);
      return s.length === 4 && (s.every((z) => z > 1) || s.every((z) => z < -1));
    });
    if (hit) violated.add("4_1s");
  }

  // 10x (10 consecutivos del mismo nivel al mismo lado de la media)
  if (enabled.has("10x")) {
    const hit = levels.some((l) => {
      const s = lastN(seriesOf(l), 10);
      return s.length === 10 && (s.every((z) => z > 0) || s.every((z) => z < 0));
    });
    if (hit) violated.add("10x");
  }

  // 2de3_2s (2 de 3 niveles de la corrida exceden ±2s mismo sentido)
  if (enabled.has("2de3_2s")) {
    const pos = levels.filter((l) => l.z > 2).length;
    const neg = levels.filter((l) => l.z < -2).length;
    if (pos >= 2 || neg >= 2) violated.add("2de3_2s");
  }

  // 3_1s (3 consecutivos del mismo nivel al mismo lado, |z|>1)
  if (enabled.has("3_1s")) {
    const hit = levels.some((l) => {
      const s = lastN(seriesOf(l), 3);
      return s.length === 3 && (s.every((z) => z > 1) || s.every((z) => z < -1));
    });
    if (hit) violated.add("3_1s");
  }

  const status: WestgardStatus =
    violated.size > 0 ? "RECHAZADA" : warnings.length > 0 ? "ADVERTENCIA" : "ACEPTADA";

  return { status, violated: [...violated], warnings };
}
