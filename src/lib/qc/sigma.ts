// Métrica Sigma y selección automática de reglas (Westgard Sigma Rules).

/** σ = (ETa − |sesgo|) / CV, todo en %. */
export function sigmaMetric(
  etaPct: number,
  biasPct: number,
  cvPct: number
): number {
  if (!cvPct || cvPct <= 0) return NaN;
  return (etaPct - Math.abs(biasPct)) / cvPct;
}

export type SigmaLevel =
  | "excelente"
  | "bueno"
  | "aceptable"
  | "mejorar"
  | "inaceptable"
  | "sin_dato";

export type SigmaPlan = {
  sigma: number | null;
  rules: string[]; // reglas de rechazo habilitadas
  n: number; // número de controles recomendado
  level: SigmaLevel;
  label: string;
};

const BASE_MULTI = ["1_3s", "2_2s", "R_4s", "4_1s", "10x"];

/**
 * Selecciona el conjunto de reglas y el N recomendado según Sigma.
 * Para 3 niveles se añaden las reglas 2de3_2s y 3_1s cuando hay multirregla.
 * Si sigma es null/NaN (aún sin datos), se usa la multirregla completa (conservador).
 */
export function selectRulesBySigma(
  sigma: number | null,
  levels = 2
): SigmaPlan {
  let rules: string[];
  let n: number;
  let level: SigmaLevel;
  let label: string;

  if (sigma == null || Number.isNaN(sigma)) {
    rules = [...BASE_MULTI];
    n = levels;
    level = "sin_dato";
    label = "Sin datos suficientes — multirregla (provisional)";
  } else if (sigma >= 6) {
    rules = ["1_3s"];
    n = 2;
    level = "excelente";
    label = "Excelente (σ ≥ 6) — regla simple 1₃s";
  } else if (sigma >= 5) {
    rules = ["1_3s", "2_2s", "R_4s"];
    n = 2;
    level = "bueno";
    label = "Bueno (σ ≈ 5)";
  } else if (sigma >= 4) {
    rules = [...BASE_MULTI];
    n = 4;
    level = "aceptable";
    label = "Aceptable (σ ≈ 4)";
  } else if (sigma >= 3) {
    rules = [...BASE_MULTI];
    n = 4;
    level = "mejorar";
    label = "Proceso a mejorar (σ 3–4)";
  } else {
    rules = [...BASE_MULTI];
    n = 4;
    level = "inaceptable";
    label = "Proceso inaceptable (σ < 3)";
  }

  // Extensiones para 3 niveles cuando hay multirregla activa.
  if (levels >= 3 && rules.length > 1) {
    rules = [...rules, "2de3_2s", "3_1s"];
  }

  return { sigma, rules, n, level, label };
}
