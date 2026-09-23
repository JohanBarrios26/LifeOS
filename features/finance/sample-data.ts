import type { Account, CurrencyCode, Transaction } from "@/domain/finance/types";

// Invented data to see the dashboard working before real persistence exists.
// Never put real financial data here: this repository is public.

export const sampleCurrency: CurrencyCode = "COP";

const USER_ID = "sample-user";
const TIMESTAMP = "2026-09-01T00:00:00.000Z";

function account(fields: Pick<Account, "id" | "name" | "type" | "openingBalance">): Account {
  return {
    userId: USER_ID,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    currency: sampleCurrency,
    openingDate: "2026-09-01",
    ...fields,
  };
}

function transaction(
  fields: Pick<Transaction, "id" | "kind" | "date" | "amount" | "description"> &
    Partial<Pick<Transaction, "fromAccountId" | "toAccountId" | "category">>,
): Transaction {
  return {
    userId: USER_ID,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...fields,
  };
}

export const sampleAccounts: Account[] = [
  account({ id: "wallet", name: "Billetera", type: "cash", openingBalance: 80_000 }),
  account({ id: "debit", name: "Cuenta débito", type: "debit", openingBalance: 1_200_000 }),
  account({ id: "savings", name: "Fondo de emergencia", type: "savings", openingBalance: 3_000_000 }),
  account({ id: "nu-card", name: "Tarjeta Nu", type: "credit", openingBalance: -850_000 }),
];

export const sampleTransactions: Transaction[] = [
  transaction({
    id: "tx-1",
    kind: "income",
    date: "2026-09-01",
    amount: 2_500_000,
    toAccountId: "debit",
    category: "Salario",
    description: "Salario de septiembre",
  }),
  transaction({
    id: "tx-2",
    kind: "expense",
    date: "2026-09-03",
    amount: 180_000,
    fromAccountId: "debit",
    category: "Mercado",
    description: "Mercado de la semana",
  }),
  transaction({
    id: "tx-3",
    kind: "expense",
    date: "2026-09-05",
    amount: 25_000,
    fromAccountId: "wallet",
    category: "Comida",
    description: "Almuerzo",
  }),
  transaction({
    id: "tx-4",
    kind: "expense",
    date: "2026-09-08",
    amount: 120_000,
    fromAccountId: "nu-card",
    category: "Ropa",
    description: "Compra con tarjeta",
  }),
  transaction({
    id: "tx-5",
    kind: "transfer",
    date: "2026-09-15",
    amount: 300_000,
    fromAccountId: "debit",
    toAccountId: "nu-card",
    category: "Pago de deuda",
    description: "Abono a la tarjeta Nu",
  }),
  transaction({
    id: "tx-6",
    kind: "transfer",
    date: "2026-09-16",
    amount: 400_000,
    fromAccountId: "debit",
    toAccountId: "savings",
    category: "Ahorro",
    description: "Ahorro del mes",
  }),
];
