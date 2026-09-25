import Link from "next/link";
import { FinanceApp } from "@/features/finance/finance-app";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-4 pb-8">
      {/* The greeting lives inside FinanceApp: the name is stored in the browser, not in the code. */}
      <FinanceApp />

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        ¿Te invitaron a probar LIFEOS?{" "}
        <Link href="/probar" className="font-medium underline hover:text-zinc-900 dark:hover:text-zinc-100">
          Abre la guía para probadores
        </Link>
      </p>
    </main>
  );
}
