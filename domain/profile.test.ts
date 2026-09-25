import { describe, expect, it } from "vitest";
import { cleanDisplayName, greeting, MAX_DISPLAY_NAME_LENGTH, type Profile } from "./profile";

const profile = (displayName: string): Profile => ({
  id: "profile",
  userId: "user-1",
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
  displayName,
});

describe("cleanDisplayName", () => {
  it("removes extra spaces", () => {
    expect(cleanDisplayName("  Johan   Barrios ")).toBe("Johan Barrios");
  });

  it("limits very long names", () => {
    expect(cleanDisplayName("a".repeat(100))).toHaveLength(MAX_DISPLAY_NAME_LENGTH);
  });
});

describe("greeting", () => {
  it("greets the person by the name they chose", () => {
    expect(greeting(profile("Camila"))).toBe("Hola, Camila 👋");
  });

  it("greets without a name when the person preferred not to give one", () => {
    expect(greeting(profile(""))).toBe("Hola 👋");
    expect(greeting(undefined)).toBe("Hola 👋");
  });
});
