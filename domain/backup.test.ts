import { describe, expect, it } from "vitest";
import { BACKUP_SCHEMA_VERSION, createBackup, parseBackup } from "./backup";
import { makeAccount, makeTransaction } from "./finance/test-factories";
import type { Profile } from "./profile";

const debit = makeAccount({ id: "debit", openingBalance: 500_000 });
const card = makeAccount({ id: "nu-card", type: "credit", openingBalance: -300_000 });
const lunch = makeTransaction({ kind: "expense", fromAccountId: "debit", amount: 25_000, category: "Comida" });
const deleted = makeTransaction({ amount: 10_000, fromAccountId: "debit", deletedAt: "2026-09-11T00:00:00.000Z" });
const profile: Profile = {
  id: "profile",
  userId: "user-1",
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
  displayName: "Camila",
};

// A fixed export time: using "now" would make two calls differ by a millisecond.
const EXPORTED_AT = new Date("2026-09-23T20:00:00.000Z");

function backupText(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    ...createBackup({ accounts: [debit, card], transactions: [lunch, deleted], profile }, EXPORTED_AT),
    ...overrides,
  });
}

describe("createBackup", () => {
  it("includes every record, deleted ones too, the profile, the format version and export time", () => {
    const backup = createBackup({ accounts: [debit, card], transactions: [lunch, deleted], profile }, EXPORTED_AT);

    expect(backup).toEqual({
      app: "lifeos",
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: "2026-09-23T20:00:00.000Z",
      accounts: [debit, card],
      transactions: [lunch, deleted],
      profile,
    });
  });
});

describe("parseBackup", () => {
  it("reads back exactly what was exported", () => {
    const result = parseBackup(backupText());

    expect(result).toEqual({ ok: true, backup: JSON.parse(backupText()) });
  });

  it("still reads backups made before the profile existed", () => {
    const result = parseBackup(backupText({ profile: undefined }));

    expect(result.ok && result.backup.profile).toBeUndefined();
    expect(result.ok && result.backup.accounts).toEqual([debit, card]);
  });

  it("still reads version 1 backups, made before several currencies existed", () => {
    const result = parseBackup(backupText({ schemaVersion: 1 }));

    expect(result.ok).toBe(true);
  });

  it("keeps amounts that crossed currencies and the main currency", () => {
    const exchange = makeTransaction({ kind: "transfer", fromAccountId: "debit", toAccountId: "nu-card", amount: 10_000, toAmount: 395_000 });
    const result = parseBackup(
      backupText({ transactions: [exchange], profile: { ...profile, mainCurrency: "USD" } }),
    );

    expect(result.ok && result.backup.transactions[0].toAmount).toBe(395_000);
    expect(result.ok && result.backup.profile?.mainCurrency).toBe("USD");
    expect(parseBackup(backupText({ transactions: [{ ...exchange, toAmount: 1.5 }] }))).toEqual({
      ok: false,
      error: "invalid_records",
    });
  });

  it("rejects a damaged profile", () => {
    expect(parseBackup(backupText({ profile: { ...profile, displayName: 42 } }))).toEqual({
      ok: false,
      error: "invalid_records",
    });
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
