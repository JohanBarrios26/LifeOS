import type { LocalDate } from "@/domain/finance/types";

/** The device's calendar date (local time, not UTC) as "YYYY-MM-DD". */
export function toLocalDate(date: Date = new Date()): LocalDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
