import { describe, expect, it } from "vitest";
import { getMonthlySummary } from "@/domain/finance/reports";
import { makeAccount, makeTransaction } from "@/domain/finance/test-factories";
import { buildReportTables } from "./report-tables";

const debit = makeAccount({ id: "debit", name: "Cuenta débito", openingBalance: 1_000_000 });
const savings = makeAccount({ id: "savings", name: "Ahorros", type: "savings" });
const card = makeAccount({ id: "card", name: "Tarjeta Nu", type: "credit", openingBalance: -200_000 });
const accounts = [debit, savings, card];

const transactions = [
  makeTransaction({ kind: "income", date: "2026-09-01", amount: 2_000_000, toAccountId: "debit", description: "Salario" }),
  makeTransaction({ kind: "expense", date: "2026-09-02", amount: 150_000, fromAccountId: "debit", category: "Mercado" }),
  makeTransaction({ kind: "expense", date: "2026-09-03", amount: 50_000, fromAccountId: "card", category: "Comida" }),
  makeTransaction({ kind: "transfer", date: "2026-09-04", amount: 100_000, fromAccountId: "debit", toAccountId: "card" }),
  makeTransaction({ kind: "transfer", date: "2026-09-05", amount: 300_000, fromAccountId: "debit", toAccountId: "savings" }),
];

const tables = buildReportTables(getMonthlySummary(accounts, transactions, "2026-09"), accounts);

describe("buildReportTables", () => {
  it("names the report and the file after the month", () => {
    expect(tables.title).toBe("Reporte financiero · Septiembre de 2026");
    expect(tables.fileName).toBe("lifeos-reporte-2026-09");
  });

  it("summarizes the month in the order a person reads it", () => {
    expect(tables.summary.map((row) => [row.label, row.amount])).toEqual([
      ["Ingresos", 2_000_000],
      ["Gastos", 200_000],
      ["Balance del mes (ingresos − gastos)", 1_800_000],
      ["Pagos a deudas", 100_000],
      ["Intereses pagados", 0],
      // Debit 2.450.000 + savings 300.000.
      ["Disponible al cierre del mes", 2_750_000],
      ["Deuda al cierre del mes", 150_000],
    ]);
  });

  it("shows each category's share of the month's spending", () => {
    expect(tables.categories).toEqual([
      { category: "Mercado", amount: 150_000, share: 0.75, count: 1 },
      { category: "Comida", amount: 50_000, share: 0.25, count: 1 },
    ]);
  });

  it("lists movements with account names and a readable type", () => {
    expect(tables.movements.map((movement) => [movement.type, movement.from, movement.to])).toEqual([
      ["Ingreso", "", "Cuenta débito"],
      ["Gasto", "Cuenta débito", ""],
      ["Gasto", "Tarjeta Nu", ""],
      ["Pago de deuda", "Cuenta débito", "Tarjeta Nu"],
      ["Transferencia", "Cuenta débito", "Ahorros"],
    ]);
  });
});
