import type { CurrencyCode, LocalDate, Money } from "@/domain/finance/types";

/**
 * Digits after the decimal point for each currency's minor unit, as LIFEOS stores it.
 * COP is stored in whole pesos, even though ISO 4217 defines centavos.
 */
const MINOR_UNIT_DIGITS: Record<CurrencyCode, number> = {
  COP: 0,
  USD: 2,
  EUR: 2,
};

/** Formats an amount stored in minor units, e.g. formatMoney(1580000, "COP") → "$ 1.580.000". */
export function formatMoney(amount: Money, currency: CurrencyCode, locale = "es-CO"): string {
  const digits = MINOR_UNIT_DIGITS[currency] ?? 2;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount / 10 ** digits);
}

/** Formats a local calendar date, e.g. formatShortDate("2026-09-15") → "15 de sept". */
export function formatShortDate(date: LocalDate, locale = "es-CO"): string {
  // Read the date as UTC and format it as UTC, so the device's time zone never shifts the day.
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}
