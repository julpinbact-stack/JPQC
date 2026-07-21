import { prisma } from "@/lib/prisma";
import { zScore } from "@/lib/qc/stats";
import type { LJContext, LJLevel, LJPoint } from "@/lib/lj";

export async function getLJContext(analyteId: string): Promise<LJContext | null> {
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

  const levels: LJLevel[] = [];
  for (const t of analyte.targets) {
    const established =
      t.status === "ESTABLECIDA" && t.establishedMean != null && t.establishedSd != null;
    const mean = established ? t.establishedMean! : t.insertMean;
    const sd = established ? t.establishedSd! : t.insertSd;

    // La gráfica sí trae las corridas RECHAZADAS (evidencia de auditoría);
    // se dibujan aparte y no entran en la línea ni en ningún cálculo.
    const results = await prisma.qcResult.findMany({
      where: { analyteId, lotId: t.lotId },
      include: { run: true },
      orderBy: { run: { fecha: "asc" } },
    });

    const points: LJPoint[] = results.map((r, i) => ({
      resultId: r.id,
      seq: i + 1,
      date: r.run.fecha.toISOString(),
      value: r.value,
      z: zScore(r.value, mean, sd),
      status: r.status,
    }));

    levels.push({
      targetId: t.id,
      lotId: t.lotId,
      lotLabel: `${t.lot.fabricante}${t.lot.nombreComercial ? " " + t.lot.nombreComercial : ""} · ${t.lot.levelLabel}`,
      levelIndex: t.lot.levelIndex,
      mean,
      sd,
      source: t.status as LJLevel["source"],
      insertMean: t.insertMean,
      insertSd: t.insertSd,
      establishedMean: t.establishedMean,
      establishedSd: t.establishedSd,
      nEstablished: t.nEstablished,
      approvedBy: t.approvedBy,
      approvedAt: t.approvedAt ? t.approvedAt.toISOString() : null,
      points,
    });
  }

  return {
    analyteId: analyte.id,
    nombre: analyte.nombre,
    unidad: analyte.unidad,
    decimales: analyte.decimales,
    levels,
  };
}

/**
 * Valores de las corridas seleccionadas para establecer la media/DS.
 *
 * Se releen de la base de datos (no se confía en lo que envía el cliente) y se
 * descartan las RECHAZADAS: tuvieron error analítico y no pueden entrar al
 * cálculo. Solo se aceptan resultados del propio lote-analito del target.
 */
export async function getSelectedRunValues(
  targetId: string,
  resultIds: string[]
): Promise<{ analyteId: string; values: number[] } | null> {
  const target = await prisma.lotAnalyteTarget.findUnique({ where: { id: targetId } });
  if (!target) return null;

  const results = await prisma.qcResult.findMany({
    where: {
      id: { in: resultIds },
      analyteId: target.analyteId,
      lotId: target.lotId,
      status: { not: "RECHAZADA" },
    },
    select: { value: true },
  });

  return { analyteId: target.analyteId, values: results.map((r) => r.value) };
}
