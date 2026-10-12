/**
 * Read the price of a tokenized stock from a Uniswap v3 pool.
 *   RPC_URL=https://... POOL=0x... STOCK_IS_TOKEN0=true npm run example:pool
 */
import { createPublicClient, http, type Address } from "viem";
import { readV3Pool, stockPrice } from "../src/index.js";

const rpc = process.env.RPC_URL;
const pool = process.env.POOL as Address | undefined;
if (!rpc || !pool) {
  console.error("Set RPC_URL and POOL (a Uniswap v3 pool address).");
  process.exit(1);
}

const client = createPublicClient({ transport: http(rpc) });
const snap = await readV3Pool(client, pool);
const stockIsToken0 = (process.env.STOCK_IS_TOKEN0 ?? "true") === "true";
const stock = stockIsToken0 ? snap.token0 : snap.token1;
const quote = stockIsToken0 ? snap.token1 : snap.token0;

console.log(`${stock.symbol}/${quote.symbol}: ${stockPrice(snap, stockIsToken0).toFixed(4)} ${quote.symbol}`);
