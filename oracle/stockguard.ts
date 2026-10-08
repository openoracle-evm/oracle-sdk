import { describe, expect, it } from "vitest";
import { quoteStockGuardFee } from "../src/index.js";

// Vectors mirror stockguard-hook/test/StockGuardHook.t.sol
const base = { poolPrice: 1, oraclePrice: 1, oracleAgeSeconds: 0, marketOpen: true, buyingStock: false };

describe("quoteStockGuardFee", () => {
  it("open market → 0.30%", () => {
    expect(quoteStockGuardFee(base)).toMatchObject({ ok: true, fee: 3000 });
  });
  it("closed market → 1.00%", () => {
    expect(quoteStockGuardFee({ ...base, marketOpen: false })).toMatchObject({ ok: true, fee: 10_000 });
  });
  it("stale oracle reverts only while open", () => {
    expect(quoteStockGuardFee({ ...base, oracleAgeSeconds: 61 })).toMatchObject({ ok: false, error: "StaleOracle" });
    expect(quoteStockGuardFee({ ...base, oracleAgeSeconds: 3 * 86400, marketOpen: false }).ok).toBe(true);
  });
  it("deviation guard: 291 bps reverts when open, passes when closed", () => {
    expect(quoteStockGuardFee({ ...base, oraclePrice: 1.03 })).toMatchObject({ ok: false, error: "DeviationTooHigh" });
    expect(quoteStockGuardFee({ ...base, oraclePrice: 1.03, marketOpen: false }).ok).toBe(true);
  });
  it("surcharge only when moving away from the oracle", () => {
    const away = quoteStockGuardFee({ ...base, oraclePrice: 1.01, buyingStock: false });
    const toward = quoteStockGuardFee({ ...base, oraclePrice: 1.01, buyingStock: true });
    expect(toward).toMatchObject({ ok: true, fee: 3000, movingAway: false });
    expect(away).toMatchObject({ ok: true, fee: 3000 + 99 * 20, movingAway: true });
  });
  it("never exceeds the 5% cap", () => {
    for (let p = 0.96; p <= 1.04; p += 0.001) {
      const q = quoteStockGuardFee({ ...base, oraclePrice: p, marketOpen: false, buyingStock: true });
      if (q.ok) expect(q.fee).toBeLessThanOrEqual(50_000);
    }
  });
});
