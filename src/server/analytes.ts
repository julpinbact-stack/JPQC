import { prisma } from "@/lib/prisma";
import type { AreaGroup, AreaOption } from "@/lib/analytes";

// Re-export para conveniencia de los componentes de servidor.
export type { AreaGroup, AreaOption, AnalyteRow } from "@/lib/analytes";

/** Analitos agrupados por área (áreas activas ordenadas). */
export async function getAnalytesGrouped(): Promise<AreaGroup[]> {
  const areas = await prisma.area.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
    include: {
      analytes: {
        orderBy: { nombre: "asc" },
      },
    },
  });

  return areas.map((a) => ({
    area: { id: a.id, nombre: a.nombre },
    analytes: a.analytes.map((an) => ({
      id: an.id,
      nombre: an.nombre,
      areaId: an.areaId,
      areaNombre: a.nombre,
      unidad: an.unidad,
      decimales: an.decimales,
      metodo: an.metodo,
      equipo: an.equipo,
      etaValue: an.etaValue,
      etaSource: an.etaSource,
      cvi: an.cvi,
      cvg: an.cvg,
      validated: an.validated,
      activo: an.activo,
    })),
  }));
}

export async function getAreaOptions(): Promise<AreaOption[]> {
  return prisma.area.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true },
  });
}
