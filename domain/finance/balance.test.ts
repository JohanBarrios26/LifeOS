import { describe, expect, it } from "vitest";
import { getAccountBalance, getAvailableBalance, getTotalDebt } from "./balance";
import type { Account, Transaction } from "./types";

const TIMESTAMP = "2026-09-01T00:00:00.000Z";

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "debit",
    userId: "user-1",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    name: "Debit account",
    type: "debit",
    currency: "COP",
    openingBalance: 0,
    openingDate: "2026-09-01",
    ...overrides,
  };
}

let nextId = 1;
function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `tx-${nextId++}`,
    userId: "user-1",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    kind: "expense",
    date: "2026-09-10",
    amount: 0,
    ...overrides,
  };
}

describe("getAccountBalance", () => {
  const debit = makeAccount({ id: "debit", openingBalance: 500_000 });
  const savings = makeAccount({ id: "savings", type: "savings", openingBalance: 0 });
  const creditCard = makeAccount({ id: "nu-card", type: "credit", openingBalance: -300_000 });

  it("returns the opening balance when there are no transactions", () => {
    expect(getAccountBalance(debit, [])).toBe(500_000);
  });

  it("adds income that enters the account", () => {
    const salary = makeTransaction({ kind: "income", toAccountId: "debit", amount: 2_000_000 });

    expect(getAccountBalance(debit, [salary])).toBe(2_500_000);
  });

  it("subtracts expenses paid from the account", () => {
    const lunch = makeTransaction({ kind: "expense", fromAccountId: "debit", amount: 50_000 });

    expect(getAccountBalance(debit, [lunch])).toBe(450_000);
  });

  it("moves money between accounts on a transfer", () => {
    const toSavings = makeTransaction({
      kind: "transfer",
      fromAccountId: "debit",
      toAccountId: "savings",
      amount: 100_000,
    });

    expect(getAccountBalance(debit, [toSavings])).toBe(400_000);
    expect(getAccountBalance(savings, [toSavings])).toBe(100_000);
  });

  it("increases credit card debt on a purchase without touching available money", () => {
    const purchase = makeTransaction({ kind: "expense", fromAccountId: "nu-card", amount: 120_000 });

    expect(getAccountBalance(creditCard, [purchase])).toBe(-420_000);
    expect(getAccountBalance(debit, [purchase])).toBe(500_000);
  });

  it("reduces both available money and debt when paying the credit card", () => {
    const payment = makeTransaction({
      kind: "transfer",
      fromAccountId: "debit",
      toAccountId: "nu-card",
      amount: 80_000,
    });

    expect(getAccountBalance(debit, [payment])).toBe(420_000);
    expect(getAccountBalance(creditCard, [payment])).toBe(-220_000);
  });

  it("ignores deleted transactions", () => {
    const deleted = makeTransaction({
      kind: "expense",
      fromAccountId: "debit",
      amount: 50_000,
      deletedAt: "2026-09-11T00:00:00.000Z",
    });

    expect(getAccountBalance(debit, [deleted])).toBe(500_000);
  });

  it("ignores transactions that belong to other accounts", () => {
    const otherExpense = makeTransaction({ kind: "expense", fromAccountId: "savings", amount: 30_000 });

    expect(getAccountBalance(debit, [otherExpense])).toBe(500_000);
  });
});

describe("getTotalDebt", () => {
  const debit = makeAccount({ id: "debit", openingBalance: 500_000 });
  const creditCard = makeAccount({ id: "nu-card", type: "credit", openingBalance: -300_000 });
  const loan = makeAccount({ id: "car-loan", type: "loan", openingBalance: -5_000_000 });

  it("returns zero when there are no credit cards or loans", () => {
    expect(getTotalDebt([debit], [])).toBe(0);
  });

  it("returns the debt of a credit card as a positive number", () => {
    expect(getTotalDebt([creditCard], [])).toBe(300_000);
  });

  it("ignores cash, debit and savings accounts", () => {
    expect(getTotalDebt([debit, creditCard], [])).toBe(300_000);
  });

  it("adds up credit cards and loans, including new purchases", () => {
    const purchase = makeTransaction({ kind: "expense", fromAccountId: "nu-card", amount: 120_000 });

    expect(getTotalDebt([creditCard, loan], [purchase])).toBe(5_420_000);
  });

  it("goes down when a debt is paid", () => {
    const payment = makeTransaction({
      kind: "transfer",
      fromAccountId: "debit",
      toAccountId: "nu-card",
      amount: 80_000,
    });

    expect(getTotalDebt([debit, creditCard], [payment])).toBe(220_000);
  });

  it("ignores deleted accounts", () => {
    const closedCard = makeAccount({
      id: "old-card",
      type: "credit",
      openingBalance: -100_000,
      deletedAt: "2026-09-15T00:00:00.000Z",
    });

    expect(getTotalDebt([creditCard, closedCard], [])).toBe(300_000);
  });
});

describe("getAvailableBalance", () => {
  const cash = makeAccount({ id: "wallet", type: "cash", openingBalance: 80_000 });
  const debit = makeAccount({ id: "debit", type: "debit", openingBalance: 500_000 });
  const savings = makeAccount({ id: "savings", type: "savings", openingBalance: 1_000_000 });
  const creditCard = makeAccount({ id: "nu-card", type: "credit", openingBalance: -300_000 });
  const loan = makeAccount({ id: "car-loan", type: "loan", openingBalance: -5_000_000 });

  it("adds up cash, debit and savings accounts", () => {
    expect(getAvailableBalance([cash, debit, savings], [])).toBe(1_580_000);
  });

  it("ignores credit cards and loans", () => {
    expect(getAvailableBalance([debit, creditCard, loan], [])).toBe(500_000);
  });

  it("includes income and expenses", () => {
    const salary = makeTransaction({ kind: "income", toAccountId: "debit", amount: 2_000_000 });
    const groceries = makeTransaction({ kind: "expense", fromAccountId: "wallet", amount: 30_000 });

    expect(getAvailableBalance([cash, debit], [salary, groceries])).toBe(2_550_000);
  });

  it("does not change when money moves from debit to savings", () => {
    const toSavings = makeTransaction({
      kind: "transfer",
      fromAccountId: "debit",
      toAccountId: "savings",
      amount: 200_000,
    });

    expect(getAvailableBalance([debit, savings], [toSavings])).toBe(1_500_000);
  });

  it("is not affected by credit card purchases", () => {
    const purchase = makeTransaction({ kind: "expense", fromAccountId: "nu-card", amount: 120_000 });

    expect(getAvailableBalance([debit, creditCard], [purchase])).toBe(500_000);
  });

  it("goes down when paying a credit card", () => {
    const payment = makeTransaction({
      kind: "transfer",
      fromAccountId: "debit",
      toAccountId: "nu-card",
      amount: 80_000,
    });

    expect(getAvailableBalance([debit, creditCard], [payment])).toBe(420_000);
  });

  it("ignores deleted accounts", () => {
    const closedAccount = makeAccount({
      id: "old-debit",
      type: "debit",
      openingBalance: 50_000,
      deletedAt: "2026-09-15T00:00:00.000Z",
    });

    expect(getAvailableBalance([debit, closedAccount], [])).toBe(500_000);
  });

  it("returns zero when there are no accounts", () => {
    expect(getAvailableBalance([], [])).toBe(0);
  });
});
