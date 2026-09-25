import { describe, expect, it } from "vitest";
import { makeAccount } from "./test-factories";
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

describe("validateTransaction between currencies (regla 7)", () => {
  const pesos = makeAccount({ id: "pesos", currency: "COP" });
  const otherPesos = makeAccount({ id: "other-pesos", currency: "COP" });
  const dollars = makeAccount({ id: "dollars", currency: "USD" });
  const accounts = [pesos, otherPesos, dollars];
  const exchange: TransactionInput = {
    kind: "transfer",
    date: "2026-09-25",
    amount: 10_000,
    fromAccountId: "dollars",
    toAccountId: "pesos",
    toAmount: 395_000,
  };

  it("accepts a change of currency with both amounts", () => {
    expect(validateTransaction(exchange, accounts)).toEqual([]);
  });

  it("requires how much arrived when the currencies differ", () => {
    expect(validateTransaction({ ...exchange, toAmount: undefined }, accounts)).toContain("invalid_destination_amount");
    expect(validateTransaction({ ...exchange, toAmount: 0 }, accounts)).toContain("invalid_destination_amount");
    expect(validateTransaction({ ...exchange, toAmount: 12.5 }, accounts)).toContain("invalid_destination_amount");
  });

  it("does not ask for it between accounts in the same currency", () => {
    expect(
      validateTransaction({ ...exchange, fromAccountId: "other-pesos", toAmount: undefined }, accounts),
    ).toEqual([]);
  });
});
