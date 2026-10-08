/** Premium (+) or discount (−) of a tokenized stock vs. the reference price, in basis points. */
export function premiumBps(tokenPrice: number, referencePrice: number): number {
  if (!(referencePrice > 0)) throw new Error("referencePrice must be > 0");
  return ((tokenPrice - referencePrice) / referencePrice) * 10_000;
}

export type PremiumLevel = "inline" | "watch" | "alert";

/** Classify |premium| against thresholds (bps). Defaults: watch ≥ 50 bps, alert ≥ 150 bps. */
export function classifyPremium(bps: number, watch = 50, alert = 150): PremiumLevel {
  const a = Math.abs(bps);
  if (a >= alert) return "alert";
  if (a >= watch) return "watch";
  return "inline";
}
