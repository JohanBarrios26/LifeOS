import { describe, expect, it } from "vitest";
import { shiftDate, toLocalDate } from "./dates";

describe("shiftDate", () => {
  it("moves back and forward across months and years", () => {
    expect(shiftDate("2026-09-23", -1)).toBe("2026-09-22");
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("toLocalDate", () => {
  it("uses the local calendar day, even late at night", () => {
    // September 23, 11:30 p.m. local time: in UTC it may already be the 24th.
    expect(toLocalDate(new Date(2026, 8, 23, 23, 30))).toBe("2026-09-23");
  });

  it("pads single-digit months and days", () => {
    expect(toLocalDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
