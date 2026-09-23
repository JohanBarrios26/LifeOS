import { getAccountBalance } from "./balance";
import type { Account, AccountType, Transaction } from "./types";

/** Credit cards and loans hold money owed: their balance is negative while there is debt. */
export function isDebtAccountType(type: AccountType): boolean {
  return type === "credit" || type === "loan";
}

/**
 * How an account can be taken out of use:
 * - "delete": it has no movements (probably created by mistake), so no history is lost.
 * - "archive": it has history and a zero balance (e.g. a closed card): the history stays.
 * - "not_allowed": it still holds money or debt. Hiding it would make that money
 *   disappear from the totals, so it must be brought to zero first.
 */
export type AccountRemoval = "delete" | "archive" | "not_allowed";

export function getAccountRemoval(account: Account, transactions: Transaction[]): AccountRemoval {
  const hasMovements = transactions.some(
    (transaction) =>
      !transaction.deletedAt &&
      (transaction.fromAccountId === account.id || transaction.toAccountId === account.id),
  );

  if (!hasMovements) {
    return "delete";
  }
  if (getAccountBalance(account, transactions) === 0) {
    return "archive";
  }
  return "not_allowed";
}
