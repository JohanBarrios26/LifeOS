import { describe, expect, it } from "vitest";
import { lastDayOfMonth, monthOf, shiftMonth } from "./month";

describe("monthOf", () => {
  it("takes the month of a date", () => {
    expect(monthOf("2026-09-23")).toBe("2026-09");
  });
});

describe("shiftMonth", () => {
  it("moves forward and back within a year", () => {
    expect(shiftMonth("2026-09", 1)).toBe("2026-10");
    expect(shiftMonth("2026-09", -1)).toBe("2026-08");
  });

  it("crosses year boundaries", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});

describe("lastDayOfMonth", () => {
  it("knows how many days each month has", () => {
    expect(lastDayOfMonth("2026-09")).toBe("2026-09-30");
    expect(lastDayOfMonth("2026-12")).toBe("2026-12-31");
    expect(lastDayOfMonth("2026-02")).toBe("2026-02-28");
    expect(lastDayOfMonth("2028-02")).toBe("2028-02-29");
  });
});
