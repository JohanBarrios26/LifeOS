import { describe, expect, it } from "vitest";
import { markUpdated } from "@/domain/entity";
import { getAvailableBalance, getTotalDebt } from "@/domain/finance/balance";
import { getMonthlySummary } from "@/domain/finance/reports";
import { makeAccount, makeTransaction } from "@/domain/finance/test-factories";
import type { Transaction } from "@/domain/finance/types";
import { validateTransaction } from "@/domain/finance/validation";
import { parseQuickEntry } from "@/features/finance/quick-entry";
import { ALL_SCENARIOS } from "./scenarios";

// Walks through the tester guide with the real functions, so the numbers it promises are true.
describe("tester guide scenarios", () => {
  const today = "2026-09-25";
  const accounts = [
    makeAccount({ id: "mi-debito", name: "Mi débito", type: "debit", openingBalance: 1_000_000 }),
    makeAccount({ id: "mi-tarjeta", name: "Mi tarjeta", type: "credit", openingBalance: -500_000 }),
  ];
  let transactions: Transaction[] = [];
  const totals = () => ({
    available: getAvailableBalance(accounts, transactions),
    debt: getTotalDebt(accounts, transactions),
  });
  const quick = (text: string) => {
    const { input } = parseQuickEntry(text, { accounts, transactions, currency: "COP", today });
    expect(validateTransaction(input)).toEqual([]);
    const transaction = makeTransaction({ ...input });
    transactions = [...transactions, transaction];
    return transaction;
  };

  it("matches every step of the guide", () => {
    expect(totals()).toEqual({ available: 1_000_000, debt: 500_000 });

    const lunch = quick("almuerzo 25 mil con la tarjeta");
    expect(lunch).toMatchObject({ kind: "expense", amount: 25_000, fromAccountId: "mi-tarjeta", category: "Comida" });
    expect(totals()).toEqual({ available: 1_000_000, debt: 525_000 });

    expect(quick("salario 2 millones")).toMatchObject({ kind: "income", amount: 2_000_000 });
    expect(totals()).toEqual({ available: 3_000_000, debt: 525_000 });

    expect(quick("pago tarjeta 200 mil")).toMatchObject({
      kind: "transfer",
      fromAccountId: "mi-debito",
      toAccountId: "mi-tarjeta",
    });
    expect(totals()).toEqual({ available: 2_800_000, debt: 325_000 });

    const missing = parseQuickEntry("taxi", { accounts, transactions, currency: "COP", today });
    expect(validateTransaction(missing.input)).toContain("amount_not_integer");

    const edited = markUpdated(lunch, { amount: 30_000 });
    transactions = transactions.map((transaction) => (transaction.id === lunch.id ? edited : transaction));
    expect(totals().debt).toBe(330_000);

    const withoutLunch = transactions.filter((transaction) => transaction.id !== lunch.id);
    expect(getTotalDebt(accounts, withoutLunch)).toBe(300_000);

    const report = getMonthlySummary(accounts, transactions, "2026-09");
    expect(report).toMatchObject({ income: 2_000_000, expenses: 30_000, debtPayments: 200_000 });
  });

  it("gives every scenario a unique id, steps and an expected result", () => {
    const ids = ALL_SCENARIOS.map((scenario) => scenario.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const scenario of ALL_SCENARIOS) {
      expect(scenario.steps.length).toBeGreaterThan(0);
      expect(scenario.expected).not.toBe("");
    }
  });
});
