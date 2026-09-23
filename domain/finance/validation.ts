import type { LocalDate, Transaction } from "./types";

/** The fields a person fills in when recording a transaction. */
export type TransactionInput = Pick<
  Transaction,
  "kind" | "date" | "amount" | "fromAccountId" | "toAccountId" | "category" | "description"
>;

/**
 * Problems that prevent saving a transaction. They are codes, not messages:
 * the screen translates them into the user's language.
 */
export type TransactionError =
  | "amount_not_positive"
  | "amount_not_integer"
  | "missing_source_account"
  | "missing_destination_account"
  | "same_source_and_destination"
  | "invalid_date";

/** Returns every problem found. An empty list means the transaction can be saved. */
export function validateTransaction(input: TransactionInput): TransactionError[] {
  const errors: TransactionError[] = [];

  // Regla 1: el monto debe ser mayor que cero.
  // Un movimiento de $0 no cambia nada, y la dirección del dinero (entra o sale)
  // la indican las cuentas, nunca un monto negativo.
  if (input.amount <= 0) {
    errors.push("amount_not_positive");
  }

  // Regla 2: el monto debe ser un número entero.
  // El dinero se guarda en la unidad mínima de la moneda (pesos en COP, centavos en USD),
  // así evitamos los errores de los decimales (0.1 + 0.2 = 0.30000000000000004).
  if (!Number.isInteger(input.amount)) {
    errors.push("amount_not_integer");
  }

  // Regla 3: un ingreso necesita la cuenta a donde ENTRA el dinero.
  // Sin ella, el ingreso no sumaría a ninguna cuenta y se perdería en los cálculos.
  if (input.kind === "income" && !input.toAccountId) {
    errors.push("missing_destination_account");
  }

  // Regla 4: un gasto necesita la cuenta de donde SALE el dinero.
  // Puede ser efectivo, débito o una tarjeta de crédito (en ese caso aumenta la deuda).
  if (input.kind === "expense" && !input.fromAccountId) {
    errors.push("missing_source_account");
  }

  // Regla 5: una transferencia mueve dinero entre dos cuentas propias
  // (por ejemplo, pagar la tarjeta desde el débito). Necesita ambas cuentas,
  // y deben ser distintas: transferir a la misma cuenta no tiene sentido.
  if (input.kind === "transfer") {
    if (!input.fromAccountId) {
      errors.push("missing_source_account");
    }
    if (!input.toAccountId) {
      errors.push("missing_destination_account");
    }
    if (input.fromAccountId && input.fromAccountId === input.toAccountId) {
      errors.push("same_source_and_destination");
    }
  }

  // Regla 6: la fecha debe tener el formato "YYYY-MM-DD" y existir en el calendario.
  // Rechaza fechas como "15/09/2026" (otro formato) o "2026-02-30" (febrero no tiene 30 días).
  if (!isValidLocalDate(input.date)) {
    errors.push("invalid_date");
  }

  return errors;
}

function isValidLocalDate(date: LocalDate): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }
  // Invalid days roll over ("2026-02-30" becomes March 2), so the round trip exposes them.
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date);
}
