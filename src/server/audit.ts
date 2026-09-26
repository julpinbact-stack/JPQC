import { prisma } from "@/lib/prisma";
import { addDays, worstStatus, type AuditRow, type AuditCell } from "@/lib/audit";

export type AuditAnalyteOption = { id: string; nombre: string; areaNombre: string };

/**
 * Analitos con al menos un resultado registrado. Incluye analitos o lotes ya
 * inactivos: la auditoría debe poder revisar corridas históricas.
 */
export async function getAuditAnalytes(): Promise<AuditAnalyteOption[]> {
  const analytes = await prisma.analyte.findMany({
    where: { results: { some: {} } },
    orderBy: [{ area: { orden: "asc" } }, { nombre: "asc" }],
    select: { id: true, nombre: true, area: { select: { nombre: true } } },
  });
  return analytes.map((a) => ({ id: a.id, nombre: a.nombre, areaNombre: a.area.nombre }));
}

/**
 * Corridas del rango [desde, hasta] (días completos, inclusive), una fila por
 * corrida con sus niveles. Se muestran los valores y z-scores tal como se
 * guardaron al ingresar: es la evidencia de lo que el sistema calculó entonces.
 */
export async function getAuditRows(params: {
  desde: string;
  hasta: string;
  analyteId?: string;
}): Promise<AuditRow[]> {
  const runs = await prisma.qcRun.findMany({
    where: {
      // Las corridas se guardan a medianoche UTC del día de la corrida.
      fecha: {
        gte: new Date(`${params.desde}T00:00:00Z`),
        lt: new Date(`${addDays(params.hasta, 1)}T00:00:00Z`),
      },
      results: params.analyteId ? { some: { analyteId: params.analyteId } } : { some: {} },
    },
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    include: {
      triggerEvent: { select: { nombre: true } },
      results: {
        include: {
          analyte: { include: { area: { select: { nombre: true } } } },
          lot: true,
        },
      },
    },
  });

  const rows: AuditRow[] = [];
  for (const run of runs) {
    const first = run.results[0];
    if (!first) continue;

    const levels: Record<number, AuditCell> = {};
    const violated = new Set<string>();
    for (const r of run.results) {
      levels[r.lot.levelIndex] = {
        resultId: r.id,
        lotLabel: `${r.lot.fabricante}${r.lot.nombreComercial ? " " + r.lot.nombreComercial : ""} · ${r.lot.levelLabel}`,
        numeroLote: r.lot.numeroLote,
        value: r.value,
        z: r.zScore,
      };
      if (Array.isArray(r.rulesViolated)) {
        for (const rule of r.rulesViolated) if (typeof rule === "string") violated.add(rule);
      }
    }

    const status = worstStatus(run.results.map((r) => r.status));
    // La acción correctiva y el seguimiento se guardan igual en cada nivel.
    const correctiveAction = run.results.find((r) => r.correctiveAction)?.correctiveAction ?? null;
    const followUp = run.results.find((r) => r.comment)?.comment ?? null;

    rows.push({
      runId: run.id,
      fecha: run.fecha.toISOString(),
      analyteId: first.analyteId,
      analyteNombre: first.analyte.nombre,
      areaNombre: first.analyte.area.nombre,
      unidad: first.analyte.unidad,
      decimales: first.analyte.decimales,
      levels,
      trigger: run.triggerEvent?.nombre ?? null,
      operador: run.operador,
      notas: run.notas,
      correctiveAction,
      followUp,
      status,
      violated: [...violated],
    });
  }
  return rows;
}
