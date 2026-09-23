import type { FinanceRepository } from "../finance-repository";
import type { LifeosDatabase } from "./lifeos-database";

export function createIndexedDbFinanceRepository(db: LifeosDatabase): FinanceRepository {
  return {
    listAccounts: () => db.accounts.toArray(),
    listTransactions: () => db.transactions.orderBy("date").toArray(),
    saveAccount: async (account) => {
      await db.accounts.put(account);
    },
    saveTransaction: async (transaction) => {
      await db.transactions.put(transaction);
    },
  };
}
