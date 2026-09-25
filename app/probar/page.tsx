import type { Metadata } from "next";
import { TesterGuide } from "@/features/testing/tester-guide";

export const metadata: Metadata = {
  title: "Guía para probadores · LIFEOS",
};

export default function TesterGuidePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-4 pb-8">
      <header>
        <h1 className="text-2xl font-semibold">Guía para probadores</h1>
        <p className="text-zinc-600 dark:text-zinc-400">14 pasos cortos para revisar que LIFEOS funcione bien.</p>
      </header>

      <TesterGuide />
    </main>
  );
}
