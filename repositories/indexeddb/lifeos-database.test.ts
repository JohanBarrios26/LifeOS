import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";
import { makeAccount, makeTransaction } from "@/domain/finance/test-factories";
import type { Profile } from "@/domain/profile";
import { createIndexedDbProfileRepository } from "./indexeddb-profile-repository";
import { LifeosDatabase } from "./lifeos-database";

describe("LifeosDatabase migrations", () => {
  it("keeps accounts and transactions when upgrading from version 1", async () => {
    const name = "lifeos-migration-test";
    const debit = makeAccount({ id: "debit", openingBalance: 500_000 });
    const lunch = makeTransaction({ fromAccountId: "debit", amount: 25_000 });

    // A browser that still has the September database: version 1, without the profile table.
    const oldDatabase = new Dexie(name);
    oldDatabase.version(1).stores({
      accounts: "id, userId, type",
      transactions: "id, userId, date, fromAccountId, toAccountId",
    });
    await oldDatabase.table("accounts").put(debit);
    await oldDatabase.table("transactions").put(lunch);
    oldDatabase.close();

    const upgraded = new LifeosDatabase(name);

    expect(await upgraded.accounts.toArray()).toEqual([debit]);
    expect(await upgraded.transactions.toArray()).toEqual([lunch]);
    expect(await upgraded.profile.toArray()).toEqual([]);
    await upgraded.delete();
  });
});

describe("IndexedDB profile repository", () => {
  it("has no profile until the person saves one, then reads it back", async () => {
    const db = new LifeosDatabase("lifeos-profile-test");
    const repository = createIndexedDbProfileRepository(db);
    const profile: Profile = {
      id: "profile",
      userId: "local-user",
      createdAt: "2026-09-25T00:00:00.000Z",
      updatedAt: "2026-09-25T00:00:00.000Z",
      displayName: "Camila",
    };

    expect(await repository.getProfile()).toBeUndefined();
    await repository.saveProfile(profile);
    expect(await repository.getProfile()).toEqual(profile);
    await db.delete();
  });
});
