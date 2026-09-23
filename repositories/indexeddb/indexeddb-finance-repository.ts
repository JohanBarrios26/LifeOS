import type { FinanceRepository } from "../finance-repository";
import type { LifeosDatabase } from "./lifeos-database";

export function createIndexedDbFinanceRepository(db: LifeosDatabase): FinanceRepository {
  return {
    listAccounts: async () => {
      const accounts = await db.accounts.toArray();
      return accounts.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    listTransactions: () => db.transactions.orderBy("date").toArray(),
    saveAccount: async (account) => {
      await db.accounts.put(account);
    },
    saveTransaction: async (transaction) => {
      await db.transactions.put(transaction);
    },
    saveAll: async ({ accounts, transactions }) => {
      // A database transaction: if any write fails, every write in it is undone.
      await db.transaction("rw", db.accounts, db.transactions, async () => {
        await db.accounts.bulkPut(accounts);
        await db.transactions.bulkPut(transactions);
      });
    },
  };
}
