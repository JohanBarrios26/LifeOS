"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, inputClassName } from "@/components/form";
import { useIsBrowser } from "@/lib/use-is-browser";
import { ALL_SCENARIOS, OPEN_QUESTIONS, SCENARIO_GROUPS, type Scenario } from "./scenarios";
import {
  buildTesterReport,
  describeDevice,
  EMPTY_ANSWERS,
  type ScenarioResult,
  type TesterAnswers,
} from "./tester-report";

const STORAGE_KEY = "lifeos-tester-guide";
// Vercel provides the commit of each deploy; it tells which version a report refers to.
const VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

// The guide reads this browser's saved answers, so it only renders in the browser.
export function TesterGuide() {
  return useIsBrowser() ? <Guide /> : <p className="text-zinc-500 dark:text-zinc-400">Cargando la guía…</p>;
}

/** Answers are only a convenience while testing: if storage is blocked, the guide still works. */
function loadAnswers(): TesterAnswers {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...EMPTY_ANSWERS, ...JSON.parse(saved) } : EMPTY_ANSWERS;
  } catch {
    return EMPTY_ANSWERS;
  }
}

function storeAnswers(answers: TesterAnswers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // Private mode or storage full: answers simply are not remembered.
  }
}

function Guide() {
  const [answers, setAnswers] = useState<TesterAnswers>(loadAnswers);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  function update(next: TesterAnswers) {
    setAnswers(next);
    storeAnswers(next);
    setShareMessage(null);
  }

  const installed =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const report = buildTesterReport(answers, ALL_SCENARIOS, OPEN_QUESTIONS, {
    date: new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date()),
    device: describeDevice(navigator.userAgent, installed),
    version: VERSION,
  });
  const reviewed = ALL_SCENARIOS.filter((scenario) => answers.results[scenario.id]).length;

  async function copyReport() {
    const copied = await copyText(report);
    setShareMessage(
      copied
        ? "Copiado ✓ Pégalo en WhatsApp o en un correo para quien te invitó a probar LIFEOS."
        : "No se pudo copiar automáticamente: abre “Ver el texto del reporte” y cópialo a mano.",
    );
  }

  async function shareReport() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Reporte de prueba de LIFEOS", text: report });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return; // The person closed the share menu.
        }
      }
    }
    await copyReport();
  }

  function startOver() {
    if (window.confirm("¿Borrar todas tus respuestas de esta guía? Tus datos de LIFEOS no se tocan.")) {
      update(EMPTY_ANSWERS);
    }
  }

  let number = 0;
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50">
        <p className="font-semibold">Gracias por probar LIFEOS 🙌</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Sigue los pasos en orden, empezando con LIFEOS vacío. Ve a <Link href="/" className="underline">Inicio</Link> y vuelve
            aquí: tus marcas se guardan.
          </li>
          <li>Marca si funcionó o no, y cuenta qué pasó.</li>
          <li>Al final toca “Compartir reporte” y envíaselo a quien te invitó.</li>
        </ol>
        <p className="opacity-80">
          🔒 El reporte solo incluye tus respuestas y tu tipo de dispositivo, nunca tus datos financieros.
        </p>
      </section>

      <div>
        <p className="mb-1 text-sm font-medium">
          Revisados: {reviewed} de {ALL_SCENARIOS.length}
        </p>
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800" aria-hidden>
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${(reviewed / ALL_SCENARIOS.length) * 100}%` }}
          />
        </div>
      </div>

      {SCENARIO_GROUPS.map((group) => (
        <section key={group.title} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{group.title}</h2>
          {group.scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              number={++number}
              scenario={scenario}
              result={answers.results[scenario.id]}
              note={answers.notes[scenario.id] ?? ""}
              onResult={(result) =>
                update({
                  ...answers,
                  results: toggle(answers.results, scenario.id, result),
                })
              }
              onNote={(note) => update({ ...answers, notes: { ...answers.notes, [scenario.id]: note } })}
            />
          ))}
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Tu opinión</h2>
        {OPEN_QUESTIONS.map((question) => (
          <div key={question.id} className="flex flex-col gap-1.5">
            <label htmlFor={`question-${question.id}`} className="text-sm font-medium">
              {question.label}
            </label>
            <textarea
              id={`question-${question.id}`}
              rows={3}
              value={answers.questions[question.id] ?? ""}
              onChange={(event) =>
                update({ ...answers, questions: { ...answers.questions, [question.id]: event.target.value } })
              }
              className={inputClassName}
            />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">Enviar tu reporte</h2>
        <div className="flex gap-2">
          <Button onClick={shareReport} className="flex-1">
            Compartir reporte
          </Button>
          <Button variant="secondary" onClick={copyReport}>
            Copiar
          </Button>
        </div>
        {shareMessage && (
          <p role="status" className="text-sm text-zinc-700 dark:text-zinc-300">
            {shareMessage}
          </p>
        )}
        <details className="text-sm">
          <summary className="cursor-pointer text-zinc-600 dark:text-zinc-400">Ver el texto del reporte</summary>
          <textarea readOnly rows={12} value={report} className={`${inputClassName} mt-2 font-mono text-xs`} />
        </details>
      </section>

      <button
        type="button"
        onClick={startOver}
        className="self-center rounded-lg px-3 py-1.5 text-sm text-zinc-500 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Empezar la guía de nuevo
      </button>
    </div>
  );
}

/**
 * Copies text with the modern clipboard API, or with the older "select and copy" method
 * that some browsers and embedded views still need.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      area.remove();
    }
  }
}

/** Tapping the chosen answer again clears it. */
function toggle(
  results: Record<string, ScenarioResult>,
  id: string,
  result: ScenarioResult,
): Record<string, ScenarioResult> {
  const next = { ...results };
  if (next[id] === result) {
    delete next[id];
  } else {
    next[id] = result;
  }
  return next;
}

function ScenarioCard({
  number,
  scenario,
  result,
  note,
  onResult,
  onNote,
}: {
  number: number;
  scenario: Scenario;
  result: ScenarioResult | undefined;
  note: string;
  onResult: (result: ScenarioResult) => void;
  onNote: (note: string) => void;
}) {
  const border =
    result === "ok"
      ? "border-emerald-300 dark:border-emerald-800"
      : result === "failed"
        ? "border-red-300 dark:border-red-800"
        : "border-zinc-200 dark:border-zinc-800";

  return (
    <article className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 dark:bg-zinc-900 ${border}`}>
      <h3 className="font-semibold">
        {number}. {scenario.title}
      </h3>
      <ol className="list-decimal space-y-1 pl-5 text-sm">
        {scenario.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="rounded-xl bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-950">
        <span className="font-medium">Deberías ver: </span>
        {scenario.expected}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <ResultButton active={result === "ok"} onClick={() => onResult("ok")} tone="ok">
          ✅ Funcionó
        </ResultButton>
        <ResultButton active={result === "failed"} onClick={() => onResult("failed")} tone="failed">
          ❌ Algo falló
        </ResultButton>
      </div>
      {(result || note) && (
        <textarea
          aria-label={`Comentario sobre “${scenario.title}”`}
          rows={2}
          value={note}
          onChange={(event) => onNote(event.target.value)}
          placeholder={result === "failed" ? "¿Qué pasó? ¿Qué viste en vez de lo esperado?" : "Comentario (opcional)"}
          className={inputClassName}
        />
      )}
    </article>
  );
}

function ResultButton({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone: ScenarioResult;
  children: string;
}) {
  const activeClasses =
    tone === "ok"
      ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
      : "border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100";

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
        active ? activeClasses : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}
