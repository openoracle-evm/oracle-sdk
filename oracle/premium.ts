import { describe, expect, it } from "vitest";
import { classifyPremium, premiumBps } from "../src/index.js";

describe("premium", () => {
  it("computes premium and discount in bps", () => {
    expect(premiumBps(101, 100)).toBeCloseTo(100);
    expect(premiumBps(99.5, 100)).toBeCloseTo(-50);
  });
  it("classifies by absolute value", () => {
    expect(classifyPremium(10)).toBe("inline");
    expect(classifyPremium(-60)).toBe("watch");
    expect(classifyPremium(200)).toBe("alert");
  });
  it("rejects a zero reference", () => {
    expect(() => premiumBps(1, 0)).toThrow();
  });
});
