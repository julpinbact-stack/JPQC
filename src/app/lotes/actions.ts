"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { calcInsertCv } from "@/lib/lots";
import type { LotInput, TargetInput, ActionResult } from "@/lib/lots";

const dateStr = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
  .nullish()
  .transform((v) => (v ? new Date(`${v}T00:00:00Z`) : null))
  .or(z.null());

const lotSchema = z.object({
  fabricante: z.string().trim().min(1, "El fabricante es obligatorio").max(120),
  nombreComercial: z
    .string()
    .trim()
    .max(120)
    .nullish()
    .transform((v) => v || null),
  levelLabel: z.string().trim().min(1, "El nivel es obligatorio").max(60),
  levelIndex: z.number().int().min(1).max(10),
  numeroLote: z.string().trim().min(1, "El número de lote es obligatorio").max(60),
  vencimiento: dateStr,
  apertura: dateStr,
  activo: z.boolean(),
});

const targetSchema = z.object({
  analyteId: z.string().min(1, "Selecciona un analito"),
  insertMean: z.number().positive("La media debe ser mayor que 0"),
  insertSd: z.number().nonnegative("La DS no puede ser negativa"),
});

export async function saveLot(
  id: string | null,
  input: LotInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = lotSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    const lot = id
      ? await prisma.controlLot.update({ where: { id }, data: parsed.data })
      : await prisma.controlLot.create({ data: parsed.data });
    revalidatePath("/lotes");
    revalidatePath(`/lotes/${lot.id}`);
    return { ok: true, data: { id: lot.id } };
  } catch {
    return { ok: false, error: "No se pudo guardar el lote." };
  }
}

export async function toggleLotActive(
  id: string,
  activo: boolean
): Promise<ActionResult> {
  try {
    await prisma.controlLot.update({ where: { id }, data: { activo } });
    revalidatePath("/lotes");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar el estado." };
  }
}

export async function saveTarget(
  lotId: string,
  id: string | null,
  input: TargetInput
): Promise<ActionResult> {
  const parsed = targetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { analyteId, insertMean, insertSd } = parsed.data;
  const insertCv = calcInsertCv(insertMean, insertSd);
  try {
    if (id) {
      await prisma.lotAnalyteTarget.update({
        where: { id },
        data: { analyteId, insertMean, insertSd, insertCv },
      });
    } else {
      await prisma.lotAnalyteTarget.create({
        data: { lotId, analyteId, insertMean, insertSd, insertCv },
      });
    }
    revalidatePath(`/lotes/${lotId}`);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "No se pudo guardar. ¿Ya existe una meta para ese analito en este lote?",
    };
  }
}

export async function deleteTarget(
  lotId: string,
  id: string
): Promise<ActionResult> {
  try {
    await prisma.lotAnalyteTarget.delete({ where: { id } });
    revalidatePath(`/lotes/${lotId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la meta." };
  }
}
