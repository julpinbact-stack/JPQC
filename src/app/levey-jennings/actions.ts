"use server";

import { getLJContext } from "@/server/lj";
import type { LJContext, ActionResult } from "@/lib/lj";

export async function loadLJ(analyteId: string): Promise<ActionResult<LJContext>> {
  if (!analyteId) return { ok: false, error: "Analito no válido" };
  const ctx = await getLJContext(analyteId);
  if (!ctx) return { ok: false, error: "No se encontró el analito." };
  return { ok: true, data: ctx };
}
