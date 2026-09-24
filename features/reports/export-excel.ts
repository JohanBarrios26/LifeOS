import type { CurrencyCode, Money } from "@/domain/finance/types";
import { downloadBlob } from "@/lib/download";
import { currencyDigits, toMajorUnits } from "@/lib/format";
import type { MonthlyReportTables } from "./report-tables";

/** Downloads the report as an .xlsx file with three sheets: summary, categories and movements. */
export async function exportReportToExcel(tables: MonthlyReportTables, currency: CurrencyCode): Promise<void> {
  // Loaded only when the button is pressed, so opening the app stays fast.
  const { default: writeExcelFile } = await import("write-excel-file/browser");

  const moneyFormat = currencyDigits(currency) === 0 ? '"$"#,##0' : '"$"#,##0.00';
  // Real numbers (not text), so the person can add them up or chart them in Excel.
  const money = (amount: Money) => ({ value: toMajorUnits(amount, currency), type: Number, format: moneyFormat });
  const header = (text: string) => ({ value: text, fontWeight: "bold" as const, backgroundColor: "#E4E4E7" });

  const blob = await writeExcelFile([
    {
      sheet: "Resumen",
      columns: [{ width: 38 }, { width: 18 }],
      data: [
        [{ value: tables.title, fontWeight: "bold" as const }],
        [],
        [header("Concepto"), header("Monto")],
        ...tables.summary.map((row) => [row.label, money(row.amount)]),
      ],
    },
    {
      sheet: "Categorías",
      columns: [{ width: 24 }, { width: 16 }, { width: 14 }, { width: 14 }],
      stickyRowsCount: 1,
      data: [
        [header("Categoría"), header("Monto"), header("% del gasto"), header("Movimientos")],
        ...tables.categories.map((category) => [
          category.category,
          money(category.amount),
          { value: category.share, type: Number, format: "0.0%" },
          category.count,
        ]),
      ],
    },
    {
      sheet: "Movimientos",
      columns: [{ width: 12 }, { width: 15 }, { width: 30 }, { width: 18 }, { width: 22 }, { width: 22 }, { width: 16 }],
      stickyRowsCount: 1,
      data: [
        ["Fecha", "Tipo", "Descripción", "Categoría", "Sale de", "Entra a", "Monto"].map(header),
        ...tables.movements.map((movement) => [
          // Written as text: a Date cell could shift a day because of time zones.
          movement.date.split("-").reverse().join("/"),
          movement.type,
          movement.description,
          movement.category,
          movement.from,
          movement.to,
          money(movement.amount),
        ]),
      ],
    },
  ]).toBlob();

  downloadBlob(`${tables.fileName}.xlsx`, blob);
}
