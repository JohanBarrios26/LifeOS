import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { makeAccount, makeTransaction } from "@/domain/finance/test-factories";
import { createIndexedDbFinanceRepository } from "./indexeddb-finance-repository";
import { LifeosDatabase } from "./lifeos-database";

let db: LifeosDatabase;
let databaseCount = 0;

function createRepository() {
  // A fresh database per test, so tests never see each other's data.
  db = new LifeosDatabase(`lifeos-test-${databaseCount++}`);
  return createIndexedDbFinanceRepository(db);
}

afterEach(async () => {
  await db.delete();
});

describe("IndexedDB finance repository", () => {
  it("starts empty", async () => {
    const repository = createRepository();

    expect(await repository.listAccounts()).toEqual([]);
    expect(await repository.listTransactions()).toEqual([]);
  });

  it("saves accounts and reads them back unchanged", async () => {
    const repository = createRepository();
    const debit = makeAccount({ id: "debit", openingBalance: 500_000 });
    const card = makeAccount({ id: "nu-card", type: "credit", openingBalance: -300_000 });

    await repository.saveAccount(debit);
    await repository.saveAccount(card);

    expect(await repository.listAccounts()).toEqual(expect.arrayContaining([debit, card]));
  });

  it("lists accounts in the order they were created", async () => {
    const repository = createRepository();
    const first = makeAccount({ id: "zzz", createdAt: "2026-09-01T10:00:00.000Z" });
    const second = makeAccount({ id: "aaa", createdAt: "2026-09-02T10:00:00.000Z" });

    await repository.saveAccount(second);
    await repository.saveAccount(first);

    expect(await repository.listAccounts()).toEqual([first, second]);
  });

  it("lists transactions ordered by date", async () => {
    const repository = createRepository();
    const later = makeTransaction({ date: "2026-09-20", amount: 10_000 });
    const earlier = makeTransaction({ date: "2026-09-02", amount: 20_000 });

    await repository.saveTransaction(later);
    await repository.saveTransaction(earlier);

    expect(await repository.listTransactions()).toEqual([earlier, later]);
  });

  it("replaces a record saved again with the same id", async () => {
    const repository = createRepository();
    const lunch = makeTransaction({ amount: 25_000, description: "Almuerzo" });

    await repository.saveTransaction(lunch);
    await repository.saveTransaction({ ...lunch, deletedAt: "2026-09-11T00:00:00.000Z" });

    const saved = await repository.listTransactions();
    expect(saved).toHaveLength(1);
    expect(saved[0].deletedAt).toBe("2026-09-11T00:00:00.000Z");
  });
});
