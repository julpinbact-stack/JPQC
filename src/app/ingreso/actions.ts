"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAnalyteEntryContext } from "@/server/qc-entry";
import { zScore } from "@/lib/qc/stats";
import { evaluateWestgard, type LevelMeasurement } from "@/lib/qc/westgard";
import type { EntryContext, SaveRunInput, ActionResult } from "@/lib/qc-entry";

export async function loadEntryContext(
  analyteId: string
): Promise<ActionResult<EntryContext>> {
  if (!analyteId) return { ok: false, error: "Analito no válido" };
  const ctx = await getAnalyteEntryContext(analyteId);
  if (!ctx) return { ok: false, error: "No se encontró el analito." };
  return { ok: true, data: ctx };
}

/** Zona horaria del laboratorio. Ancla el "hoy" del servidor sin importar dónde se despliegue. */
const LAB_TIME_ZONE = "America/Bogota";

/**
 * Fecha de hoy ("YYYY-MM-DD") en la zona horaria del laboratorio.
 * Se compara como texto porque el formato ISO ya ordena cronológicamente.
 * Anclarlo a la zona del laboratorio evita que, en horas de la noche, el
 * servidor acepte la fecha de mañana por estar ya en el día siguiente en UTC.
 */
function todayInLabTz(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LAB_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const runDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "Fecha inválida")
  .refine(
    (v) => v <= todayInLabTz(),
    "No se pueden registrar corridas con fecha futura."
  )
  .transform((v) => new Date(`${v}T00:00:00Z`));

const saveSchema = z.object({
  analyteId: z.string().min(1),
  fecha: runDate,
  triggerEventId: z.string().nullish(),
  operador: z.string().trim().max(120).nullish(),
  notas: z.string().trim().max(1000).nullish(),
  correctiveAction: z.string().trim().max(1000).nullish(),
  levels: z
    .array(z.object({ lotId: z.string().min(1), value: z.number().finite() }))
    .min(1, "Ingresa al menos un nivel"),
});

export async function saveRun(
  input: SaveRunInput
): Promise<ActionResult<{ status: string; violated: string[] }>> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  // Recalcular en el servidor (no confiar en el cliente).
  const ctx = await getAnalyteEntryContext(data.analyteId);
  if (!ctx) return { ok: false, error: "No se encontró el analito." };

  const measurements: LevelMeasurement[] = [];
  const perLevel: { lotId: string; value: number; z: number }[] = [];
  for (const lv of data.levels) {
    const ref = ctx.levels.find((c) => c.lotId === lv.lotId);
    if (!ref) return { ok: false, error: "Nivel no válido para este analito." };
    const z = zScore(lv.value, ref.mean, ref.sd);
    measurements.push({ levelIndex: ref.levelIndex, z, history: ref.history });
    perLevel.push({ lotId: lv.lotId, value: lv.value, z });
  }

  const evalResult = evaluateWestgard(measurements, ctx.plan.rules);

  try {
    await prisma.qcRun.create({
      data: {
        fecha: data.fecha,
        triggerEventId: data.triggerEventId || null,
        operador: data.operador || null,
        notas: data.notas || null,
        results: {
          create: perLevel.map((p) => ({
            analyteId: data.analyteId,
            lotId: p.lotId,
            value: p.value,
            zScore: p.z,
            rulesViolated: evalResult.violated,
            status: evalResult.status,
            correctiveAction: data.correctiveAction || null,
          })),
        },
      },
    });
  } catch {
    return { ok: false, error: "No se pudo guardar la corrida." };
  }

  revalidatePath("/ingreso");
  revalidatePath("/levey-jennings");
  revalidatePath("/");
  return { ok: true, data: { status: evalResult.status, violated: evalResult.violated } };
}
