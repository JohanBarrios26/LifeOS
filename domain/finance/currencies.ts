import type { Account, CurrencyCode, Transaction } from "./types";

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  /**
   * Digits after the decimal point in LIFEOS. Amounts are stored as integers in this unit:
   * COP in whole pesos (even though ISO 4217 defines centavos), USD and BRL in cents.
   */
  digits: number;
  /**
   * How the symbol is written in Colombian Spanish: "symbol" gives "$" and "US$";
   * "narrowSymbol" gives "R$" and "€" instead of "BRL" and "EUR".
   */
  display: "symbol" | "narrowSymbol";
}

/** The currencies a person can choose. The first one is the default. */
export const CURRENCIES: CurrencyInfo[] = [
  { code: "COP", name: "Peso colombiano", digits: 0, display: "symbol" },
  { code: "USD", name: "Dólar estadounidense", digits: 2, display: "symbol" },
  { code: "BRL", name: "Real brasileño", digits: 2, display: "narrowSymbol" },
  { code: "EUR", name: "Euro", digits: 2, display: "narrowSymbol" },
];

export const DEFAULT_CURRENCY: CurrencyCode = CURRENCIES[0].code;

/** Digits after the decimal point for a currency; 2 for any currency not in the list. */
export function currencyDigits(currency: CurrencyCode): number {
  return CURRENCIES.find((info) => info.code === currency)?.digits ?? 2;
}

export function currencyDisplay(currency: CurrencyCode): CurrencyInfo["display"] {
  return CURRENCIES.find((info) => info.code === currency)?.display ?? "symbol";
}

/**
 * The currency of a transaction's `amount`: an income is in the currency of the account it
 * enters; anything else, in the currency of the account it leaves.
 */
export function transactionCurrency(
  transaction: Pick<Transaction, "kind" | "fromAccountId" | "toAccountId">,
  accounts: Account[],
  fallback: CurrencyCode,
): CurrencyCode {
  const accountId = transaction.kind === "income" ? transaction.toAccountId : transaction.fromAccountId;
  return accounts.find((account) => account.id === accountId)?.currency ?? fallback;
}
