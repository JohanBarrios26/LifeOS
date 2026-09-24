import type { LocalDate } from "./finance/types";

/** A calendar month, formatted as "YYYY-MM". */
export type Month = string;

export function monthOf(date: LocalDate): Month {
  return date.slice(0, 7);
}

/** shiftMonth("2026-01", -1) → "2025-12". */
export function shiftMonth(month: Month, delta: number): Month {
  const [year, monthNumber] = month.split("-").map(Number);
  const index = year * 12 + (monthNumber - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** lastDayOfMonth("2026-02") → "2026-02-28". */
export function lastDayOfMonth(month: Month): LocalDate {
  const [year, monthNumber] = month.split("-").map(Number);
  // Day 0 of the next month is the last day of this one.
  const day = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${month}-${String(day).padStart(2, "0")}`;
}
