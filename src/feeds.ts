/**
 * Pyth "Equity.US.<TICKER>/USD" feed ids (regular-session prices).
 * Verified against https://hermes.pyth.network/v2/price_feeds?asset_type=equity.
 * Use `PythClient.searchEquityFeeds()` to discover more.
 */
export const EQUITY_FEEDS = {
  NVDA: "0xb1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593",
  TSLA: "0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1",
  AAPL: "0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688",
  MSFT: "0xd0ca23c1cc005e004ccf1db5bf76aeb6a49218f43dac3d4b275e92de12ded4d1",
  AMD: "0x3622e381dbca2efd1859253763b1adc63f7f9abb8e76da1aa8e638a57ccde93e",
  COIN: "0xfee33f2a978bf32dd6b662b65ba8083c6773b494f8401194ec1870c640860245",
} as const;

export type EquitySymbol = keyof typeof EQUITY_FEEDS;

/** Pyth publishes the US regular-session schedule with each equity feed. This is the default. */
export const NYSE_SCHEDULE =
  "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C;0907/C,1126/C,1127/0930-1300,1224/0930-1300,1225/C,0101/C,0118/C,0215/C,0326/C,0531/C,0618/C,0705/C";
