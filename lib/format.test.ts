import { describe, expect, it } from "vitest";
import {
  currencySymbol,
  formatAmountInput,
  formatMoney,
  formatMonth,
  formatShortDate,
  parseAmount,
  toMajorUnits,
} from "./format";

describe("currencySymbol", () => {
  it("gives the symbol shown next to amounts", () => {
    expect(currencySymbol("COP")).toBe("$");
    expect(currencySymbol("USD")).toBe("US$");
    expect(currencySymbol("BRL")).toBe("R$");
    expect(currencySymbol("EUR")).toBe("€");
  });
});

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

  it("writes reais and euros with the symbols people recognize", () => {
    expect(format(4590, "BRL")).toBe("R$ 45,90");
    expect(format(-123_450, "EUR")).toBe("-€ 1.234,50");
  });
});

describe("parseAmount", () => {
  it("reads pesos written with or without thousands separators", () => {
    expect(parseAmount("1.200.000", "COP")).toBe(1_200_000);
    expect(parseAmount("1200000", "COP")).toBe(1_200_000);
    expect(parseAmount("$ 50.000", "COP")).toBe(50_000);
    expect(parseAmount("0", "COP")).toBe(0);
  });

  it("converts dollars with decimals into cents", () => {
    expect(parseAmount("12,50", "USD")).toBe(1250);
    expect(parseAmount("0,29", "USD")).toBe(29);
    expect(parseAmount("40", "USD")).toBe(4000);
  });

  it("rejects text that is not a valid amount", () => {
    expect(parseAmount("", "COP")).toBeNull();
    expect(parseAmount("abc", "COP")).toBeNull();
    expect(parseAmount("-5.000", "COP")).toBeNull();
    expect(parseAmount("12,5", "COP")).toBeNull();
    expect(parseAmount("12,505", "USD")).toBeNull();
  });
});

describe("formatAmountInput", () => {
  it("writes amounts the way a person types them", () => {
    expect(formatAmountInput(120_000, "COP")).toBe("120.000");
    expect(formatAmountInput(1250, "USD")).toBe("12,50");
  });

  it("produces text that parseAmount reads back to the same amount", () => {
    for (const [amount, currency] of [
      [1_200_000, "COP"],
      [5, "COP"],
      [1250, "USD"],
      [123_456_789, "USD"],
    ] as const) {
      expect(parseAmount(formatAmountInput(amount, currency), currency)).toBe(amount);
    }
  });
});

describe("toMajorUnits", () => {
  it("converts stored amounts to pesos or dollars", () => {
    expect(toMajorUnits(1_580_000, "COP")).toBe(1_580_000);
    expect(toMajorUnits(1250, "USD")).toBe(12.5);
  });
});

describe("formatMonth", () => {
  it("writes the month name in Spanish, capitalized for titles", () => {
    expect(formatMonth("2026-09")).toBe("Septiembre de 2026");
    expect(formatMonth("2027-01")).toBe("Enero de 2027");
  });
});

describe("formatShortDate", () => {
  it("keeps the calendar day regardless of the device's time zone", () => {
    expect(formatShortDate("2026-09-15")).toBe("15 de sept");
    expect(formatShortDate("2026-01-01")).toBe("1 de ene");
  });
});
