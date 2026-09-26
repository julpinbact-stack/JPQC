"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo";
import { todayInLabTz } from "@/lib/lab-time";
import { appendFollowUp } from "@/lib/audit";
import type { ActionResult } from "@/lib/qc-entry";

const followUpSchema = z.object({
  runId: z.string().min(1, "Corrida no válida"),
  entry: z.string().trim().min(1, "Escribe la observación de seguimiento").max(1000),
});

/**
 * Agrega una entrada a la bitácora de seguimiento de una corrida.
 *
 * Es solo de adición: no modifica el valor, el z-score, el estado ni las
 * observaciones originales del ingreso, y conserva las entradas anteriores.
 * Cada entrada queda fechada y firmada con el usuario de la sesión.
 */
export async function addFollowUp(input: {
  runId: string;
  entry: string;
}): Promise<ActionResult<{ followUp: string }>> {
  const parsed = followUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { runId, entry } = parsed.data;
  const author = isDemoMode() ? "demo" : await getSessionUser();

  try {
    const followUp = await prisma.$transaction(async (tx) => {
      const current = await tx.qcResult.findFirst({
        where: { runId },
        select: { comment: true },
        orderBy: { createdAt: "asc" },
      });
      if (!current) throw new Error("not-found");
      const next = appendFollowUp(current.comment, entry, todayInLabTz(), author);
      await tx.qcResult.updateMany({ where: { runId }, data: { comment: next } });
      return next;
    });
    revalidatePath("/auditoria");
    return { ok: true, data: { followUp } };
  } catch (e) {
    if (e instanceof Error && e.message === "not-found") {
      return { ok: false, error: "No se encontró la corrida." };
    }
    return { ok: false, error: "No se pudo guardar el seguimiento." };
  }
}
