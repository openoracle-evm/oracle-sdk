/**
 * Show what fee StockGuardHook would charge in common situations.
 * Uses the TypeScript port of the contract's quoteFee.  Run: npm run example:fee
 */
import { quoteStockGuardFee } from "../src/index.js";

const scenarios = [
  { name: "Market open, pool on the oracle", poolPrice: 182.4, oraclePrice: 182.4, oracleAgeSeconds: 2, marketOpen: true, buyingStock: true },
  { name: "Open, pool 1% above, buyer pushes it higher", poolPrice: 184.22, oraclePrice: 182.4, oracleAgeSeconds: 2, marketOpen: true, buyingStock: true },
  { name: "Open, pool 1% above, seller pulls it back", poolPrice: 184.22, oraclePrice: 182.4, oracleAgeSeconds: 2, marketOpen: true, buyingStock: false },
  { name: "Open, pool 3% above", poolPrice: 187.87, oraclePrice: 182.4, oracleAgeSeconds: 2, marketOpen: true, buyingStock: true },
  { name: "Open, oracle 2 minutes old", poolPrice: 182.4, oraclePrice: 182.4, oracleAgeSeconds: 120, marketOpen: true, buyingStock: true },
  { name: "Weekend, pool 3% above", poolPrice: 187.87, oraclePrice: 182.4, oracleAgeSeconds: 172_800, marketOpen: false, buyingStock: false },
];

for (const s of scenarios) {
  const q = quoteStockGuardFee(s);
  const result = q.ok ? `fee ${(q.fee / 10_000).toFixed(2)}%${q.movingAway ? " (incl. surcharge)" : ""}` : `reverts: ${q.detail}`;
  console.log(`${s.name.padEnd(48)} ${result}`);
}
