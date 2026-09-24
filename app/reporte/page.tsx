import type { Metadata } from "next";
import { MonthlyReport } from "@/features/reports/monthly-report";

export const metadata: Metadata = {
  title: "Reporte mensual · LIFEOS",
};

export default function ReportPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-4 pb-8">
      <header>
        <h1 className="text-2xl font-semibold">Reporte mensual</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Cómo te fue mes a mes, con tus datos reales.</p>
      </header>

      <MonthlyReport />
    </main>
  );
}
