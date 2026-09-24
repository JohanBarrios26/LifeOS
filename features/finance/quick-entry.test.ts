import { describe, expect, it } from "vitest";
import { makeAccount, makeTransaction } from "@/domain/finance/test-factories";
import { validateTransaction } from "@/domain/finance/validation";
import { type QuickEntryContext, parseQuickEntry } from "./quick-entry";

const debit = makeAccount({ id: "debit", name: "Cuenta débito", type: "debit" });
const wallet = makeAccount({ id: "wallet", name: "Billetera", type: "cash" });
const savings = makeAccount({ id: "savings", name: "Fondo de emergencia", type: "savings" });
const nu = makeAccount({ id: "nu", name: "Tarjeta Nu", type: "credit" });

const history = [
  makeTransaction({ kind: "expense", fromAccountId: "debit" }),
  makeTransaction({ kind: "expense", fromAccountId: "debit" }),
  makeTransaction({ kind: "expense", fromAccountId: "nu" }),
  makeTransaction({ kind: "income", toAccountId: "debit" }),
  makeTransaction({ kind: "transfer", fromAccountId: "debit", toAccountId: "nu" }),
];

const context: QuickEntryContext = {
  accounts: [debit, wallet, savings, nu],
  transactions: history,
  currency: "COP",
  today: "2026-09-23",
};

const parse = (text: string, overrides: Partial<QuickEntryContext> = {}) =>
  parseQuickEntry(text, { ...context, ...overrides });

describe("parseQuickEntry", () => {
  it("understands a typical expense", () => {
    expect(parse("almuerzo 25 mil con la nu")).toEqual({
      input: {
        kind: "expense",
        amount: 25_000,
        date: "2026-09-23",
        fromAccountId: "nu",
        category: "Comida",
        description: "Almuerzo",
      },
      guessed: { source: false, destination: false },
    });
  });

  it("reads amounts written in many Colombian ways", () => {
    const amounts: [string, number][] = [
      ["25000", 25_000],
      ["25.000", 25_000],
      ["$25.000", 25_000],
      ["25 mil", 25_000],
      ["25mil", 25_000],
      ["25k", 25_000],
      ["30 lucas", 30_000],
      ["1.200.000", 1_200_000],
      ["1,5 millones", 1_500_000],
      ["2.5 millones", 2_500_000],
      ["2 palos", 2_000_000],
    ];
    for (const [written, expected] of amounts) {
      expect(parse(`taxi ${written}`).input.amount, written).toBe(expected);
    }
  });

  it("prefers the number written as money when there are several", () => {
    const { input } = parse("2 empanadas 5 mil");

    expect(input.amount).toBe(5_000);
    expect(input.description).toBe("2 empanadas");
  });

  it("finds accounts by type words and understands relative dates", () => {
    expect(parse("taxi 12k efectivo ayer").input).toMatchObject({
      fromAccountId: "wallet",
      category: "Transporte",
      date: "2026-09-22",
    });
    expect(parse("mercado 180 mil débito antier").input).toMatchObject({
      fromAccountId: "debit",
      category: "Mercado",
      date: "2026-09-21",
    });
  });

  it("uses the account used most often when none is mentioned, and says so", () => {
    const draft = parse("cine 30 mil");

    expect(draft.input.fromAccountId).toBe("debit");
    expect(draft.guessed.source).toBe(true);
  });

  it("recognizes income", () => {
    const draft = parse("salario 2,5 millones");

    expect(draft.input).toMatchObject({ kind: "income", amount: 2_500_000, toAccountId: "debit", category: "Salario" });
    expect(draft.guessed.destination).toBe(true);
    expect(parse("prima 1.200.000").input.category).toBe("Prima");
  });

  it("recognizes a debt payment only when a debt is mentioned", () => {
    expect(parse("pago nu 300 mil desde débito").input).toMatchObject({
      kind: "transfer",
      fromAccountId: "debit",
      toAccountId: "nu",
      category: "Pago de deuda",
    });
    // Paying the rent is an expense, not a debt payment.
    expect(parse("pagué el arriendo 1.200.000 con débito").input).toMatchObject({
      kind: "expense",
      fromAccountId: "debit",
      category: "Hogar",
      description: "Pagué el arriendo",
    });
  });

  it("guesses where a debt payment comes from", () => {
    const draft = parse("abono a la nu 200 mil");

    expect(draft.input).toMatchObject({ kind: "transfer", fromAccountId: "debit", toAccountId: "nu" });
    expect(draft.guessed.source).toBe(true);
  });

  it("recognizes moving money to savings", () => {
    expect(parse("ahorro 400 mil").input).toMatchObject({
      kind: "transfer",
      toAccountId: "savings",
      fromAccountId: "debit",
      category: "Ahorro",
    });
  });

  it("does not choose between two cards when only 'tarjeta' is written", () => {
    const secondCard = makeAccount({ id: "visa", name: "Visa Bancolombia", type: "credit" });
    const draft = parse("cena 80 mil con tarjeta", { accounts: [debit, nu, secondCard], transactions: [] });

    expect(draft.input.fromAccountId).toBeUndefined();
    expect(draft.input.description).toBe("Cena");
  });

  it("leaves what it cannot understand for validation to report", () => {
    const { input } = parse("algo raro", { transactions: [] });

    expect(validateTransaction(input)).toEqual(
      expect.arrayContaining(["amount_not_integer", "missing_source_account"]),
    );
  });
});
