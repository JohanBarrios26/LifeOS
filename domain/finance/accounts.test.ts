import { describe, expect, it } from "vitest";
import { getAccountRemoval, isDebtAccountType } from "./accounts";
import { makeAccount, makeTransaction } from "./test-factories";

describe("isDebtAccountType", () => {
  it("treats credit cards and loans as debts", () => {
    expect(isDebtAccountType("credit")).toBe(true);
    expect(isDebtAccountType("loan")).toBe(true);
  });

  it("treats cash, debit and savings as available money", () => {
    expect(isDebtAccountType("cash")).toBe(false);
    expect(isDebtAccountType("debit")).toBe(false);
    expect(isDebtAccountType("savings")).toBe(false);
  });
});

describe("getAccountRemoval", () => {
  const card = makeAccount({ id: "old-card", type: "credit", openingBalance: -100_000 });

  it("allows deleting an account without movements", () => {
    expect(getAccountRemoval(card, [])).toBe("delete");
  });

  it("ignores deleted movements when deciding", () => {
    const deletedPurchase = makeTransaction({
      fromAccountId: "old-card",
      amount: 50_000,
      deletedAt: "2026-09-20T00:00:00.000Z",
    });

    expect(getAccountRemoval(card, [deletedPurchase])).toBe("delete");
  });

  it("allows archiving an account with history and a zero balance", () => {
    const fullPayment = makeTransaction({
      kind: "transfer",
      fromAccountId: "debit",
      toAccountId: "old-card",
      amount: 100_000,
    });

    expect(getAccountRemoval(card, [fullPayment])).toBe("archive");
  });

  it("does not allow removing an account that still has debt", () => {
    const partialPayment = makeTransaction({
      kind: "transfer",
      fromAccountId: "debit",
      toAccountId: "old-card",
      amount: 40_000,
    });

    expect(getAccountRemoval(card, [partialPayment])).toBe("not_allowed");
  });

  it("does not allow removing an account that still has money", () => {
    const debit = makeAccount({ id: "debit", openingBalance: 0 });
    const salary = makeTransaction({ kind: "income", toAccountId: "debit", amount: 2_000_000 });

    expect(getAccountRemoval(debit, [salary])).toBe("not_allowed");
  });
});
