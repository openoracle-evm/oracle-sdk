import { describe, expect, it } from "vitest";
import { priceToSqrtPriceX96, sqrtPriceX96ToPrice, stockPrice, type PoolSnapshot } from "../src/index.js";

describe("uniswap price math", () => {
  it("1:1 for equal decimals", () => {
    expect(sqrtPriceX96ToPrice(2n ** 96n, 18, 18)).toBeCloseTo(1, 12);
  });

  it("round-trips a stock price with 18/6 decimals (stock/USDC)", () => {
    const sqrt = priceToSqrtPriceX96(182.4, 18, 6);
    expect(sqrtPriceX96ToPrice(sqrt, 18, 6)).toBeCloseTo(182.4, 6);
  });

  it("inverts when the stock is token1", () => {
    const snap = { price0in1: 1 / 250 } as PoolSnapshot;
    expect(stockPrice(snap, false)).toBeCloseTo(250, 9);
    expect(stockPrice(snap, true)).toBeCloseTo(0.004, 9);
  });
});
