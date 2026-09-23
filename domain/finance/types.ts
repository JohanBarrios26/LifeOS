/**
 * Amount of money in the currency's minor unit (cents for USD, pesos for COP).
 * Always an integer: never store 12.5, store 1250.
 */
export type Money = number;

/** Calendar date in the user's local time, formatted as "YYYY-MM-DD". */
export type LocalDate = string;

/** ISO 4217 currency code, such as "COP", "USD" or "EUR". */
export type CurrencyCode = string;

/** Fields shared by every record LIFEOS stores. */
export interface BaseEntity {
  id: string;
  userId: string;
  /** ISO timestamp, e.g. "2026-09-23T20:15:00.000Z". */
  createdAt: string;
  updatedAt: string;
  /** Set when the record is deleted. Calculations must ignore deleted records. */
  deletedAt?: string;
}

export type AccountType = "cash" | "debit" | "savings" | "credit" | "loan";

export interface Account extends BaseEntity {
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  /** Balance when the account was added to LIFEOS. Negative for money owed (credit, loan). */
  openingBalance: Money;
  openingDate: LocalDate;
}

export type TransactionKind = "income" | "expense" | "transfer" | "adjustment";

export interface Transaction extends BaseEntity {
  kind: TransactionKind;
  date: LocalDate;
  /** Always positive. The direction comes from fromAccountId and toAccountId. */
  amount: Money;
  /** Account the money leaves. Set for expenses and transfers. */
  fromAccountId?: string;
  /** Account the money enters. Set for income and transfers. */
  toAccountId?: string;
  category?: string;
  description?: string;
}
