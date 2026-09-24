import { lastDayOfMonth, type Month } from "../month";
import { isDebtAccountType } from "./accounts";
import { getAvailableBalance, getTotalDebt } from "./balance";
import type { Account, Money, Transaction } from "./types";

export const UNCATEGORIZED = "Sin categoría";
const INTEREST_CATEGORY = "intereses";

export interface CategoryTotal {
  category: string;
  amount: Money;
  count: number;
}

export interface MonthlySummary {
  month: Month;
  income: Money;
  /** Spending made this month, however it was paid (cash, debit or credit card). */
  expenses: Money;
  /** income − expenses: what was left over (or missing) this month. */
  net: Money;
  /** Money moved from available accounts into credit cards and loans. */
  debtPayments: Money;
  /** Expenses in the "Intereses" category. */
  interest: Money;
  /** Largest first. */
  expensesByCategory: CategoryTotal[];
  availableAtEnd: Money;
  debtAtEnd: Money;
  /** The month's transactions, oldest first. */
  transactions: Transaction[];
}

/**
 * Builds a month's report from the stored facts. Nothing here is saved: it is always recalculated.
 *
 * A card purchase counts as an expense the day it is made; paying the card later is a
 * debt payment, not a second expense. Otherwise the same purchase would be counted twice.
 */
export function getMonthlySummary(accounts: Account[], transactions: Transaction[], month: Month): MonthlySummary {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const isDebt = (accountId?: string) => {
    const account = accountId ? accountsById.get(accountId) : undefined;
    return account !== undefined && isDebtAccountType(account.type);
  };

  const monthTransactions = transactions
    .filter((transaction) => !transaction.deletedAt && transaction.date.startsWith(`${month}-`))
    .toSorted((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  let income = 0;
  let expenses = 0;
  let debtPayments = 0;
  let interest = 0;
  // Grouped without caring about capital letters: "comida" and "Comida" are the same category.
  const categories = new Map<string, CategoryTotal>();

  for (const transaction of monthTransactions) {
    if (transaction.kind === "income") {
      income += transaction.amount;
    } else if (transaction.kind === "expense") {
      expenses += transaction.amount;

      const category = transaction.category?.trim() || UNCATEGORIZED;
      const key = category.toLocaleLowerCase("es");
      const total = categories.get(key) ?? { category, amount: 0, count: 0 };
      total.amount += transaction.amount;
      total.count += 1;
      categories.set(key, total);

      if (key === INTEREST_CATEGORY) {
        interest += transaction.amount;
      }
    } else if (
      transaction.kind === "transfer" &&
      isDebt(transaction.toAccountId) &&
      !isDebt(transaction.fromAccountId)
    ) {
      debtPayments += transaction.amount;
    }
  }

  // The position on the last day of the month: only accounts and facts that existed by then.
  const monthEnd = lastDayOfMonth(month);
  const accountsByMonthEnd = accounts.filter((account) => account.openingDate <= monthEnd);
  const transactionsByMonthEnd = transactions.filter((transaction) => transaction.date <= monthEnd);

  return {
    month,
    income,
    expenses,
    net: income - expenses,
    debtPayments,
    interest,
    expensesByCategory: [...categories.values()].sort((a, b) => b.amount - a.amount),
    availableAtEnd: getAvailableBalance(accountsByMonthEnd, transactionsByMonthEnd),
    debtAtEnd: getTotalDebt(accountsByMonthEnd, transactionsByMonthEnd),
    transactions: monthTransactions,
  };
}
