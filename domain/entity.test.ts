import { describe, expect, it } from "vitest";
import { createEntityFields, markDeleted, markUpdated, restoreDeleted } from "./entity";
import { makeTransaction } from "./finance/test-factories";

const LATER = new Date("2026-09-24T15:00:00.000Z");

describe("createEntityFields", () => {
  it("creates a unique id and sets both timestamps to now", () => {
    const now = new Date("2026-09-23T20:00:00.000Z");
    const first = createEntityFields("user-1", now);
    const second = createEntityFields("user-1", now);

    expect(first.id).not.toBe(second.id);
    expect(first).toMatchObject({
      userId: "user-1",
      createdAt: "2026-09-23T20:00:00.000Z",
      updatedAt: "2026-09-23T20:00:00.000Z",
    });
  });
});

describe("markUpdated", () => {
  it("applies the changes and updates updatedAt", () => {
    const lunch = makeTransaction({ amount: 25_000, description: "Almuerzo" });

    const edited = markUpdated(lunch, { amount: 30_000 }, LATER);

    expect(edited).toEqual({ ...lunch, amount: 30_000, updatedAt: LATER.toISOString() });
  });

  it("never changes the record's identity", () => {
    const lunch = makeTransaction({ id: "tx-original" });

    const edited = markUpdated(lunch, { id: "tx-other", userId: "someone-else", createdAt: "2020-01-01" }, LATER);

    expect(edited).toMatchObject({ id: "tx-original", userId: lunch.userId, createdAt: lunch.createdAt });
  });
});

describe("markDeleted and restoreDeleted", () => {
  it("keeps the record but marks when it was deleted", () => {
    const lunch = makeTransaction({ amount: 25_000 });

    const deleted = markDeleted(lunch, LATER);

    expect(deleted).toEqual({ ...lunch, deletedAt: LATER.toISOString(), updatedAt: LATER.toISOString() });
  });

  it("restores a deleted record", () => {
    const deleted = markDeleted(makeTransaction({ amount: 25_000 }), LATER);

    const restored = restoreDeleted(deleted, new Date("2026-09-24T15:01:00.000Z"));

    expect(restored.deletedAt).toBeUndefined();
    expect(restored.updatedAt).toBe("2026-09-24T15:01:00.000Z");
    expect(restored.amount).toBe(25_000);
  });
});
