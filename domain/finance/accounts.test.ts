import { describe, expect, it } from "vitest";
import { isDebtAccountType } from "./accounts";

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
