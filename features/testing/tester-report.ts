import type { Scenario } from "./scenarios";

export type ScenarioResult = "ok" | "failed";

/** What a tester has answered so far. Saved only in their browser. */
export interface TesterAnswers {
  results: Record<string, ScenarioResult>;
  notes: Record<string, string>;
  questions: Record<string, string>;
}

export const EMPTY_ANSWERS: TesterAnswers = { results: {}, notes: {}, questions: {} };

const RESULT_ICONS: Record<ScenarioResult | "pending", string> = { ok: "✅", failed: "❌", pending: "⬜" };

/**
 * The text a tester sends back. It contains their answers and their device, never their
 * financial data (that stays in their browser).
 */
export function buildTesterReport(
  answers: TesterAnswers,
  scenarios: Scenario[],
  questions: { id: string; label: string }[],
  context: { date: string; device: string; version: string },
): string {
  const done = scenarios.filter((scenario) => answers.results[scenario.id]).length;
  const failed = scenarios.filter((scenario) => answers.results[scenario.id] === "failed").length;

  const scenarioLines = scenarios.map((scenario, index) => {
    const icon = RESULT_ICONS[answers.results[scenario.id] ?? "pending"];
    const note = answers.notes[scenario.id]?.trim();
    return `${icon} ${index + 1}. ${scenario.title}${note ? `\n   → ${note}` : ""}`;
  });

  const questionLines = questions
    .map((question) => ({ ...question, answer: answers.questions[question.id]?.trim() }))
    .filter((question) => question.answer)
    .map((question) => `${question.label}\n${question.answer}`);

  return [
    "Reporte de prueba de LIFEOS",
    `Fecha: ${context.date}`,
    `Dispositivo: ${context.device}`,
    `Versión: ${context.version}`,
    `Revisados: ${done} de ${scenarios.length}${failed > 0 ? ` (${failed} con problemas)` : ""}`,
    "",
    ...scenarioLines,
    ...(questionLines.length > 0 ? ["", ...questionLines.flatMap((text) => [text, ""])] : []),
  ]
    .join("\n")
    .trim();
}

/** A short, readable description of the device, e.g. "Android · Chrome · instalada como app". */
export function describeDevice(userAgent: string, installed: boolean): string {
  const system = /iPhone/.test(userAgent)
    ? "iPhone"
    : /iPad/.test(userAgent)
      ? "iPad"
      : /Android/.test(userAgent)
        ? "Android"
        : /Windows/.test(userAgent)
          ? "Windows"
          : /Mac OS X/.test(userAgent)
            ? "Mac"
            : /Linux/.test(userAgent)
              ? "Linux"
              : "Otro sistema";
  // Order matters: Edge and Samsung Internet also say "Chrome", and Chrome also says "Safari".
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /SamsungBrowser/.test(userAgent)
      ? "Samsung Internet"
      : /Firefox|FxiOS/.test(userAgent)
        ? "Firefox"
        : /Chrome|CriOS/.test(userAgent)
          ? "Chrome"
          : /Safari/.test(userAgent)
            ? "Safari"
            : "Otro navegador";
  return `${system} · ${browser}${installed ? " · instalada como app" : ""}`;
}
