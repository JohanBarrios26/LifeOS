import {
  ACCOUNT_TYPES,
  TRANSACTION_KINDS,
  type Account,
  type Transaction,
} from "./finance/types";
import type { Profile } from "./profile";

/**
 * Version of the backup file format. Increase it when the stored records change shape,
 * and teach parseBackup to upgrade files written with older versions.
 */
export const BACKUP_SCHEMA_VERSION = 1;

export interface LifeosBackup {
  app: "lifeos";
  schemaVersion: number;
  exportedAt: string;
  accounts: Account[];
  transactions: Transaction[];
  /** Added in September 2026: older backups do not have it, and are still valid. */
  profile?: Profile;
}

export interface BackupRecords {
  accounts: Account[];
  transactions: Transaction[];
  profile?: Profile;
}

export type BackupError = "invalid_json" | "not_a_lifeos_backup" | "unsupported_version" | "invalid_records";

export type ParsedBackup = { ok: true; backup: LifeosBackup } | { ok: false; error: BackupError };

/** Every record is included, deleted ones too, so a restore brings back the full history. */
export function createBackup(
  { accounts, transactions, profile }: BackupRecords,
  now: Date = new Date(),
): LifeosBackup {
  return {
    app: "lifeos",
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    accounts,
    transactions,
    ...(profile && { profile }),
  };
}

/**
 * Reads a backup file. The file comes from outside the app (it could be the wrong file,
 * damaged or edited by hand), so every record is checked before anything is imported.
 */
export function parseBackup(text: string): ParsedBackup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "invalid_json" };
  }

  if (!isObject(data) || data.app !== "lifeos") {
    return { ok: false, error: "not_a_lifeos_backup" };
  }
  if (typeof data.schemaVersion !== "number" || data.schemaVersion > BACKUP_SCHEMA_VERSION) {
    return { ok: false, error: "unsupported_version" };
  }
  if (
    typeof data.exportedAt !== "string" ||
    !Array.isArray(data.accounts) ||
    !Array.isArray(data.transactions) ||
    !data.accounts.every(isAccount) ||
    !data.transactions.every(isTransaction) ||
    (data.profile !== undefined && !isProfile(data.profile))
  ) {
    return { ok: false, error: "invalid_records" };
  }

  return {
    ok: true,
    backup: {
      app: "lifeos",
      schemaVersion: data.schemaVersion,
      exportedAt: data.exportedAt,
      accounts: data.accounts,
      transactions: data.transactions,
      ...(data.profile !== undefined && { profile: data.profile }),
    },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function hasEntityFields(value: Record<string, unknown>): boolean {
  return (
    typeof value.id === "string" &&
    typeof value.userId === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    isOptionalString(value.deletedAt)
  );
}

function isAccount(value: unknown): value is Account {
  return (
    isObject(value) &&
    hasEntityFields(value) &&
    typeof value.name === "string" &&
    ACCOUNT_TYPES.includes(value.type as Account["type"]) &&
    typeof value.currency === "string" &&
    Number.isInteger(value.openingBalance) &&
    typeof value.openingDate === "string" &&
    isOptionalString(value.archivedAt)
  );
}

function isProfile(value: unknown): value is Profile {
  return isObject(value) && hasEntityFields(value) && typeof value.displayName === "string";
}

function isTransaction(value: unknown): value is Transaction {
  return (
    isObject(value) &&
    hasEntityFields(value) &&
    TRANSACTION_KINDS.includes(value.kind as Transaction["kind"]) &&
    typeof value.date === "string" &&
    Number.isInteger(value.amount) &&
    isOptionalString(value.fromAccountId) &&
    isOptionalString(value.toAccountId) &&
    isOptionalString(value.category) &&
    isOptionalString(value.description)
  );
}
