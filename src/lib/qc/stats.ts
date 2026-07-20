// Estadística base del control de calidad. Funciones puras (sin dependencias).

/** Media aritmética. */
export function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Desviación estándar muestral (n − 1). Requiere al menos 2 datos. */
export function sd(xs: number[]): number {
  const n = xs.length;
  if (n < 2) return NaN;
  const m = mean(xs);
  const ss = xs.reduce((a, b) => a + (b - m) ** 2, 0);
  return Math.sqrt(ss / (n - 1));
}

/** Coeficiente de variación (%). */
export function cv(meanValue: number, sdValue: number): number {
  if (!meanValue) return NaN;
  return (sdValue / meanValue) * 100;
}

/** Puntaje z = (valor − media) / DS. */
export function zScore(value: number, meanValue: number, sdValue: number): number {
  if (!sdValue) return NaN;
  return (value - meanValue) / sdValue;
}

/** Estadística acumulada de una serie: n, media, DS, CV%. */
export function seriesStats(xs: number[]): {
  n: number;
  mean: number;
  sd: number;
  cv: number;
} {
  const m = mean(xs);
  const s = sd(xs);
  return { n: xs.length, mean: m, sd: s, cv: cv(m, s) };
}
