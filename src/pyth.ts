/**
 * Minimal client for Pyth Hermes.
 * Since 2026-08-26 price endpoints require an API key (Authorization: Bearer <key>);
 * feed metadata (search, schedules) is still public.
 */

export type PythPrice = {
  id: string; // 0x-prefixed feed id
  price: number;
  confidence: number;
  emaPrice: number;
  publishTime: number; // unix seconds
};

export type PythFeed = {
  id: string;
  symbol: string;
  description: string;
  schedule?: string;
};

export type PythClientOptions = {
  apiKey?: string;
  endpoint?: string; // default https://hermes.pyth.network
  fetch?: typeof fetch;
  timeoutMs?: number;
};

export class PythError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "PythError";
  }
}

type RawPrice = { price: string; conf: string; expo: number; publish_time: number };
type RawParsed = { id: string; price: RawPrice; ema_price: RawPrice };

const scale = (v: string, expo: number) => Number(v) * 10 ** expo;
const with0x = (id: string) => (id.startsWith("0x") ? id.toLowerCase() : `0x${id.toLowerCase()}`);

export class PythClient {
  private readonly endpoint: string;
  private readonly fetchFn: typeof fetch;

  constructor(private readonly opts: PythClientOptions = {}) {
    this.endpoint = (opts.endpoint ?? "https://hermes.pyth.network").replace(/\/$/, "");
    this.fetchFn = opts.fetch ?? fetch;
  }

  get hasApiKey() {
    return Boolean(this.opts.apiKey);
  }

  private async get<T>(path: string, auth: boolean): Promise<T> {
    const headers: Record<string, string> = { accept: "application/json" };
    if (auth) {
      if (!this.opts.apiKey) throw new PythError("Pyth price endpoints require an API key (set PYTH_API_KEY)");
      headers.authorization = `Bearer ${this.opts.apiKey}`;
    }
    const res = await this.fetchFn(`${this.endpoint}${path}`, {
      headers,
      signal: AbortSignal.timeout(this.opts.timeoutMs ?? 10_000),
    });
    if (!res.ok) throw new PythError(`Pyth ${res.status} on ${path}`, res.status);
    return (await res.json()) as T;
  }

  /** Public: search equity feeds, e.g. "NVDA". */
  async searchEquityFeeds(query: string): Promise<PythFeed[]> {
    const raw = await this.get<{ id: string; attributes: Record<string, string> }[]>(
      `/v2/price_feeds?query=${encodeURIComponent(query)}&asset_type=equity`,
      false,
    );
    return raw.map((f) => ({
      id: with0x(f.id),
      symbol: f.attributes.symbol ?? "",
      description: f.attributes.description ?? "",
      schedule: f.attributes.schedule,
    }));
  }

  /** Requires API key: latest prices for the given feed ids. */
  async latestPrices(ids: string[]): Promise<PythPrice[]> {
    if (ids.length === 0) return [];
    const qs = ids.map((id) => `ids[]=${encodeURIComponent(with0x(id))}`).join("&");
    const raw = await this.get<{ parsed?: RawParsed[] }>(`/v2/updates/price/latest?${qs}&parsed=true`, true);
    return (raw.parsed ?? []).map((p) => ({
      id: with0x(p.id),
      price: scale(p.price.price, p.price.expo),
      confidence: scale(p.price.conf, p.price.expo),
      emaPrice: scale(p.ema_price.price, p.ema_price.expo),
      publishTime: p.price.publish_time,
    }));
  }
}
