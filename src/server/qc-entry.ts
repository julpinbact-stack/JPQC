import { prisma } from "@/lib/prisma";
import { mean, sd, cv, zScore } from "@/lib/qc/stats";
import { sigmaMetric, selectRulesBySigma } from "@/lib/qc/sigma";
import type {
  EntryAnalyte,
  EntryContext,
  EntryLevel,
  TriggerOption,
} from "@/lib/qc-entry";

const MIN_N_FOR_STATS = 5;

/** Analitos que tienen al menos un lote activo con meta de inserto. */
export async function getEntryAnalytes(): Promise<EntryAnalyte[]> {
  const analytes = await prisma.analyte.findMany({
    where: { activo: true, targets: { some: { lot: { activo: true } } } },
    orderBy: [{ area: { orden: "asc" } }, { nombre: "asc" }],
    include: {
      area: true,
      targets: { where: { lot: { activo: true } }, select: { id: true } },
    },
  });
  return analytes.map((a) => ({
    id: a.id,
    nombre: a.nombre,
    areaNombre: a.area.nombre,
    levelCount: a.targets.length,
  }));
}

export async function getTriggerEvents(): Promise<TriggerOption[]> {
  return prisma.triggerEvent.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true },
  });
}

/** Contexto de ingreso para un analito: niveles, media/DS efectivas, historial y Sigma. */
export async function getAnalyteEntryContext(
  analyteId: string
): Promise<EntryContext | null> {
  const analyte = await prisma.analyte.findUnique({
    where: { id: analyteId },
    include: {
      targets: {
        where: { lot: { activo: true } },
        include: { lot: true },
        orderBy: { lot: { levelIndex: "asc" } },
      },
    },
  });
  if (!analyte) return null;

  const levelCvs: number[] = [];
  const levelBiases: number[] = [];
  const insertCvs: number[] = [];
  const levels: EntryLevel[] = [];

  for (const t of analyte.targets) {
    const established = t.status === "ESTABLECIDA" && t.establishedMean != null && t.establishedSd != null;
    const effMean = established ? t.establishedMean! : t.insertMean;
    const effSd = established ? t.establishedSd! : t.insertSd;
    if (t.insertCv != null) insertCvs.push(t.insertCv);

    // Historial de resultados de este nivel (cronológico)
    const results = await prisma.qcResult.findMany({
      where: { analyteId, lotId: t.lotId },
      include: { run: true },
      orderBy: { run: { fecha: "asc" } },
    });
    const values = results.map((r) => r.value);
    const history = values.map((v) => zScore(v, effMean, effSd));

    // Estadística acumulada para Sigma (si hay suficientes datos)
    if (values.length >= MIN_N_FOR_STATS) {
      const m = mean(values);
      levelCvs.push(cv(m, sd(values)));
      if (t.insertMean > 0) levelBiases.push(((m - t.insertMean) / t.insertMean) * 100);
    }

    levels.push({
      lotId: t.lotId,
      lotLabel: `${t.lot.fabricante}${t.lot.nombreComercial ? " " + t.lot.nombreComercial : ""} · ${t.lot.levelLabel}`,
      levelIndex: t.lot.levelIndex,
      mean: effMean,
      sd: effSd,
      source: t.status as EntryLevel["source"],
      history,
    });
  }

  // CV para Sigma: acumulado si hay datos; si no, el mayor %CV del inserto.
  const cvPct =
    levelCvs.length > 0
      ? mean(levelCvs)
      : insertCvs.length > 0
        ? Math.max(...insertCvs)
        : null;
  const biasPct = levelBiases.length > 0 ? mean(levelBiases) : 0;

  const sigma =
    analyte.etaValue != null && cvPct != null && cvPct > 0
      ? sigmaMetric(analyte.etaValue, biasPct, cvPct)
      : null;

  const plan = selectRulesBySigma(sigma, levels.length);

  return {
    analyteId: analyte.id,
    nombre: analyte.nombre,
    unidad: analyte.unidad,
    decimales: analyte.decimales,
    etaValue: analyte.etaValue,
    cvPct,
    biasPct,
    sigma,
    plan,
    levels,
  };
}
