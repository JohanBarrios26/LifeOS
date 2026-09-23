import type { Account, Transaction } from "./types";

// Builders for tests: pass only the fields a test cares about.

const TIMESTAMP = "2026-09-01T00:00:00.000Z";

export function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "debit",
    userId: "user-1",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    name: "Debit account",
    type: "debit",
    currency: "COP",
    openingBalance: 0,
    openingDate: "2026-09-01",
    ...overrides,
  };
}

let nextId = 1;
export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `tx-${nextId++}`,
    userId: "user-1",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    kind: "expense",
    date: "2026-09-10",
    amount: 0,
    ...overrides,
  };
}
