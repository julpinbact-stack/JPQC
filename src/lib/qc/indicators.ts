// Indicadores de competencia analítica. Funciones puras.
import { sigmaMetric } from "./sigma";

/** Error total (%) = |sesgo| + 2·CV (95% de confianza). */
export function totalError(biasPct: number, cvPct: number): number {
  return Math.abs(biasPct) + 2 * cvPct;
}

/**
 * Incertidumbre expandida U (%) = k·√(u_prec² + u_sesgo²), k=2.
 * u_prec = CV; u_sesgo del CCE (0 si aún no hay CCE).
 */
export function expandedUncertainty(cvPct: number, uBiasPct = 0): number {
  return 2 * Math.sqrt(cvPct ** 2 + uBiasPct ** 2);
}

export type Indicators = {
  etaPct: number | null;
  cvPct: number | null;
  biasPct: number | null;
  tePct: number | null;
  sigma: number | null;
  uncertaintyU: number | null;
  competent: boolean | null; // ET < ETa
};

export function computeIndicators(
  etaPct: number | null,
  cvPct: number | null,
  biasPct: number | null,
  uBiasPct = 0
): Indicators {
  const cv = cvPct ?? null;
  const bias = biasPct ?? 0;
  const te = cv != null ? totalError(bias, cv) : null;
  const sigma =
    etaPct != null && cv != null && cv > 0 ? sigmaMetric(etaPct, bias, cv) : null;
  const u = cv != null ? expandedUncertainty(cv, uBiasPct) : null;
  const competent = etaPct != null && te != null ? te < etaPct : null;
  return {
    etaPct,
    cvPct: cv,
    biasPct: cvPct != null ? bias : null,
    tePct: te,
    sigma,
    uncertaintyU: u,
    competent,
  };
}
