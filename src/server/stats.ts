import { prisma } from "@/lib/prisma";

export type DashboardStats = {
  connected: boolean;
  areas: number;
  analytes: number;
  lots: number;
  triggerEvents: number;
};

/** Conteos para el panel. Degrada con gracia si la base aún no está disponible. */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [areas, analytes, lots, triggerEvents] = await Promise.all([
      prisma.area.count(),
      prisma.analyte.count(),
      prisma.controlLot.count(),
      prisma.triggerEvent.count(),
    ]);
    return { connected: true, areas, analytes, lots, triggerEvents };
  } catch {
    return { connected: false, areas: 0, analytes: 0, lots: 0, triggerEvents: 0 };
  }
}
