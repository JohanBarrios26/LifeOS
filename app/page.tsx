import { FinanceDashboard } from "@/features/finance/finance-dashboard";
import { sampleAccounts, sampleCurrency, sampleTransactions } from "@/features/finance/sample-data";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">LIFEOS</p>
        <h1 className="mt-1 text-2xl font-semibold">Hola, Johan 👋</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Así están tus finanzas hoy.</p>
      </header>

      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
        Estás viendo datos de ejemplo. Pronto podrás registrar los tuyos.
      </p>

      <FinanceDashboard accounts={sampleAccounts} transactions={sampleTransactions} currency={sampleCurrency} />
    </main>
  );
}
