import { describe, it, expect } from "vitest";
import { evaluateWestgard, REJECTION_RULES, type LevelMeasurement } from "./westgard";

const ALL = [...REJECTION_RULES];
const lvl = (levelIndex: number, z: number, history: number[] = []): LevelMeasurement => ({
  levelIndex,
  z,
  history,
});

describe("evaluateWestgard", () => {
  it("acepta cuando todo está dentro de ±2s", () => {
    const r = evaluateWestgard([lvl(1, 0.5), lvl(2, -0.8)], ALL);
    expect(r.status).toBe("ACEPTADA");
    expect(r.violated).toHaveLength(0);
  });

  it("1_2s genera advertencia (no rechazo)", () => {
    const r = evaluateWestgard([lvl(1, 2.4), lvl(2, 0.1)], ALL);
    expect(r.status).toBe("ADVERTENCIA");
    expect(r.warnings).toContain("1_2s");
    expect(r.violated).toHaveLength(0);
  });

  it("1_3s rechaza", () => {
    const r = evaluateWestgard([lvl(1, 3.4), lvl(2, 0.2)], ALL);
    expect(r.status).toBe("RECHAZADA");
    expect(r.violated).toContain("1_3s");
  });

  it("2_2s dentro de la corrida (2 niveles > +2s)", () => {
    const r = evaluateWestgard([lvl(1, 2.3), lvl(2, 2.6)], ALL);
    expect(r.violated).toContain("2_2s");
  });

  it("2_2s entre corridas (mismo nivel, 2 consecutivos)", () => {
    const r = evaluateWestgard([lvl(1, 2.5, [2.2]), lvl(2, 0.1)], ALL);
    expect(r.violated).toContain("2_2s");
  });

  it("R_4s por rango >= 4s entre niveles", () => {
    const r = evaluateWestgard([lvl(1, 2.3), lvl(2, -2.1)], ALL);
    expect(r.violated).toContain("R_4s");
  });

  it("4_1s por 4 consecutivos > +1s", () => {
    const r = evaluateWestgard([lvl(1, 1.5, [1.2, 1.3, 1.1]), lvl(2, 0.0)], ALL);
    expect(r.violated).toContain("4_1s");
  });

  it("10x por 10 consecutivos del mismo lado", () => {
    const r = evaluateWestgard(
      [lvl(1, 0.4, [0.1, 0.2, 0.3, 0.2, 0.1, 0.5, 0.2, 0.3, 0.1]), lvl(2, -0.5)],
      ALL
    );
    expect(r.violated).toContain("10x");
  });

  it("2de3_2s con 3 niveles", () => {
    const r = evaluateWestgard([lvl(1, 2.2), lvl(2, 2.4), lvl(3, 0.3)], ALL);
    expect(r.violated).toContain("2de3_2s");
  });

  it("3_1s por 3 consecutivos > +1s", () => {
    const r = evaluateWestgard([lvl(1, 1.4, [1.2, 1.1]), lvl(2, 0.0)], ALL);
    expect(r.violated).toContain("3_1s");
  });

  it("respeta las reglas habilitadas: 1_3s deshabilitada no rechaza", () => {
    const r = evaluateWestgard([lvl(1, 3.4)], ["2_2s"]);
    expect(r.violated).not.toContain("1_3s");
    // Sigue habiendo advertencia 1_2s porque |z|>2
    expect(r.warnings).toContain("1_2s");
    expect(r.status).toBe("ADVERTENCIA");
  });
});
