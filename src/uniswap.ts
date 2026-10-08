import type { Address, PublicClient } from "viem";

const Q96 = 2n ** 96n;

/**
 * Price of token0 denominated in token1 (human units) from a Uniswap v3/v4 sqrtPriceX96.
 * Uses bigint math for the square, then scales by decimals.
 */
export function sqrtPriceX96ToPrice(sqrtPriceX96: bigint, decimals0: number, decimals1: number): number {
  // keep 36 digits of precision through the integer division, then hand off to float
  const PRECISION = 10n ** 36n;
  const ratio = (sqrtPriceX96 * sqrtPriceX96 * PRECISION) / (Q96 * Q96); // token1/token0 raw units × 1e36
  const raw = Number(ratio) / 1e36;
  return raw * 10 ** (decimals0 - decimals1);
}

/** Inverse helper, mainly for tests and simulations. */
export function priceToSqrtPriceX96(price: number, decimals0: number, decimals1: number): bigint {
  const raw = price / 10 ** (decimals0 - decimals1);
  const sqrt = Math.sqrt(raw);
  return BigInt(Math.floor(sqrt * 2 ** 48)) * 2n ** 48n;
}

const poolAbi = [
  {
    type: "function",
    name: "slot0",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "feeProtocol", type: "uint8" },
      { name: "unlocked", type: "bool" },
    ],
  },
  { type: "function", name: "token0", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "token1", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
] as const;

const erc20Abi = [
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;

export type PoolSnapshot = {
  pool: Address;
  token0: { address: Address; symbol: string; decimals: number };
  token1: { address: Address; symbol: string; decimals: number };
  sqrtPriceX96: bigint;
  /** token0 priced in token1 */
  price0in1: number;
};

/** Read a Uniswap v3 pool (any EVM chain) and return its current price. */
export async function readV3Pool(client: PublicClient, pool: Address): Promise<PoolSnapshot> {
  const [slot0, t0, t1] = await Promise.all([
    client.readContract({ address: pool, abi: poolAbi, functionName: "slot0" }),
    client.readContract({ address: pool, abi: poolAbi, functionName: "token0" }),
    client.readContract({ address: pool, abi: poolAbi, functionName: "token1" }),
  ]);
  const meta = async (address: Address) => {
    const [decimals, symbol] = await Promise.all([
      client.readContract({ address, abi: erc20Abi, functionName: "decimals" }),
      client.readContract({ address, abi: erc20Abi, functionName: "symbol" }),
    ]);
    return { address, decimals, symbol };
  };
  const [token0, token1] = await Promise.all([meta(t0), meta(t1)]);
  const sqrtPriceX96 = slot0[0];
  return { pool, token0, token1, sqrtPriceX96, price0in1: sqrtPriceX96ToPrice(sqrtPriceX96, token0.decimals, token1.decimals) };
}

/** Price of the stock token in the quote token, whichever side of the pool it is on. */
export function stockPrice(snapshot: PoolSnapshot, stockIsToken0: boolean): number {
  return stockIsToken0 ? snapshot.price0in1 : 1 / snapshot.price0in1;
}
