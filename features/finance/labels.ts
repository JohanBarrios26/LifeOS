import type { AccountType, TransactionKind } from "@/domain/finance/types";
import type { TransactionError } from "@/domain/finance/validation";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: "Efectivo",
  debit: "Débito",
  savings: "Ahorros",
  credit: "Tarjeta de crédito",
  loan: "Préstamo",
};

export const TRANSACTION_KIND_LABELS: Record<TransactionKind, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
  adjustment: "Ajuste",
};

// Record<TransactionError, string> makes TypeScript fail if a new error code has no message.
export const TRANSACTION_ERROR_MESSAGES: Record<TransactionError, string> = {
  amount_not_positive: "El monto debe ser mayor que cero.",
  amount_not_integer: "Escribe un monto válido, por ejemplo 50.000.",
  missing_source_account: "Elige la cuenta de donde sale el dinero.",
  missing_destination_account: "Elige la cuenta a donde entra el dinero.",
  same_source_and_destination: "La cuenta de origen y la de destino deben ser distintas.",
  invalid_date: "Elige una fecha válida.",
};

export const SUGGESTED_CATEGORIES = [
  "Mercado",
  "Comida",
  "Transporte",
  "Hogar",
  "Servicios",
  "Salud",
  "Ropa",
  "Educación",
  "Entretenimiento",
  "Salario",
  "Pago de deuda",
  "Ahorro",
];
