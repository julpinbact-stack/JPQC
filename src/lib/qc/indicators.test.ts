import { describe, it, expect } from "vitest";
import { totalError, expandedUncertainty, computeIndicators } from "./indicators";

describe("indicadores", () => {
  it("error total = |sesgo| + 2·CV", () => {
    expect(totalError(2, 3)).toBe(8);
    expect(totalError(-2, 3)).toBe(8);
  });

  it("incertidumbre expandida (k=2), sin sesgo", () => {
    expect(expandedUncertainty(3)).toBeCloseTo(6, 10);
  });

  it("incertidumbre con componente de sesgo", () => {
    // 2*sqrt(3^2 + 4^2) = 2*5 = 10
    expect(expandedUncertainty(3, 4)).toBeCloseTo(10, 10);
  });

  it("computeIndicators completo y competente", () => {
    const r = computeIndicators(10, 2, 1);
    expect(r.tePct).toBeCloseTo(5, 10); // 1 + 2*2
    expect(r.sigma).toBeCloseTo(4.5, 10); // (10-1)/2
    expect(r.competent).toBe(true); // 5 < 10
    expect(r.uncertaintyU).toBeCloseTo(4, 10); // 2*2
  });

  it("no competente cuando ET >= ETa", () => {
    const r = computeIndicators(5, 3, 2); // te = 2 + 6 = 8 > 5
    expect(r.competent).toBe(false);
  });

  it("sin CV: indicadores nulos", () => {
    const r = computeIndicators(10, null, 1);
    expect(r.cvPct).toBeNull();
    expect(r.tePct).toBeNull();
    expect(r.sigma).toBeNull();
    expect(r.competent).toBeNull();
  });
});
