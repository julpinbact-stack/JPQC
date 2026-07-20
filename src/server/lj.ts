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

    const results = await prisma.qcResult.findMany({
      where: { analyteId, lotId: t.lotId },
      include: { run: true },
      orderBy: { run: { fecha: "asc" } },
    });

    const points: LJPoint[] = results.map((r, i) => ({
      seq: i + 1,
      date: r.run.fecha.toISOString(),
      value: r.value,
      z: zScore(r.value, mean, sd),
      status: r.status,
    }));

    levels.push({
      lotId: t.lotId,
      lotLabel: `${t.lot.fabricante}${t.lot.nombreComercial ? " " + t.lot.nombreComercial : ""} · ${t.lot.levelLabel}`,
      levelIndex: t.lot.levelIndex,
      mean,
      sd,
      source: t.status as LJLevel["source"],
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
