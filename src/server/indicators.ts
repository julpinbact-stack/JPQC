import { prisma } from "@/lib/prisma";
import { mean, sd, cv } from "@/lib/qc/stats";
import { computeIndicators } from "@/lib/qc/indicators";
import { selectRulesBySigma } from "@/lib/qc/sigma";
import { getCceBiasByAnalyte } from "@/server/cce";

const MIN_N = 5;

export type IndicatorRow = {
  analyteId: string;
  nombre: string;
  areaNombre: string;
  unidad: string | null;
  n: number;
  levelCount: number;
  etaPct: number | null;
  cvPct: number | null;
  biasPct: number | null;
  tePct: number | null;
  sigma: number | null;
  uncertaintyU: number | null;
  competent: boolean | null;
  rules: string[];
  planLabel: string;
  hasEnoughData: boolean;
  biasSource: "CCE" | "inserto" | null;
};

export async function getIndicators(): Promise<IndicatorRow[]> {
  const analytes = await prisma.analyte.findMany({
    where: { activo: true, targets: { some: { lot: { activo: true } } } },
    orderBy: [{ area: { orden: "asc" } }, { nombre: "asc" }],
    include: {
      area: true,
      targets: {
        where: { lot: { activo: true } },
        include: { lot: true },
      },
    },
  });

  const cceBias = await getCceBiasByAnalyte();
  const rows: IndicatorRow[] = [];

  for (const a of analytes) {
    const levelCvs: number[] = [];
    const levelBiases: number[] = [];
    let totalN = 0;

    for (const t of a.targets) {
      // Se excluyen las corridas RECHAZADAS: se repitieron tras la acción
      // correctiva y no representan el desempeño del método, así que no deben
      // entrar al CV por nivel ni al sesgo contra el inserto. Las ADVERTENCIA
      // sí cuentan (fueron aceptadas y se liberaron pacientes).
      const results = await prisma.qcResult.findMany({
        where: { analyteId: a.id, lotId: t.lotId, status: { not: "RECHAZADA" } },
        select: { value: true },
      });
      const values = results.map((r) => r.value);
      // n refleja solo los datos que realmente entraron al cálculo.
      totalN += values.length;
      if (values.length >= MIN_N) {
        const m = mean(values);
        levelCvs.push(cv(m, sd(values)));
        if (t.insertMean > 0) levelBiases.push(((m - t.insertMean) / t.insertMean) * 100);
      }
    }

    const cvPct = levelCvs.length > 0 ? mean(levelCvs) : null;
    const insertBias = levelBiases.length > 0 ? mean(levelBiases) : null;

    // El sesgo del CCE tiene prioridad; alimenta también la incertidumbre (u_sesgo).
    const cceB = cceBias.get(a.id);
    const effBias = cceB != null ? cceB : insertBias;
    const uBias = cceB != null ? Math.abs(cceB) : 0;
    const biasSource: IndicatorRow["biasSource"] =
      cvPct == null ? null : cceB != null ? "CCE" : "inserto";

    const ind = computeIndicators(a.etaValue, cvPct, effBias ?? 0, uBias);
    const plan = selectRulesBySigma(ind.sigma, a.targets.length);

    rows.push({
      analyteId: a.id,
      nombre: a.nombre,
      areaNombre: a.area.nombre,
      unidad: a.unidad,
      n: totalN,
      levelCount: a.targets.length,
      etaPct: a.etaValue,
      cvPct: ind.cvPct,
      biasPct: cvPct != null ? (effBias ?? 0) : null,
      tePct: ind.tePct,
      sigma: ind.sigma,
      uncertaintyU: ind.uncertaintyU,
      competent: ind.competent,
      rules: plan.rules,
      planLabel: plan.label,
      hasEnoughData: cvPct != null,
      biasSource,
    });
  }

  return rows;
}
