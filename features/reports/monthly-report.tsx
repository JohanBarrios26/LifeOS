"use client";

import { useState } from "react";
import { Button } from "@/components/form";
import { getMonthlySummary } from "@/domain/finance/reports";
import type { Money } from "@/domain/finance/types";
import { monthOf, shiftMonth } from "@/domain/month";
import { useFinanceData } from "@/features/finance/use-finance-data";
import { toLocalDate } from "@/lib/dates";
import { formatMoney, formatMonth } from "@/lib/format";
import { DEFAULT_CURRENCY } from "@/lib/preferences";
import { exportReportToExcel } from "./export-excel";
import { exportReportToPdf } from "./export-pdf";
import { buildReportTables } from "./report-tables";

type ExportFormat = "excel" | "pdf";

export function MonthlyReport() {
  const { data, failed } = useFinanceData();
  const currentMonth = monthOf(toLocalDate());
  const [month, setMonth] = useState(currentMonth);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportFailed, setExportFailed] = useState(false);
  const currency = DEFAULT_CURRENCY;

  if (failed) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
        No pudimos abrir tus datos en este navegador.
      </p>
    );
  }
  if (!data) {
    return <p className="text-zinc-500 dark:text-zinc-400">Cargando tus datos…</p>;
  }

  const { accounts, transactions } = data;
  const summary = getMonthlySummary(accounts, transactions, month);
  const monthName = formatMonth(month);
  const money = (amount: Money) => formatMoney(amount, currency);

  async function download(format: ExportFormat) {
    setExporting(format);
    setExportFailed(false);
    try {
      const tables = buildReportTables(summary, accounts);
      await (format === "excel" ? exportReportToExcel(tables, currency) : exportReportToPdf(tables, currency));
    } catch {
      setExportFailed(true);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
        {/* setMonth(previous => …) uses the latest month, even with several quick clicks. */}
        <MonthButton label="Mes anterior" onClick={() => setMonth((previous) => shiftMonth(previous, -1))}>
          ‹
        </MonthButton>
        <h2 className="font-semibold" aria-live="polite">
          {monthName}
        </h2>
        <MonthButton
          label="Mes siguiente"
          onClick={() => setMonth((previous) => (previous < currentMonth ? shiftMonth(previous, 1) : previous))}
          disabled={month >= currentMonth}
        >
          ›
        </MonthButton>
      </div>

      {summary.transactions.length === 0 && (
        <p className="rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No hay movimientos en {monthName.toLowerCase()}.
        </p>
      )}

      <section className="grid grid-cols-2 gap-3" aria-label="Resumen del mes">
        <Stat label="Ingresos" value={money(summary.income)} tone="positive" />
        <Stat label="Gastos" value={money(summary.expenses)} tone="negative" />
        <Stat
          label="Balance del mes"
          hint="Ingresos − gastos"
          value={money(summary.net)}
          tone={summary.net < 0 ? "negative" : "neutral"}
        />
        <Stat label="Pagos a deudas" value={money(summary.debtPayments)} tone="neutral" />
      </section>

      {summary.interest > 0 && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Este mes pagaste <strong>{money(summary.interest)}</strong> en intereses.
        </p>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">¿En qué se fue tu dinero?</h2>
        {summary.expensesByCategory.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin gastos este mes.</p>
        ) : (
          <ul className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            {summary.expensesByCategory.map((category) => {
              const share = summary.expenses > 0 ? category.amount / summary.expenses : 0;
              return (
                <li key={category.category}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{category.category}</span>
                    <span className="shrink-0 tabular-nums">
                      {money(category.amount)}{" "}
                      <span className="text-zinc-500 dark:text-zinc-400">· {Math.round(share * 100)} %</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800" aria-hidden>
                    <div
                      className="h-2 rounded-full bg-zinc-900 dark:bg-zinc-100"
                      style={{ width: `${Math.max(share * 100, 2)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Al cierre del mes</h2>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Disponible" value={money(summary.availableAtEnd)} tone="neutral" />
          <Stat label="Deuda" value={money(summary.debtAtEnd)} tone="neutral" />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h2 className="font-semibold">Descargar reporte</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Incluye el resumen, los gastos por categoría y todos los movimientos de {monthName.toLowerCase()}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => download("excel")} disabled={exporting !== null} className="flex-1">
            {exporting === "excel" ? "Generando…" : "Excel"}
          </Button>
          <Button onClick={() => download("pdf")} disabled={exporting !== null} className="flex-1">
            {exporting === "pdf" ? "Generando…" : "PDF"}
          </Button>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Los archivos contienen tu información financiera: guárdalos en un lugar privado.
        </p>
        {exportFailed && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            No se pudo generar el archivo. Inténtalo de nuevo.
          </p>
        )}
      </section>
    </div>
  );
}

function MonthButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="h-10 w-10 rounded-xl text-xl hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: "positive" | "negative" | "neutral";
}) {
  const toneClasses = {
    positive: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    negative: "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100",
    neutral: "border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
  }[tone];

  return (
    <div className={`rounded-2xl p-4 ${toneClasses}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs opacity-60">{hint}</p>}
    </div>
  );
}

