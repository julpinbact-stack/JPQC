import { prisma } from "@/lib/prisma";
import type { LotRow, LotDetail, AnalyteOption } from "@/lib/lots";

export type { LotRow, LotDetail, TargetRow, AnalyteOption } from "@/lib/lots";

const toISODate = (d: Date | null): string | null =>
  d ? d.toISOString().slice(0, 10) : null;

export async function getLots(): Promise<LotRow[]> {
  const lots = await prisma.controlLot.findMany({
    orderBy: [{ fabricante: "asc" }, { levelIndex: "asc" }],
    include: { _count: { select: { targets: true } } },
  });
  return lots.map((l) => ({
    id: l.id,
    fabricante: l.fabricante,
    nombreComercial: l.nombreComercial,
    levelLabel: l.levelLabel,
    levelIndex: l.levelIndex,
    numeroLote: l.numeroLote,
    vencimiento: toISODate(l.vencimiento),
    apertura: toISODate(l.apertura),
    activo: l.activo,
    targetCount: l._count.targets,
  }));
}

export async function getLotDetail(id: string): Promise<LotDetail | null> {
  const l = await prisma.controlLot.findUnique({
    where: { id },
    include: {
      _count: { select: { targets: true } },
      targets: {
        include: { analyte: { include: { area: true } } },
        orderBy: { analyte: { nombre: "asc" } },
      },
    },
  });
  if (!l) return null;
  return {
    id: l.id,
    fabricante: l.fabricante,
    nombreComercial: l.nombreComercial,
    levelLabel: l.levelLabel,
    levelIndex: l.levelIndex,
    numeroLote: l.numeroLote,
    vencimiento: toISODate(l.vencimiento),
    apertura: toISODate(l.apertura),
    activo: l.activo,
    targetCount: l._count.targets,
    targets: l.targets.map((t) => ({
      id: t.id,
      analyteId: t.analyteId,
      analyteNombre: t.analyte.nombre,
      areaNombre: t.analyte.area.nombre,
      unidad: t.analyte.unidad,
      insertMean: t.insertMean,
      insertSd: t.insertSd,
      insertCv: t.insertCv,
      status: t.status,
    })),
  };
}

export async function getActiveAnalytes(): Promise<AnalyteOption[]> {
  const analytes = await prisma.analyte.findMany({
    where: { activo: true },
    orderBy: [{ area: { orden: "asc" } }, { nombre: "asc" }],
    include: { area: true },
  });
  return analytes.map((a) => ({
    id: a.id,
    nombre: a.nombre,
    areaNombre: a.area.nombre,
    unidad: a.unidad,
  }));
}
