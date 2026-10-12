/**
 * Print the NYSE session status now and for the next 7 days.
 * No API key needed.  Run: npm run example:hours
 */
import { NYSE_SCHEDULE, marketStatus, parseSchedule } from "../src/index.js";

const schedule = parseSchedule(NYSE_SCHEDULE);
const now = new Date();
const today = marketStatus(schedule, now);

console.log(`NYSE is ${today.open ? "OPEN" : "CLOSED"} right now (${now.toISOString()})`);
console.log("\nNext 7 days (session in New York time):");
for (let d = 0; d < 7; d++) {
  const day = new Date(now.getTime() + d * 86_400_000);
  const s = marketStatus(schedule, day);
  const label = day.toLocaleDateString("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric" });
  const note = s.holiday ? (s.halfDay ? "  half day" : "  holiday") : "";
  console.log(`  ${label.padEnd(12)} ${s.session}${note}`);
}
