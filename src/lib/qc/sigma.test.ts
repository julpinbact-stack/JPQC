import { describe, it, expect } from "vitest";
import { sigmaMetric, selectRulesBySigma } from "./sigma";

describe("sigmaMetric", () => {
  it("(ETa - |sesgo|)/CV", () => {
    expect(sigmaMetric(10, 2, 2)).toBe(4);
    expect(sigmaMetric(10, -2, 2)).toBe(4); // usa |sesgo|
  });
  it("CV=0 => NaN", () => {
    expect(Number.isNaN(sigmaMetric(10, 2, 0))).toBe(true);
  });
});

describe("selectRulesBySigma", () => {
  it("σ ≥ 6: solo 1_3s", () => {
    const p = selectRulesBySigma(6.5);
    expect(p.rules).toEqual(["1_3s"]);
    expect(p.level).toBe("excelente");
    expect(p.n).toBe(2);
  });

  it("σ ≈ 5: 1_3s/2_2s/R_4s", () => {
    const p = selectRulesBySigma(5.2);
    expect(p.rules).toEqual(["1_3s", "2_2s", "R_4s"]);
    expect(p.level).toBe("bueno");
  });

  it("σ ≈ 4: multirregla", () => {
    const p = selectRulesBySigma(4.3);
    expect(p.rules).toContain("4_1s");
    expect(p.rules).toContain("10x");
    expect(p.level).toBe("aceptable");
  });

  it("σ < 3: inaceptable", () => {
    expect(selectRulesBySigma(2.5).level).toBe("inaceptable");
  });

  it("sin sigma (null): multirregla provisional", () => {
    const p = selectRulesBySigma(null);
    expect(p.level).toBe("sin_dato");
    expect(p.rules).toContain("1_3s");
  });

  it("3 niveles con multirregla añade 2de3_2s y 3_1s", () => {
    const p = selectRulesBySigma(4.3, 3);
    expect(p.rules).toContain("2de3_2s");
    expect(p.rules).toContain("3_1s");
  });

  it("3 niveles con σ alto (solo 1_3s) NO añade reglas de 3 niveles", () => {
    const p = selectRulesBySigma(6.5, 3);
    expect(p.rules).toEqual(["1_3s"]);
  });
});
