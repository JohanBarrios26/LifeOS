import { describe, expect, it } from "vitest";
import { formatMoney, formatShortDate } from "./format";

// Intl uses non-breaking spaces; normalize them so expectations stay readable.
const format = (...args: Parameters<typeof formatMoney>) => formatMoney(...args).replace(/\s/g, " ");

describe("formatMoney", () => {
  it("formats Colombian pesos stored as whole pesos", () => {
    expect(format(1_580_000, "COP")).toBe("$ 1.580.000");
  });

  it("formats negative amounts", () => {
    expect(format(-420_000, "COP")).toBe("-$ 420.000");
  });

  it("converts cents to dollars for USD", () => {
    expect(format(1250, "USD")).toBe("US$ 12,50");
  });
});

describe("formatShortDate", () => {
  it("keeps the calendar day regardless of the device's time zone", () => {
    expect(formatShortDate("2026-09-15")).toBe("15 de sept");
    expect(formatShortDate("2026-01-01")).toBe("1 de ene");
  });
});
