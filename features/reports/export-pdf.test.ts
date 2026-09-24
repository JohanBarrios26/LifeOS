import { describe, expect, it } from "vitest";
import { pdfText } from "./export-pdf";

describe("pdfText", () => {
  it("keeps Spanish text as it is", () => {
    expect(pdfText("Reporte financiero · Septiembre de 2026")).toBe("Reporte financiero · Septiembre de 2026");
    expect(pdfText("Cuenta débito, año, niño, €")).toBe("Cuenta débito, año, niño, €");
  });

  it("replaces symbols the PDF font cannot draw", () => {
    expect(pdfText("Balance del mes (ingresos − gastos)")).toBe("Balance del mes (ingresos - gastos)");
    expect(pdfText("Cuenta débito → Tarjeta Nu")).toBe("Cuenta débito › Tarjeta Nu");
  });

  it("removes emoji a person may have typed", () => {
    expect(pdfText("Café ☕ con Ana 🎉")).toBe("Café con Ana");
  });

  it("turns non-breaking spaces from money formatting into normal spaces", () => {
    expect(pdfText("$ 1.000")).toBe("$ 1.000");
  });
});
