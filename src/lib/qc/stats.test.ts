import { describe, it, expect } from "vitest";
import { mean, sd, cv, zScore, seriesStats } from "./stats";

describe("stats", () => {
  it("mean", () => {
    expect(mean([2, 4, 6])).toBe(4);
  });

  it("sd muestral (n-1)", () => {
    expect(sd([2, 4, 6])).toBeCloseTo(2, 10);
  });

  it("sd requiere >=2 datos", () => {
    expect(Number.isNaN(sd([5]))).toBe(true);
  });

  it("cv %", () => {
    expect(cv(100, 2.5)).toBeCloseTo(2.5, 10);
  });

  it("zScore", () => {
    expect(zScore(106, 100, 2)).toBe(3);
    expect(zScore(97, 100, 2)).toBe(-1.5);
  });

  it("seriesStats", () => {
    const s = seriesStats([2, 4, 6]);
    expect(s.n).toBe(3);
    expect(s.mean).toBe(4);
    expect(s.sd).toBeCloseTo(2, 10);
    expect(s.cv).toBeCloseTo(50, 10);
  });
});
