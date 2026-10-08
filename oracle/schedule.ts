import { describe, expect, it } from "vitest";
import { NYSE_SCHEDULE, isMarketOpen, marketStatus, parseSchedule } from "../src/index.js";

// Times are given in UTC; New York is UTC-4 in October (EDT) and UTC-5 in late November (EST).
describe("schedule", () => {
  const s = parseSchedule(NYSE_SCHEDULE);

  it("parses time zone, 7 weekly rules and holidays", () => {
    expect(s.timeZone).toBe("America/New_York");
    expect(s.weekly).toHaveLength(7);
    expect(s.weekly[5]).toBe("closed");
    expect(s.holidays.get("1225")).toBe("closed");
    expect(s.holidays.get("1127")).toEqual([{ start: 570, end: 780 }]);
  });

  it("is open during a regular session", () => {
    expect(isMarketOpen(s, new Date("2026-10-08T14:00:00Z"))).toBe(true); // Thu 10:00 ET
  });

  it("opens at 09:30 and closes at 16:00 ET", () => {
    expect(isMarketOpen(s, new Date("2026-10-08T13:29:00Z"))).toBe(false); // 09:29
    expect(isMarketOpen(s, new Date("2026-10-08T13:30:00Z"))).toBe(true); // 09:30
    expect(isMarketOpen(s, new Date("2026-10-08T19:59:00Z"))).toBe(true); // 15:59
    expect(isMarketOpen(s, new Date("2026-10-08T20:00:00Z"))).toBe(false); // 16:00
  });

  it("is closed on weekends", () => {
    expect(isMarketOpen(s, new Date("2026-10-10T15:00:00Z"))).toBe(false); // Saturday
  });

  it("is closed on holidays (Thanksgiving)", () => {
    expect(isMarketOpen(s, new Date("2026-11-26T16:00:00Z"))).toBe(false);
  });

  it("handles half days (day after Thanksgiving closes 13:00 ET)", () => {
    expect(isMarketOpen(s, new Date("2026-11-27T17:00:00Z"))).toBe(true); // 12:00 EST
    expect(isMarketOpen(s, new Date("2026-11-27T18:30:00Z"))).toBe(false); // 13:30 EST
    const st = marketStatus(s, new Date("2026-11-27T17:00:00Z"));
    expect(st.halfDay).toBe(true);
    expect(st.session).toBe("09:30–13:00");
  });

  it("supports 24h and multi-range rules", () => {
    const crypto = parseSchedule("UTC;O,O,O,O,O,O,O");
    expect(isMarketOpen(crypto, new Date("2026-10-10T03:00:00Z"))).toBe(true);
    const split = parseSchedule("UTC;0000-0100&2300-2400,C,C,C,C,C,C");
    expect(isMarketOpen(split, new Date("2026-10-05T23:30:00Z"))).toBe(true); // Monday
    expect(isMarketOpen(split, new Date("2026-10-05T12:00:00Z"))).toBe(false);
  });

  it("rejects malformed schedules", () => {
    expect(() => parseSchedule("UTC;C,C")).toThrow();
    expect(() => parseSchedule("UTC;9:30-16,C,C,C,C,C,C")).toThrow();
  });
});
