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

export const ACCOUNT_TYPES = ["cash", "debit", "savings", "credit", "loan"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface Account extends BaseEntity {
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  /** Balance when the account was added to LIFEOS. Negative for money owed (credit, loan). */
  openingBalance: Money;
  openingDate: LocalDate;
  /**
   * Set when the account is closed (e.g. a cancelled card). Unlike deletedAt, its history
   * is still valid: it only leaves the lists. Only accounts with a zero balance are archived.
   */
  archivedAt?: string;
}

export const TRANSACTION_KINDS = ["income", "expense", "transfer", "adjustment"] as const;
export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

export interface Transaction extends BaseEntity {
  kind: TransactionKind;
  date: LocalDate;
  /** Always positive. The direction comes from fromAccountId and toAccountId. */
  amount: Money;
  /** Account the money leaves. Set for expenses and transfers. */
  fromAccountId?: string;
  /** Account the money enters. Set for income and transfers. */
  toAccountId?: string;
  /**
   * Only for transfers between accounts in different currencies: what arrived, in the
   * destination's currency (e.g. 100 USD out, 395,000 COP in). Both amounts are facts;
   * the exchange rate is calculated from them, never stored.
   */
  toAmount?: Money;
  category?: string;
  description?: string;
}
