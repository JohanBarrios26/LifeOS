import Dexie, { type EntityTable } from "dexie";
import type { Account, Transaction } from "@/domain/finance/types";
import type { Profile } from "@/domain/profile";

/**
 * The IndexedDB database inside the browser.
 *
 * Each `version(n)` is a schema version. Never edit a version that already shipped:
 * add `version(n + 1)` with the change so existing data is migrated instead of lost.
 */
export class LifeosDatabase extends Dexie {
  accounts!: EntityTable<Account, "id">;
  transactions!: EntityTable<Transaction, "id">;
  profile!: EntityTable<Profile, "id">;

  constructor(name = "lifeos") {
    super(name);

    // Only indexed fields are listed; every other field is stored anyway.
    this.version(1).stores({
      accounts: "id, userId, type",
      transactions: "id, userId, date, fromAccountId, toAccountId",
    });
    // Version 2 (September 2026): the person's profile. Accounts and transactions are kept as they are.
    this.version(2).stores({
      profile: "id",
    });
  }
}
