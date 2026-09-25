import type { Account, CurrencyCode, Money, Transaction } from "./types";

/**
 * Calculates an account's balance from its opening balance and the transactions
 * that move money into or out of it.
 */
export function getAccountBalance(account: Account, transactions: Transaction[]): Money {
  let balance = account.openingBalance;

  for (const transaction of transactions) {
    if (transaction.deletedAt) {
      continue;
    }
    if (transaction.toAccountId === account.id) {
      // Between currencies, what arrives (toAmount) differs from what left (amount).
      balance += transaction.toAmount ?? transaction.amount;
    }
    if (transaction.fromAccountId === account.id) {
      balance -= transaction.amount;
    }
  }

  return balance;
}

/**
 * Calculates how much money is owed across all credit cards and loans.
 * Returned as a positive number: a card with a balance of -420,000 adds 420,000.
 */
export function getTotalDebt(accounts: Account[], transactions: Transaction[]): Money {
  let totalDebt = 0;

  for (const account of accounts) {
    if (account.deletedAt) {
      continue;
    }
    if (account.type === "credit" || account.type === "loan") {
      const balance = getAccountBalance(account, transactions);
      totalDebt -= balance;
    }
  }

  return totalDebt;
}

/**
 * Calculates the money available right now across cash, debit and savings accounts.
 * Credit cards and loans are not available money, even if they have a credit limit left.
 */
export function getAvailableBalance(accounts: Account[], transactions: Transaction[]): Money {
  let availableBalance = 0;
  for (const account of accounts) {
    if (account.deletedAt) {
      continue;
    }
    if (account.type === "cash" || account.type === "debit" || account.type === "savings") {
      const balance = getAccountBalance(account, transactions);
      availableBalance += balance;
    }
  }

  return availableBalance;
}

/**
 * Runs a total (getAvailableBalance or getTotalDebt) once per currency: pesos and dollars
 * cannot be added together. Currencies appear in the order of the accounts that use them.
 */
export function totalsByCurrency(
  accounts: Account[],
  transactions: Transaction[],
  total: (accounts: Account[], transactions: Transaction[]) => Money,
): { currency: CurrencyCode; amount: Money }[] {
  const currencies = [...new Set(accounts.filter((account) => !account.deletedAt).map((account) => account.currency))];
  return currencies.map((currency) => ({
    currency,
    amount: total(
      accounts.filter((account) => account.currency === currency),
      transactions,
    ),
  }));
}

/** A transaction's amount as one of its accounts sees it: what left it, or what arrived in it. */
export function amountForAccount(transaction: Transaction, accountId: string | undefined): Money {
  return accountId !== undefined && accountId === transaction.toAccountId
    ? (transaction.toAmount ?? transaction.amount)
    : transaction.amount;
}
