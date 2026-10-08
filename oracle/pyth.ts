import { describe, expect, it, vi } from "vitest";
import { PythClient, PythError } from "../src/index.js";

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe("PythClient", () => {
  it("sends the API key as a bearer token and scales prices by expo", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      ok({
        parsed: [
          {
            id: "b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593",
            price: { price: "18240000", conf: "1500", expo: -5, publish_time: 1_790_000_000 },
            ema_price: { price: "18200000", conf: "1500", expo: -5, publish_time: 1_790_000_000 },
          },
        ],
      }),
    );
    const client = new PythClient({ apiKey: "test-key", fetch: fetchMock as unknown as typeof fetch });
    const [p] = await client.latestPrices(["b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593"]);
    expect(p?.price).toBeCloseTo(182.4);
    expect(p?.emaPrice).toBeCloseTo(182);
    expect(p?.id.startsWith("0x")).toBe(true);
    const init = fetchMock.mock.calls[0]?.[1];
    expect((init?.headers as Record<string, string>).authorization).toBe("Bearer test-key");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("ids[]=0xb1073854");
  });

  it("refuses price calls without an API key", async () => {
    await expect(new PythClient().latestPrices(["0x01"])).rejects.toBeInstanceOf(PythError);
  });

  it("surfaces HTTP errors with status", async () => {
    const client = new PythClient({ apiKey: "k", fetch: (async () => new Response("unauthorized", { status: 401 })) as typeof fetch });
    await expect(client.latestPrices(["0x01"])).rejects.toMatchObject({ status: 401 });
  });

  it("searches feeds without an API key", async () => {
    const fetchMock = vi.fn(async () =>
      ok([{ id: "abc", attributes: { symbol: "Equity.US.NVDA/USD", description: "NVIDIA", schedule: "America/New_York;O,O,O,O,O,O,O" } }]),
    );
    const feeds = await new PythClient({ fetch: fetchMock as unknown as typeof fetch }).searchEquityFeeds("NVDA");
    expect(feeds[0]).toMatchObject({ id: "0xabc", symbol: "Equity.US.NVDA/USD" });
  });
});
