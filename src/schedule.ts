/**
 * Parser for Pyth market-hours schedules, e.g.
 *   "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C;1127/0930-1300,1225/C"
 * Section 1: IANA time zone. Section 2: seven day rules, Monday → Sunday.
 * Section 3 (optional): holiday overrides as MMDD/<rule>.
 * A rule is "C" (closed), "O" (open all day) or one or more "HHMM-HHMM" ranges joined by "&".
 */

export type Range = { start: number; end: number }; // minutes from midnight, end exclusive
export type DayRule = "closed" | "open" | Range[];

export type Schedule = {
  timeZone: string;
  weekly: DayRule[]; // index 0 = Monday
  holidays: Map<string, DayRule>; // key MMDD
};

const toMinutes = (hhmm: string) => {
  if (!/^\d{4}$/.test(hhmm)) throw new Error(`Invalid time "${hhmm}"`);
  return Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(2));
};

export function parseRule(rule: string): DayRule {
  const r = rule.trim();
  if (r === "C") return "closed";
  if (r === "O") return "open";
  return r.split("&").map((part) => {
    const [a, b] = part.split("-");
    if (!a || !b) throw new Error(`Invalid range "${part}"`);
    const end = b === "2400" ? 1440 : toMinutes(b);
    return { start: toMinutes(a), end };
  });
}

export function parseSchedule(raw: string): Schedule {
  const [timeZone, weekly, holidays] = raw.split(";");
  if (!timeZone || !weekly) throw new Error("Schedule needs a time zone and weekly rules");
  const days = weekly.split(",");
  if (days.length !== 7) throw new Error(`Expected 7 weekly rules, got ${days.length}`);
  const map = new Map<string, DayRule>();
  for (const h of holidays ? holidays.split(",").filter(Boolean) : []) {
    const [mmdd, rule] = h.split("/");
    if (!mmdd || !rule || !/^\d{4}$/.test(mmdd)) throw new Error(`Invalid holiday "${h}"`);
    map.set(mmdd, parseRule(rule));
  }
  return { timeZone, weekly: days.map(parseRule), holidays: map };
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Local wall-clock parts of `date` in `timeZone`. */
export function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    weekday: WEEKDAYS.indexOf(get("weekday")),
    mmdd: `${get("month")}${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function ruleFor(schedule: Schedule, date: Date): DayRule {
  const { weekday, mmdd } = localParts(date, schedule.timeZone);
  return schedule.holidays.get(mmdd) ?? schedule.weekly[weekday] ?? "closed";
}

export function isMarketOpen(schedule: Schedule | string, date = new Date()): boolean {
  const s = typeof schedule === "string" ? parseSchedule(schedule) : schedule;
  const rule = ruleFor(s, date);
  if (rule === "open") return true;
  if (rule === "closed") return false;
  const { minutes } = localParts(date, s.timeZone);
  return rule.some((r) => minutes >= r.start && minutes < r.end);
}

export type MarketStatus = {
  open: boolean;
  /** Human-readable session for today, e.g. "09:30–16:00" or "closed". */
  session: string;
  halfDay: boolean;
  holiday: boolean;
};

const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function marketStatus(schedule: Schedule | string, date = new Date()): MarketStatus {
  const s = typeof schedule === "string" ? parseSchedule(schedule) : schedule;
  const { mmdd } = localParts(date, s.timeZone);
  const rule = ruleFor(s, date);
  const holiday = s.holidays.has(mmdd);
  const session = rule === "open" ? "24h" : rule === "closed" ? "closed" : rule.map((r) => `${fmt(r.start)}–${fmt(r.end)}`).join(", ");
  const halfDay = Array.isArray(rule) && holiday && rule.some((r) => r.end - r.start < 390);
  return { open: isMarketOpen(s, date), session, halfDay, holiday };
}
