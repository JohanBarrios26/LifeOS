import { describe, expect, it } from "vitest";
import { BACKUP_SCHEMA_VERSION, createBackup, parseBackup } from "./backup";
import { makeAccount, makeTransaction } from "./finance/test-factories";

const debit = makeAccount({ id: "debit", openingBalance: 500_000 });
const card = makeAccount({ id: "nu-card", type: "credit", openingBalance: -300_000 });
const lunch = makeTransaction({ kind: "expense", fromAccountId: "debit", amount: 25_000, category: "Comida" });
const deleted = makeTransaction({ amount: 10_000, fromAccountId: "debit", deletedAt: "2026-09-11T00:00:00.000Z" });

// A fixed export time: using "now" would make two calls differ by a millisecond.
const EXPORTED_AT = new Date("2026-09-23T20:00:00.000Z");

function backupText(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({ ...createBackup([debit, card], [lunch, deleted], EXPORTED_AT), ...overrides });
}

describe("createBackup", () => {
  it("includes every record, deleted ones too, with the format version and export time", () => {
    const backup = createBackup([debit, card], [lunch, deleted], new Date("2026-09-23T20:00:00.000Z"));

    expect(backup).toEqual({
      app: "lifeos",
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: "2026-09-23T20:00:00.000Z",
      accounts: [debit, card],
      transactions: [lunch, deleted],
    });
  });
});

describe("parseBackup", () => {
  it("reads back exactly what was exported", () => {
    const result = parseBackup(backupText());

    expect(result).toEqual({ ok: true, backup: JSON.parse(backupText()) });
  });

  it("keeps archived accounts, and still reads backups made before archiving existed", () => {
    const closedCard = { ...card, archivedAt: "2026-09-22T00:00:00.000Z" };

    const result = parseBackup(backupText({ accounts: [debit, closedCard] }));

    expect(result.ok && result.backup.accounts).toEqual([debit, closedCard]);
  });

  it("rejects text that is not JSON", () => {
    expect(parseBackup("esto no es un archivo")).toEqual({ ok: false, error: "invalid_json" });
  });

  it("rejects JSON files from other apps", () => {
    expect(parseBackup(JSON.stringify({ name: "otra app" }))).toEqual({
      ok: false,
      error: "not_a_lifeos_backup",
    });
    expect(parseBackup("[1, 2, 3]")).toEqual({ ok: false, error: "not_a_lifeos_backup" });
  });

  it("rejects backups made by a newer version of LIFEOS", () => {
    expect(parseBackup(backupText({ schemaVersion: BACKUP_SCHEMA_VERSION + 1 }))).toEqual({
      ok: false,
      error: "unsupported_version",
    });
  });

  it("rejects backups with damaged records", () => {
    const decimalAmount = { ...lunch, amount: 12.5 };
    const unknownKind = { ...lunch, kind: "gift" };
    const missingName = { ...debit, name: undefined };

    for (const overrides of [
      { transactions: [decimalAmount] },
      { transactions: [unknownKind] },
      { accounts: [missingName] },
      { accounts: "not a list" },
    ]) {
      expect(parseBackup(backupText(overrides))).toEqual({ ok: false, error: "invalid_records" });
    }
  });
});
