import type { CurrencyCode, Money } from "@/domain/finance/types";
import { downloadBlob } from "@/lib/download";
import { formatMoney } from "@/lib/format";
import type { MonthlyReportTables } from "./report-tables";

const MARGIN = 40;
const DARK: [number, number, number] = [24, 24, 27];

/** WinAnsi characters above Latin-1's first 256 code points. */
const WIN_ANSI_EXTRAS = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");

/**
 * The built-in PDF font (Helvetica) only covers Western European characters (WinAnsi).
 * Accents, ñ and "·" are fine; anything else (like "−", "→" or emoji a person typed)
 * would come out garbled, so it is replaced or removed.
 */
export function pdfText(text: string): string {
  const replaced = text
    .replace(/\s/g, " ") // Intl's non-breaking spaces
    .replace(/−/g, "-")
    .replace(/→/g, "›");
  return [...replaced]
    .filter((char) => char.codePointAt(0)! <= 0xff || WIN_ANSI_EXTRAS.has(char))
    .join("")
    .replace(/ {2,}/g, " ")
    .trim();
}

/** Downloads the report as a printable A4 PDF. */
export async function exportReportToPdf(tables: MonthlyReportTables, currency: CurrencyCode): Promise<void> {
  // Loaded only when the button is pressed, so opening the app stays fast.
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const money = (amount: Money) => pdfText(formatMoney(amount, currency));
  const tableEnd = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const generatedOn = new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(new Date());

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("LIFEOS", MARGIN, 52);
  doc.setFontSize(13);
  doc.text(pdfText(tables.title), MARGIN, 74);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(113, 113, 122);
  doc.text(`Generado el ${generatedOn}`, MARGIN, 90);
  doc.setTextColor(0, 0, 0);

  const common = {
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: DARK, textColor: 255 },
  };

  autoTable(doc, {
    ...common,
    startY: 106,
    head: [["Resumen del mes", "Monto"]],
    body: tables.summary.map((row) => [pdfText(row.label), money(row.amount)]),
    columnStyles: { 1: { halign: "right" } },
  });

  autoTable(doc, {
    ...common,
    startY: tableEnd() + 22,
    head: [["Gastos por categoría", "Monto", "% del gasto", "Movimientos"]],
    body:
      tables.categories.length > 0
        ? tables.categories.map((category) => [
            pdfText(category.category),
            money(category.amount),
            `${(category.share * 100).toFixed(1).replace(".", ",")} %`,
            String(category.count),
          ])
        : [["Sin gastos este mes", "", "", ""]],
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });

  autoTable(doc, {
    ...common,
    startY: tableEnd() + 22,
    head: [["Fecha", "Tipo", "Descripción", "Categoría", "Cuentas", "Monto"]],
    body:
      tables.movements.length > 0
        ? tables.movements.map((movement) => [
            movement.date.split("-").reverse().join("/"),
            movement.type,
            pdfText(movement.description),
            pdfText(movement.category),
            pdfText([movement.from, movement.to].filter(Boolean).join(" → ")),
            money(movement.amount),
          ])
        : [["", "Sin movimientos este mes", "", "", "", ""]],
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 58 }, 5: { halign: "right", cellWidth: 72 } },
  });

  // Page numbers, once every table is placed.
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text(`Página ${page} de ${pages}`, doc.internal.pageSize.getWidth() - MARGIN, doc.internal.pageSize.getHeight() - 20, {
      align: "right",
    });
  }

  downloadBlob(`${tables.fileName}.pdf`, doc.output("blob"));
}
