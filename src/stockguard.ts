/**
 * TypeScript port of StockGuardHook.quoteFee (stockguard-hook repo).
 * Keep in sync with the Solidity source; the test vectors in test/stockguard.test.ts mirror the Foundry tests.
 */

export type StockGuardConfig = {
  openFee: number; // pips, 1e6 = 100%
  closedFee: number;
  surchargePerBp: number;
  maxDeviationOpenBps: number;
  maxDeviationClosedBps: number;
  maxStaleness: number; // seconds
};

export const DEFAULT_STOCKGUARD_CONFIG: StockGuardConfig = {
  openFee: 3000,
  closedFee: 10_000,
  surchargePerBp: 20,
  maxDeviationOpenBps: 200,
  maxDeviationClosedBps: 500,
  maxStaleness: 60,
};

export const STOCKGUARD_MAX_FEE = 50_000;

export type FeeQuote =
  | { ok: true; fee: number; deviationBps: number; movingAway: boolean }
  | { ok: false; error: "StaleOracle" | "DeviationTooHigh"; deviationBps: number; detail: string };

export function quoteStockGuardFee(args: {
  poolPrice: number;
  oraclePrice: number;
  oracleAgeSeconds: number;
  marketOpen: boolean;
  /** true when the swap pushes the stock price up (buying the stock) */
  buyingStock: boolean;
  config?: StockGuardConfig;
}): FeeQuote {
  const cfg = args.config ?? DEFAULT_STOCKGUARD_CONFIG;
  const diff = Math.abs(args.poolPrice - args.oraclePrice);
  const deviationBps = Math.floor((diff * 10_000) / args.oraclePrice);
  if (args.marketOpen && args.oracleAgeSeconds > cfg.maxStaleness)
    return { ok: false, error: "StaleOracle", deviationBps, detail: `StaleOracle(${args.oracleAgeSeconds})` };
  const max = args.marketOpen ? cfg.maxDeviationOpenBps : cfg.maxDeviationClosedBps;
  if (deviationBps > max) return { ok: false, error: "DeviationTooHigh", deviationBps, detail: `DeviationTooHigh(${deviationBps}, ${max})` };
  let fee = args.marketOpen ? cfg.openFee : cfg.closedFee;
  const poolAbove = args.poolPrice > args.oraclePrice;
  const movingAway = (poolAbove && args.buyingStock) || (!poolAbove && !args.buyingStock && diff !== 0);
  if (movingAway) fee += deviationBps * cfg.surchargePerBp;
  return { ok: true, fee: Math.min(fee, STOCKGUARD_MAX_FEE), deviationBps, movingAway };
}
