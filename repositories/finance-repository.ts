import type { Account, Transaction } from "@/domain/finance/types";

/**
 * Where financial records are stored. Screens depend on this interface, never on a
 * specific database, so IndexedDB can later be replaced by PostgreSQL without touching them.
 */
export interface FinanceRepository {
  /** Every account in creation order, including deleted ones: calculations decide what to ignore. */
  listAccounts(): Promise<Account[]>;
  /** Every transaction ordered by date, including deleted ones. */
  listTransactions(): Promise<Transaction[]>;
  /** Creates the account, or replaces it if one with the same id exists. */
  saveAccount(account: Account): Promise<void>;
  /** Creates the transaction, or replaces it if one with the same id exists. */
  saveTransaction(transaction: Transaction): Promise<void>;
}
