import { prisma } from "@/lib/prisma";
import type { ProviderItem, CceResultRow, AnalyteOpt } from "@/lib/cce";

export async function getProviders(): Promise<ProviderItem[]> {
  const providers = await prisma.externalQcProvider.findMany({
    orderBy: { nombre: "asc" },
    include: {
      analyteLinks: { select: { analyteId: true } },
      _count: { select: { results: true } },
    },
  });
  return providers.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    acreditacion: p.acreditacion,
    activo: p.activo,
    analyteIds: p.analyteLinks.map((l) => l.analyteId),
    resultCount: p._count.results,
  }));
}

export async function getCceResults(): Promise<CceResultRow[]> {
  const rows = await prisma.externalQc.findMany({
    orderBy: [{ fecha: "desc" }, { ciclo: "desc" }],
    include: {
      provider: true,
      analyte: { include: { area: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    providerNombre: r.provider.nombre,
    analyteNombre: r.analyte.nombre,
    areaNombre: r.analyte.area.nombre,
    ciclo: r.ciclo,
    nivel: r.nivel,
    labResult: r.labResult,
    targetValue: r.targetValue,
    sdGroup: r.sdGroup,
    sdi: r.sdi,
    biasPct: r.biasPct,
    evaluacion: r.evaluacion,
    fecha: r.fecha ? r.fecha.toISOString().slice(0, 10) : null,
  }));
}

export async function getAllAnalyteOpts(): Promise<AnalyteOpt[]> {
  const analytes = await prisma.analyte.findMany({
    where: { activo: true },
    orderBy: [{ area: { orden: "asc" } }, { nombre: "asc" }],
    include: { area: true },
  });
  return analytes.map((a) => ({ id: a.id, nombre: a.nombre, areaNombre: a.area.nombre }));
}

/** Sesgo promedio (%) del CCE por analito, para alimentar los indicadores. */
export async function getCceBiasByAnalyte(): Promise<Map<string, number>> {
  const rows = await prisma.externalQc.findMany({
    where: { biasPct: { not: null } },
    select: { analyteId: true, biasPct: true },
  });
  const acc = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    if (r.biasPct == null) continue;
    const cur = acc.get(r.analyteId) ?? { sum: 0, n: 0 };
    cur.sum += r.biasPct;
    cur.n += 1;
    acc.set(r.analyteId, cur);
  }
  const out = new Map<string, number>();
  for (const [id, { sum, n }] of acc) out.set(id, sum / n);
  return out;
}
