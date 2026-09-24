import type { LocalDate } from "@/domain/finance/types";

/** Moves a calendar date by whole days: shiftDate("2026-03-01", -1) → "2026-02-28". */
export function shiftDate(date: LocalDate, days: number): LocalDate {
  const [year, month, day] = date.split("-").map(Number);
  // Calculated in UTC so daylight-saving changes never skip or repeat a day.
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** The device's calendar date (local time, not UTC) as "YYYY-MM-DD". */
export function toLocalDate(date: Date = new Date()): LocalDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
