import { describe, expect, it } from "vitest";
import { type TransactionInput, validateTransaction } from "./validation";

const validIncome: TransactionInput = {
  kind: "income",
  date: "2026-09-01",
  amount: 2_000_000,
  toAccountId: "debit",
};

const validExpense: TransactionInput = {
  kind: "expense",
  date: "2026-09-03",
  amount: 50_000,
  fromAccountId: "debit",
};

const validTransfer: TransactionInput = {
  kind: "transfer",
  date: "2026-09-15",
  amount: 80_000,
  fromAccountId: "debit",
  toAccountId: "nu-card",
};

describe("validateTransaction", () => {
  it("accepts a valid income, expense and transfer", () => {
    expect(validateTransaction(validIncome)).toEqual([]);
    expect(validateTransaction(validExpense)).toEqual([]);
    expect(validateTransaction(validTransfer)).toEqual([]);
  });

  it("rejects zero and negative amounts", () => {
    expect(validateTransaction({ ...validExpense, amount: 0 })).toContain("amount_not_positive");
    expect(validateTransaction({ ...validExpense, amount: -5_000 })).toContain("amount_not_positive");
  });

  it("rejects amounts that are not whole numbers (regla 2)", () => {
    expect(validateTransaction({ ...validExpense, amount: 12.5 })).toContain("amount_not_integer");
  });

  it("requires the destination account for an income (regla 3)", () => {
    expect(validateTransaction({ ...validIncome, toAccountId: undefined })).toContain(
      "missing_destination_account",
    );
  });

  it("requires the source account for an expense (regla 4)", () => {
    expect(validateTransaction({ ...validExpense, fromAccountId: undefined })).toContain(
      "missing_source_account",
    );
  });

  it("requires both accounts for a transfer", () => {
    expect(validateTransaction({ ...validTransfer, fromAccountId: undefined })).toContain(
      "missing_source_account",
    );
    expect(validateTransaction({ ...validTransfer, toAccountId: undefined })).toContain(
      "missing_destination_account",
    );
  });

  it("rejects a transfer to the same account", () => {
    expect(validateTransaction({ ...validTransfer, toAccountId: "debit" })).toContain(
      "same_source_and_destination",
    );
  });

  it("rejects dates that do not exist or have another format", () => {
    expect(validateTransaction({ ...validExpense, date: "2026-02-30" })).toContain("invalid_date");
    expect(validateTransaction({ ...validExpense, date: "15/09/2026" })).toContain("invalid_date");
    expect(validateTransaction({ ...validExpense, date: "" })).toContain("invalid_date");
  });

  it("reports every problem at once", () => {
    const errors = validateTransaction({ kind: "expense", date: "", amount: 0 });

    expect(errors).toEqual(
      expect.arrayContaining(["amount_not_positive", "missing_source_account", "invalid_date"]),
    );
  });
});
