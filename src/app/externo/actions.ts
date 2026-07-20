"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { calcBiasPct, calcSDI } from "@/lib/cce";
import type { ProviderInput, CceResultInput, ActionResult } from "@/lib/cce";

const providerSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  acreditacion: z.string().trim().max(80).nullish().transform((v) => v || null),
  activo: z.boolean(),
  analyteIds: z.array(z.string()),
});

export async function saveProvider(
  id: string | null,
  input: ProviderInput
): Promise<ActionResult> {
  const parsed = providerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { nombre, acreditacion, activo, analyteIds } = parsed.data;
  try {
    await prisma.$transaction(async (tx) => {
      let providerId = id;
      if (id) {
        await tx.externalQcProvider.update({ where: { id }, data: { nombre, acreditacion, activo } });
        await tx.providerAnalyte.deleteMany({ where: { providerId: id } });
      } else {
        const p = await tx.externalQcProvider.create({ data: { nombre, acreditacion, activo } });
        providerId = p.id;
      }
      if (analyteIds.length > 0) {
        await tx.providerAnalyte.createMany({
          data: analyteIds.map((analyteId) => ({ providerId: providerId!, analyteId })),
          skipDuplicates: true,
        });
      }
    });
    revalidatePath("/externo");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar el proveedor (¿nombre duplicado?)." };
  }
}

const resultSchema = z.object({
  providerId: z.string().min(1, "Selecciona un proveedor"),
  analyteId: z.string().min(1, "Selecciona un analito"),
  ciclo: z.string().trim().min(1, "El ciclo es obligatorio").max(60),
  nivel: z.string().trim().max(40).nullish().transform((v) => v || null),
  labResult: z.number().finite(),
  targetValue: z.number().finite().nullish(),
  sdGroup: z.number().finite().nonnegative().nullish(),
  evaluacion: z.string().trim().max(200).nullish().transform((v) => v || null),
  notas: z.string().trim().max(1000).nullish().transform((v) => v || null),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
});

export async function saveCceResult(
  id: string | null,
  input: CceResultInput
): Promise<ActionResult> {
  const parsed = resultSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const d = parsed.data;
  const targetValue = d.targetValue ?? null;
  const sdGroup = d.sdGroup ?? null;
  const biasPct = calcBiasPct(d.labResult, targetValue);
  const sdi = calcSDI(d.labResult, targetValue, sdGroup);
  const fecha = d.fecha ? new Date(`${d.fecha}T00:00:00Z`) : null;

  try {
    const data = {
      providerId: d.providerId,
      analyteId: d.analyteId,
      ciclo: d.ciclo,
      nivel: d.nivel,
      labResult: d.labResult,
      targetValue,
      sdGroup,
      biasPct,
      sdi,
      evaluacion: d.evaluacion,
      notas: d.notas,
      fecha,
    };
    if (id) await prisma.externalQc.update({ where: { id }, data });
    else await prisma.externalQc.create({ data });
    revalidatePath("/externo");
    revalidatePath("/indicadores");
    revalidatePath("/informe");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar el resultado." };
  }
}

export async function deleteCceResult(id: string): Promise<ActionResult> {
  try {
    await prisma.externalQc.delete({ where: { id } });
    revalidatePath("/externo");
    revalidatePath("/indicadores");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar." };
  }
}
