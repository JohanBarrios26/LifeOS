import { FinanceApp } from "@/features/finance/finance-app";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">LIFEOS</p>
        <h1 className="mt-1 text-2xl font-semibold">Hola, Johan 👋</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Así están tus finanzas hoy.</p>
      </header>

      <FinanceApp />

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        Tus datos se guardan solo en este navegador.
      </p>
    </main>
  );
}
