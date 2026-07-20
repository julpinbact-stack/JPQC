"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { AnalyteInput, ActionResult } from "@/lib/analytes";

const analyteSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  areaId: z.string().min(1, "El área es obligatoria"),
  unidad: z
    .string()
    .trim()
    .max(20)
    .nullish()
    .transform((v) => v || null),
  decimales: z.number().int().min(0).max(6),
  metodo: z
    .string()
    .trim()
    .max(120)
    .nullish()
    .transform((v) => v || null),
  equipo: z
    .string()
    .trim()
    .max(120)
    .nullish()
    .transform((v) => v || null),
  etaSource: z.enum(["CLIA", "RICOS_OPT", "RICOS_DES", "RICOS_MIN", "MANUAL"]),
  etaValue: z.number().nonnegative().nullable(),
  cvi: z.number().nonnegative().nullable(),
  cvg: z.number().nonnegative().nullable(),
  activo: z.boolean(),
});

/** Crea (id null) o actualiza un analito. Al guardar se marca como validado por la PO. */
export async function saveAnalyte(
  id: string | null,
  input: AnalyteInput
): Promise<ActionResult> {
  const parsed = analyteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = { ...parsed.data, validated: true };

  try {
    if (id) {
      await prisma.analyte.update({ where: { id }, data });
    } else {
      await prisma.analyte.create({ data });
    }
  } catch {
    return { ok: false, error: "No se pudo guardar el analito." };
  }

  revalidatePath("/parametros");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleAnalyteActive(
  id: string,
  activo: boolean
): Promise<ActionResult> {
  try {
    await prisma.analyte.update({ where: { id }, data: { activo } });
  } catch {
    return { ok: false, error: "No se pudo actualizar el estado." };
  }
  revalidatePath("/parametros");
  return { ok: true };
}
