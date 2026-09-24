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

/** Converts minor units to the currency's main unit, e.g. 1250 USD cents → 12.5 dollars. */
export function toMajorUnits(amount: Money, currency: CurrencyCode): number {
  return amount / 10 ** (MINOR_UNIT_DIGITS[currency] ?? 2);
}

/** Digits a currency shows after the decimal point in LIFEOS: 0 for COP, 2 for USD. */
export function currencyDigits(currency: CurrencyCode): number {
  return MINOR_UNIT_DIGITS[currency] ?? 2;
}

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

/**
 * Writes an amount the way a person would type it, without the currency symbol,
 * so parseAmount can read it back. E.g. formatAmountInput(120000, "COP") → "120.000".
 */
export function formatAmountInput(amount: Money, currency: CurrencyCode, locale = "es-CO"): string {
  const digits = MINOR_UNIT_DIGITS[currency] ?? 2;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount / 10 ** digits);
}

/**
 * Reads an amount typed by a person and returns it in minor units, or null if it is not valid.
 * Uses Colombian notation: "." separates thousands and "," separates decimals.
 * Examples: "1.200.000" COP → 1200000, "$ 50.000" COP → 50000, "12,50" USD → 1250.
 */
export function parseAmount(text: string, currency: CurrencyCode): Money | null {
  const digits = MINOR_UNIT_DIGITS[currency] ?? 2;
  const normalized = text.replace(/[\s$.]/g, "").replace(",", ".");
  const pattern = digits === 0 ? /^\d+$/ : new RegExp(`^\\d+(\\.\\d{1,${digits}})?$`);

  if (!pattern.test(normalized)) {
    return null;
  }
  // Math.round fixes floating-point noise such as 0.29 * 100 = 28.999999999999996.
  return Math.round(Number(normalized) * 10 ** digits);
}

/** Formats a month for titles, e.g. formatMonth("2026-09") → "Septiembre de 2026". */
export function formatMonth(month: string, locale = "es-CO"): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const text = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, monthNumber - 1, 1)),
  );
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/** Formats a local calendar date, e.g. formatShortDate("2026-09-15") → "15 de sept". */
export function formatShortDate(date: LocalDate, locale = "es-CO"): string {
  // Read the date as UTC and format it as UTC, so the device's time zone never shifts the day.
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}
