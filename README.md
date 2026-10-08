# oracle-sdk

**Open Oracle** · TypeScript SDK for tokenized-stock data.

- **Real equity prices** from [Pyth](https://pyth.network) (Hermes API)
- **Market hours** — parses Pyth schedules incl. holidays and half days
- **Uniswap v3 pool prices** via [viem](https://viem.sh)
- **Premium / discount** of a tokenized stock vs. its reference price
- **StockGuardHook fee quotes** — TypeScript port of [`stockguard-hook`](https://github.com/YOUR_ORG/stockguard-hook)

## Install

```bash
npm install github:YOUR_ORG/oracle-sdk viem
```

## Usage

```ts
import { PythClient, EQUITY_FEEDS, marketStatus, NYSE_SCHEDULE, premiumBps } from "@openoracle/sdk";

const pyth = new PythClient({ apiKey: process.env.PYTH_API_KEY });
const [nvda] = await pyth.latestPrices([EQUITY_FEEDS.NVDA]);

console.log(nvda.price, marketStatus(NYSE_SCHEDULE));     // 182.41 { open: true, session: "09:30–16:00", ... }
console.log(premiumBps(183.10, nvda.price));              // +37.8 bps
```

Read a Uniswap v3 pool:

```ts
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { readV3Pool, stockPrice } from "@openoracle/sdk";

const client = createPublicClient({ chain: mainnet, transport: http(process.env.RPC_URL) });
const snap = await readV3Pool(client, "0xPOOL");
const price = stockPrice(snap, /* stockIsToken0 */ true);
```

### Pyth API key

Since 2026-08-26 Hermes price endpoints require an API key (`Authorization: Bearer <key>`).
Get one at the Pyth Terminal (free trial). Feed search and schedules are public.

## Develop

```bash
npm install
npm test          # 24 tests
npm run build
```

## License

MIT
