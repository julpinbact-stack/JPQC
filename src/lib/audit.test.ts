import { describe, it, expect } from "vitest";
import {
  resolveRange,
  applyAuditFilter,
  levelColumns,
  summarize,
  worstStatus,
  appendFollowUp,
  parseAuditFilter,
  type AuditRow,
} from "./audit";

const row = (over: Partial<AuditRow>): AuditRow => ({
  runId: "r",
  fecha: "2026-09-01T00:00:00.000Z",
  analyteId: "a",
  analyteNombre: "Glucosa",
  areaNombre: "Química",
  unidad: "mg/dL",
  decimales: 1,
  levels: {},
  trigger: null,
  operador: null,
  notas: null,
  correctiveAction: null,
  followUp: null,
  status: "ACEPTADA",
  violated: [],
  ...over,
});

describe("resolveRange", () => {
  it("usa los últimos 30 días por defecto", () => {
    expect(resolveRange(undefined, undefined, "2026-09-26")).toEqual({
      desde: "2026-08-27",
      hasta: "2026-09-26",
    });
  });
  it("respeta fechas válidas e intercambia si vienen invertidas", () => {
    expect(resolveRange("2026-09-10", "2026-09-01", "2026-09-26")).toEqual({
      desde: "2026-09-01",
      hasta: "2026-09-10",
    });
  });
  it("descarta fechas inexistentes", () => {
    expect(resolveRange("2026-02-31", "2026-03-10", "2026-09-26").desde).toBe("2026-02-08");
  });
  it("recorta rangos mayores al máximo", () => {
    expect(resolveRange("2020-01-01", "2026-09-26", "2026-09-26").desde).toBe("2025-09-25");
  });
});

describe("filtros y resumen", () => {
  const rows = [
    row({ runId: "1" }),
    row({ runId: "2", status: "ADVERTENCIA" }),
    row({ runId: "3", status: "RECHAZADA", correctiveAction: "Recalibración" }),
    row({ runId: "4", notas: "   " }),
    row({ runId: "5", followUp: "[01/09/2026 · x] ok" }),
  ];

  it("filtra por observaciones ignorando texto en blanco", () => {
    expect(applyAuditFilter(rows, "observaciones").map((r) => r.runId)).toEqual(["3", "5"]);
  });
  it("filtra no aceptadas", () => {
    expect(applyAuditFilter(rows, "no-aceptadas").map((r) => r.runId)).toEqual(["2", "3"]);
  });
  it("resume conteos", () => {
    expect(summarize(rows)).toEqual({
      total: 5,
      aceptadas: 3,
      advertencias: 1,
      rechazadas: 1,
      conObservaciones: 2,
    });
  });
  it("filtro desconocido cae a todas", () => {
    expect(parseAuditFilter("xyz")).toBe("todas");
  });
});

describe("levelColumns", () => {
  it("siempre muestra 1–3 y agrega niveles extra", () => {
    expect(levelColumns([])).toEqual([1, 2, 3]);
    const cell = { resultId: "x", lotLabel: "", numeroLote: "", value: 1, z: 0 };
    expect(levelColumns([row({ levels: { 1: cell, 4: cell } })])).toEqual([1, 2, 3, 4]);
  });
});

describe("worstStatus", () => {
  it("prioriza rechazo sobre advertencia", () => {
    expect(worstStatus(["ACEPTADA", "ADVERTENCIA", "RECHAZADA"])).toBe("RECHAZADA");
    expect(worstStatus(["ACEPTADA", "ADVERTENCIA"])).toBe("ADVERTENCIA");
    expect(worstStatus(["ACEPTADA"])).toBe("ACEPTADA");
  });
});

describe("appendFollowUp", () => {
  it("crea la primera entrada firmada", () => {
    expect(appendFollowUp(null, " Se repitió ", "2026-09-26", "qa@lab.co")).toBe(
      "[26/09/2026 · qa@lab.co] Se repitió"
    );
  });
  it("agrega sin borrar lo anterior", () => {
    expect(appendFollowUp("[01/09/2026 · a] uno", "dos", "2026-09-02", null)).toBe(
      "[01/09/2026 · a] uno\n[02/09/2026 · sin usuario] dos"
    );
  });
});
