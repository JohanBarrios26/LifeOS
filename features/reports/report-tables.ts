import { isDebtAccountType } from "@/domain/finance/accounts";
import type { MonthlySummary } from "@/domain/finance/reports";
import type { Account, LocalDate, Money, Transaction } from "@/domain/finance/types";
import { TRANSACTION_KIND_LABELS } from "@/features/finance/labels";
import { formatMonth } from "@/lib/format";

export interface ReportMovement {
  date: LocalDate;
  type: string;
  description: string;
  category: string;
  from: string;
  to: string;
  amount: Money;
}

export interface ReportCategory {
  category: string;
  amount: Money;
  /** Share of the month's expenses, from 0 to 1. */
  share: number;
  count: number;
}

/** The report as plain tables, shared by the Excel and PDF files so both always match. */
export interface MonthlyReportTables {
  title: string;
  fileName: string;
  summary: { label: string; amount: Money }[];
  categories: ReportCategory[];
  movements: ReportMovement[];
}

export function buildReportTables(summary: MonthlySummary, accounts: Account[]): MonthlyReportTables {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const accountName = (id?: string) => (id ? (accountsById.get(id)?.name ?? "") : "");

  return {
    title: `Reporte financiero · ${formatMonth(summary.month)}`,
    fileName: `lifeos-reporte-${summary.month}`,
    summary: [
      { label: "Ingresos", amount: summary.income },
      { label: "Gastos", amount: summary.expenses },
      { label: "Balance del mes (ingresos − gastos)", amount: summary.net },
      { label: "Pagos a deudas", amount: summary.debtPayments },
      { label: "Intereses pagados", amount: summary.interest },
      { label: "Disponible al cierre del mes", amount: summary.availableAtEnd },
      { label: "Deuda al cierre del mes", amount: summary.debtAtEnd },
    ],
    categories: summary.expensesByCategory.map((total) => ({
      ...total,
      share: summary.expenses > 0 ? total.amount / summary.expenses : 0,
    })),
    movements: summary.transactions.map((transaction) => ({
      date: transaction.date,
      type: describeType(transaction, accountsById),
      description: transaction.description ?? "",
      category: transaction.category ?? "",
      from: accountName(transaction.fromAccountId),
      to: accountName(transaction.toAccountId),
      amount: transaction.amount,
    })),
  };
}

function describeType(transaction: Transaction, accountsById: Map<string, Account>): string {
  const from = transaction.fromAccountId ? accountsById.get(transaction.fromAccountId) : undefined;
  const to = transaction.toAccountId ? accountsById.get(transaction.toAccountId) : undefined;
  if (transaction.kind === "transfer" && to && isDebtAccountType(to.type) && from && !isDebtAccountType(from.type)) {
    return "Pago de deuda";
  }
  return TRANSACTION_KIND_LABELS[transaction.kind];
}
