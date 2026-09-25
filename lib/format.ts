import { currencyDigits, currencyDisplay } from "@/domain/finance/currencies";
import type { CurrencyCode, LocalDate, Money } from "@/domain/finance/types";

export { currencyDigits };

/** Converts minor units to the currency's main unit, e.g. 1250 USD cents → 12.5 dollars. */
export function toMajorUnits(amount: Money, currency: CurrencyCode): number {
  return amount / 10 ** currencyDigits(currency);
}

/**
 * Formats an amount stored in minor units:
 * formatMoney(1580000, "COP") → "$ 1.580.000", formatMoney(1250, "USD") → "US$ 12,50", formatMoney(4590, "BRL") → "R$ 45,90".
 */
export function formatMoney(amount: Money, currency: CurrencyCode, locale = "es-CO"): string {
  const digits = currencyDigits(currency);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: currencyDisplay(currency),
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount / 10 ** digits);
}

/** The symbol LIFEOS shows for a currency: "$" (COP), "US$", "R$", "€". */
export function currencySymbol(currency: CurrencyCode, locale = "es-CO"): string {
  return (
    new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: currencyDisplay(currency) })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency
  );
}

/**
 * Writes an amount the way a person would type it, without the currency symbol,
 * so parseAmount can read it back. E.g. formatAmountInput(120000, "COP") → "120.000".
 */
export function formatAmountInput(amount: Money, currency: CurrencyCode, locale = "es-CO"): string {
  const digits = currencyDigits(currency);

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
  const digits = currencyDigits(currency);
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
