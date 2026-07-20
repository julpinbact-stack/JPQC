import { prisma } from "@/lib/prisma";
import type { LabProfileData, AreaItem, TriggerItem } from "@/lib/config";

export async function getLabProfile(): Promise<LabProfileData & { id: string | null }> {
  const p = await prisma.labProfile.findFirst();
  return {
    id: p?.id ?? null,
    nombre: p?.nombre ?? "",
    nit: p?.nit ?? null,
    direccion: p?.direccion ?? null,
    responsable: p?.responsable ?? null,
  };
}

export async function getAreasFull(): Promise<AreaItem[]> {
  return prisma.area.findMany({
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true, defaultLevels: true, orden: true, activo: true },
  });
}

export async function getTriggersFull(): Promise<TriggerItem[]> {
  return prisma.triggerEvent.findMany({
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true, orden: true, activo: true },
  });
}
