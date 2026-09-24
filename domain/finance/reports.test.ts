import { describe, expect, it } from "vitest";
import { getMonthlySummary, UNCATEGORIZED } from "./reports";
import { makeAccount, makeTransaction } from "./test-factories";

const opened = "2026-08-01";
const debit = makeAccount({ id: "debit", openingBalance: 1_000_000, openingDate: opened });
const savings = makeAccount({ id: "savings", type: "savings", openingBalance: 0, openingDate: opened });
const card = makeAccount({ id: "card", type: "credit", openingBalance: -500_000, openingDate: opened });
const openedInOctober = makeAccount({ id: "later", type: "cash", openingBalance: 50_000, openingDate: "2026-10-01" });
const accounts = [debit, savings, card, openedInOctober];

const september = [
  makeTransaction({ kind: "income", date: "2026-09-01", amount: 2_500_000, toAccountId: "debit", category: "Salario" }),
  makeTransaction({ kind: "expense", date: "2026-09-03", amount: 180_000, fromAccountId: "debit", category: "Mercado" }),
  makeTransaction({ kind: "expense", date: "2026-09-05", amount: 25_000, fromAccountId: "debit", category: "Comida" }),
  makeTransaction({ kind: "expense", date: "2026-09-06", amount: 45_000, fromAccountId: "card", category: "comida" }),
  makeTransaction({ kind: "expense", date: "2026-09-07", amount: 10_000, fromAccountId: "debit" }),
  makeTransaction({ kind: "expense", date: "2026-09-10", amount: 18_500, fromAccountId: "card", category: "Intereses" }),
  makeTransaction({ kind: "transfer", date: "2026-09-15", amount: 300_000, fromAccountId: "debit", toAccountId: "card" }),
  makeTransaction({ kind: "transfer", date: "2026-09-16", amount: 400_000, fromAccountId: "debit", toAccountId: "savings" }),
];
const deletedInSeptember = makeTransaction({
  kind: "expense",
  date: "2026-09-17",
  amount: 99_000,
  fromAccountId: "debit",
  deletedAt: "2026-09-18T00:00:00.000Z",
});
const august = makeTransaction({ kind: "expense", date: "2026-08-20", amount: 70_000, fromAccountId: "debit" });
const october = makeTransaction({ kind: "income", date: "2026-10-01", amount: 1_000_000, toAccountId: "debit" });

const transactions = [october, ...september, deletedInSeptember, august];
const summary = getMonthlySummary(accounts, transactions, "2026-09");

describe("getMonthlySummary", () => {
  it("adds up the month's income and expenses, ignoring other months and deleted records", () => {
    expect(summary.income).toBe(2_500_000);
    expect(summary.expenses).toBe(278_500);
    expect(summary.net).toBe(2_221_500);
  });

  it("counts a card purchase as an expense, and paying the card as a debt payment (not a second expense)", () => {
    expect(summary.debtPayments).toBe(300_000);
  });

  it("does not count moving money to savings as spending", () => {
    // 278.500 already excludes the 400.000 transfer to savings.
    expect(summary.expenses).toBe(278_500);
  });

  it("reports the interest paid", () => {
    expect(summary.interest).toBe(18_500);
  });

  it("groups expenses by category, largest first, ignoring capital letters", () => {
    expect(summary.expensesByCategory).toEqual([
      { category: "Mercado", amount: 180_000, count: 1 },
      { category: "Comida", amount: 70_000, count: 2 },
      { category: "Intereses", amount: 18_500, count: 1 },
      { category: UNCATEGORIZED, amount: 10_000, count: 1 },
    ]);
  });

  it("calculates the position on the last day of the month", () => {
    // Debit: 1.000.000 − 70.000 (Aug) + 2.500.000 − 180.000 − 25.000 − 10.000 − 300.000 − 400.000
    // Savings: 400.000. The October income and the account opened in October are not included.
    expect(summary.availableAtEnd).toBe(2_915_000);
    // Card: 500.000 + 45.000 + 18.500 − 300.000
    expect(summary.debtAtEnd).toBe(263_500);
  });

  it("lists the month's transactions from oldest to newest", () => {
    expect(summary.transactions).toEqual(september);
  });

  it("returns an empty report for a month without movements", () => {
    const empty = getMonthlySummary(accounts, transactions, "2026-07");

    expect(empty).toMatchObject({ income: 0, expenses: 0, net: 0, expensesByCategory: [], transactions: [] });
  });
});
