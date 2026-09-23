import type { Account, Money, Transaction } from "./types";

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
      balance += transaction.amount;
    }
    if (transaction.fromAccountId === account.id) {
      balance -= transaction.amount;
    }
  }

  return balance;
}
