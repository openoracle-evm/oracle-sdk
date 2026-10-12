/**
 * Fetch live equity prices from Pyth and, optionally, compare a token price against one of them.
 *   PYTH_API_KEY=... npm run example:price
 *   PYTH_API_KEY=... npm run example:price -- NVDA 184.10
 */
import { EQUITY_FEEDS, PythClient, classifyPremium, premiumBps, type EquitySymbol } from "../src/index.js";

const apiKey = process.env.PYTH_API_KEY;
if (!apiKey) {
  console.error("Set PYTH_API_KEY (get one at the Pyth Terminal) to fetch live prices.");
  process.exit(1);
}

const pyth = new PythClient({ apiKey });
const symbols = Object.keys(EQUITY_FEEDS) as EquitySymbol[];
const prices = await pyth.latestPrices(symbols.map((s) => EQUITY_FEEDS[s]));
const byId = new Map(prices.map((p) => [p.id, p]));

console.log("symbol   price        ±conf     age");
for (const s of symbols) {
  const p = byId.get(EQUITY_FEEDS[s]);
  if (!p) continue;
  const age = Math.round(Date.now() / 1000 - p.publishTime);
  console.log(`${s.padEnd(8)} ${p.price.toFixed(2).padStart(10)}   ${p.confidence.toFixed(3).padStart(7)}   ${age}s`);
}

const [sym, tokenPrice] = process.argv.slice(2);
if (sym && tokenPrice) {
  const ref = byId.get(EQUITY_FEEDS[sym.toUpperCase() as EquitySymbol]);
  if (!ref) throw new Error(`Unknown symbol ${sym}`);
  const bps = premiumBps(Number(tokenPrice), ref.price);
  console.log(`\n${sym.toUpperCase()} token at ${tokenPrice}: ${bps >= 0 ? "+" : ""}${bps.toFixed(1)} bps (${classifyPremium(bps)})`);
}
