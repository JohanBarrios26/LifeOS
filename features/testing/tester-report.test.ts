import { describe, expect, it } from "vitest";
import { buildTesterReport, describeDevice, EMPTY_ANSWERS } from "./tester-report";

const scenarios = [
  { id: "welcome", title: "Bienvenida", steps: ["…"], expected: "…" },
  { id: "account", title: "Crear una cuenta", steps: ["…"], expected: "…" },
  { id: "report", title: "Reporte del mes", steps: ["…"], expected: "…" },
];
const questions = [
  { id: "confusing", label: "¿Qué fue lo más confuso?" },
  { id: "missing", label: "¿Qué le falta?" },
];
const context = { date: "25/09/2026", device: "Android · Chrome", version: "c3bde9c" };

describe("buildTesterReport", () => {
  it("lists each check with its result, notes and the open answers", () => {
    const report = buildTesterReport(
      {
        results: { welcome: "ok", account: "failed" },
        notes: { account: "  El saldo salió en cero  " },
        questions: { confusing: "Dónde se cambia el nombre", missing: "   " },
      },
      scenarios,
      questions,
      context,
    );

    expect(report).toBe(
      [
        "Reporte de prueba de LIFEOS",
        "Fecha: 25/09/2026",
        "Dispositivo: Android · Chrome",
        "Versión: c3bde9c",
        "Revisados: 2 de 3 (1 con problemas)",
        "",
        "✅ 1. Bienvenida",
        "❌ 2. Crear una cuenta",
        "   → El saldo salió en cero",
        "⬜ 3. Reporte del mes",
        "",
        "¿Qué fue lo más confuso?",
        "Dónde se cambia el nombre",
      ].join("\n"),
    );
  });

  it("works before the tester has answered anything", () => {
    const report = buildTesterReport(EMPTY_ANSWERS, scenarios, questions, context);

    expect(report).toContain("Revisados: 0 de 3");
    expect(report.endsWith("⬜ 3. Reporte del mes")).toBe(true);
  });
});

describe("describeDevice", () => {
  it("recognizes common phones and computers", () => {
    const androidChrome =
      "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";
    const iphoneSafari =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
    const windowsEdge =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0";

    expect(describeDevice(androidChrome, true)).toBe("Android · Chrome · instalada como app");
    expect(describeDevice(iphoneSafari, false)).toBe("iPhone · Safari");
    expect(describeDevice(windowsEdge, false)).toBe("Windows · Edge");
  });
});
