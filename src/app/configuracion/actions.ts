"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/config";

const profileSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  nit: z.string().trim().max(40).nullish().transform((v) => v || null),
  direccion: z.string().trim().max(200).nullish().transform((v) => v || null),
  responsable: z.string().trim().max(120).nullish().transform((v) => v || null),
});

export async function saveLabProfile(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  try {
    const existing = await prisma.labProfile.findFirst();
    if (existing) await prisma.labProfile.update({ where: { id: existing.id }, data: parsed.data });
    else await prisma.labProfile.create({ data: parsed.data });
    revalidatePath("/configuracion");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar el perfil." };
  }
}

const areaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  defaultLevels: z.number().int().min(1).max(10),
  orden: z.number().int().min(0).max(999),
  activo: z.boolean(),
});

export async function saveArea(id: string | null, input: unknown): Promise<ActionResult> {
  const parsed = areaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  try {
    if (id) await prisma.area.update({ where: { id }, data: parsed.data });
    else await prisma.area.create({ data: parsed.data });
    revalidatePath("/configuracion");
    revalidatePath("/parametros");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar el área (¿nombre duplicado?)." };
  }
}

const triggerSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  orden: z.number().int().min(0).max(999),
  activo: z.boolean(),
});

export async function saveTrigger(id: string | null, input: unknown): Promise<ActionResult> {
  const parsed = triggerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  try {
    if (id) await prisma.triggerEvent.update({ where: { id }, data: parsed.data });
    else await prisma.triggerEvent.create({ data: parsed.data });
    revalidatePath("/configuracion");
    revalidatePath("/ingreso");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar el evento (¿nombre duplicado?)." };
  }
}
