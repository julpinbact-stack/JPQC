"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getLJContext, getSelectedRunValues } from "@/server/lj";
import { mean as meanOf, sd as sdOf } from "@/lib/qc/stats";
import type { LJContext, EstablishTargetInput, ActionResult } from "@/lib/lj";

export async function loadLJ(analyteId: string): Promise<ActionResult<LJContext>> {
  if (!analyteId) return { ok: false, error: "Analito no válido" };
  const ctx = await getLJContext(analyteId);
  if (!ctx) return { ok: false, error: "No se encontró el analito." };
  return { ok: true, data: ctx };
}

const establishSchema = z.object({
  targetId: z.string().min(1, "Nivel no válido"),
  resultIds: z
    .array(z.string().min(1))
    .min(2, "Se necesitan al menos 2 corridas para calcular la DS."),
  approvedBy: z
    .string()
    .trim()
    .min(1, "Indica el nombre de quien aprueba")
    .max(120),
});

/**
 * Establece la media/DS del laboratorio para un lote-nivel × analito.
 *
 * La media y la DS se recalculan en el servidor a partir de los valores reales
 * de las corridas seleccionadas (las RECHAZADAS se descartan aunque lleguen en
 * la selección). No se permite aprobar con menos de 2 datos porque la DS
 * muestral no existe; por debajo de 20 el panel advierte, pero deja aprobar.
 */
export async function establishTarget(
  input: EstablishTargetInput
): Promise<ActionResult<{ mean: number; sd: number; n: number }>> {
  const parsed = establishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { targetId, resultIds, approvedBy } = parsed.data;

  const selected = await getSelectedRunValues(targetId, Array.from(new Set(resultIds)));
  if (!selected) return { ok: false, error: "No se encontró el nivel de control." };

  const values = selected.values;
  if (values.length < 2) {
    return {
      ok: false,
      error: "Las corridas seleccionadas no son válidas o son menos de 2.",
    };
  }

  const newMean = meanOf(values);
  const newSd = sdOf(values);
  if (!Number.isFinite(newMean) || !Number.isFinite(newSd)) {
    return { ok: false, error: "No se pudo calcular la media/DS con esa selección." };
  }

  try {
    await prisma.lotAnalyteTarget.update({
      where: { id: targetId },
      data: {
        establishedMean: newMean,
        establishedSd: newSd,
        nEstablished: values.length,
        status: "ESTABLECIDA",
        approvedBy,
        approvedAt: new Date(),
      },
    });
  } catch {
    return { ok: false, error: "No se pudo guardar la media/DS establecida." };
  }

  revalidatePath("/levey-jennings");
  revalidatePath("/ingreso");
  revalidatePath("/");
  return { ok: true, data: { mean: newMean, sd: newSd, n: values.length } };
}

/**
 * Vuelve a los valores del inserto (PROVISIONAL).
 *
 * Se limpian media/DS establecidas, n y la firma de aprobación: la reversión
 * existe para deshacer una aprobación equivocada, así que no debe quedar
 * ningún valor de laboratorio a medias en el registro.
 */
export async function revertTargetToProvisional(
  targetId: string
): Promise<ActionResult> {
  if (!targetId) return { ok: false, error: "Nivel no válido" };
  try {
    await prisma.lotAnalyteTarget.update({
      where: { id: targetId },
      data: {
        establishedMean: null,
        establishedSd: null,
        nEstablished: 0,
        status: "PROVISIONAL",
        approvedBy: null,
        approvedAt: null,
      },
    });
  } catch {
    return { ok: false, error: "No se pudo revertir a provisional." };
  }

  revalidatePath("/levey-jennings");
  revalidatePath("/ingreso");
  revalidatePath("/");
  return { ok: true };
}
