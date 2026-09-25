"use client";

import { type FormEvent, useRef, useState } from "react";
import { Button, ErrorList, Field, formCardClassName, inputClassName } from "@/components/form";
import { createEntityFields, markUpdated } from "@/domain/entity";
import { isDebtAccountType } from "@/domain/finance/accounts";
import { currencyDigits, transactionCurrency } from "@/domain/finance/currencies";
import type { Account, CurrencyCode, Money, Transaction } from "@/domain/finance/types";
import { type TransactionInput, validateTransaction } from "@/domain/finance/validation";
import { toLocalDate } from "@/lib/dates";
import { formatAmountInput, formatMoney, parseAmount } from "@/lib/format";
import { LOCAL_USER_ID } from "@/lib/preferences";
import { SUGGESTED_CATEGORIES, TRANSACTION_ERROR_MESSAGES } from "./labels";

type FormKind = "expense" | "income" | "transfer";

/** Default category of a transfer into a credit card or loan. */
const DEBT_PAYMENT_CATEGORY = "Pago de deuda";

const KIND_OPTIONS: { kind: FormKind; label: string; help: string }[] = [
  {
    kind: "expense",
    label: "Gasto",
    help: "Compras y pagos. Si pagas con tarjeta de crédito, elige la tarjeta: aumentará tu deuda.",
  },
  { kind: "income", label: "Ingreso", help: "Dinero que recibes: salario, ventas, regalos." },
  {
    kind: "transfer",
    label: "Transferencia",
    help: "Mueve dinero entre tus cuentas: ahorrar o abonar a una tarjeta o préstamo.",
  },
];

interface TransactionFormProps {
  accounts: Account[];
  /** Current balance of each account, to show what is available and what is owed. */
  balances: Map<string, Money>;
  /** The person's main currency, used until an account is chosen. */
  currency: CurrencyCode;
  /** The transaction being edited. Without it, the form records a new one. */
  transaction?: Transaction;
  /** Values to start a new transaction with, e.g. what quick entry understood. */
  draft?: TransactionInput;
  onSave: (transaction: Transaction) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}

export function TransactionForm({
  accounts,
  balances,
  currency,
  transaction,
  draft,
  onSave,
  onCancel,
  onDelete,
}: TransactionFormProps) {
  const prefill = transaction ?? draft;
  const [kind, setKind] = useState<FormKind>(
    prefill && prefill.kind !== "adjustment" ? prefill.kind : "expense",
  );
  const [sourceId, setSourceId] = useState(prefill?.fromAccountId ?? "");
  const [destinationId, setDestinationId] = useState(prefill?.toAccountId ?? "");
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const amountInput = useRef<HTMLInputElement>(null);
  const toAmountInput = useRef<HTMLInputElement>(null);

  // Archived accounts only appear when the edited transaction already uses them.
  const selectableAccounts = accounts.filter(
    (account) =>
      !account.archivedAt || account.id === transaction?.fromAccountId || account.id === transaction?.toAccountId,
  );
  const moneyAccounts = selectableAccounts.filter((account) => !isDebtAccountType(account.type));
  const needsSource = kind !== "income";
  const needsDestination = kind !== "expense";
  const destinationOptions = kind === "income" ? moneyAccounts : selectableAccounts;

  // Debts are negative balances; show them as the positive amount owed.
  const owedOn = (account: Account) => Math.max(0, -(balances.get(account.id) ?? 0));
  const describe = (account: Account) =>
    (isDebtAccountType(account.type)
      ? `${account.name} · debes ${formatMoney(owedOn(account), account.currency)}`
      : `${account.name} · ${formatMoney(balances.get(account.id) ?? 0, account.currency)}`) +
    (account.archivedAt ? " (archivada)" : "");

  const source = needsSource ? selectableAccounts.find((account) => account.id === sourceId) : undefined;
  const destination = destinationOptions.find((account) => account.id === destinationId);
  const payingDebt = kind === "transfer" && destination !== undefined && isDebtAccountType(destination.type);
  // The amount is in the currency of the account it moves: dollars have cents, pesos do not.
  const amountCurrency = (kind === "income" ? destination?.currency : source?.currency) ?? currency;
  // Between currencies, both amounts are facts: what left and what arrived.
  const crossCurrency =
    kind === "transfer" && source !== undefined && destination !== undefined && source.currency !== destination.currency;

  function payEverything() {
    // Across currencies, what is owed is known in the debt's currency: it fills "how much arrived".
    const input = crossCurrency ? toAmountInput.current : amountInput.current;
    if (destination && input) {
      input.value = formatAmountInput(owedOn(destination), destination.currency);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const text = (field: string) => String(formData.get(field) ?? "").trim() || undefined;

    const input: TransactionInput = {
      kind,
      date: text("date") ?? "",
      // An unreadable amount becomes NaN, which the "whole number" rule rejects.
      amount: parseAmount(text("amount") ?? "", amountCurrency) ?? Number.NaN,
      fromAccountId: needsSource ? text("fromAccountId") : undefined,
      toAccountId: needsDestination ? text("toAccountId") : undefined,
      toAmount:
        crossCurrency && destination
          ? (parseAmount(text("toAmount") ?? "", destination.currency) ?? Number.NaN)
          : undefined,
      category: text("category") ?? (payingDebt ? DEBT_PAYMENT_CATEGORY : undefined),
      description: text("description"),
    };

    const problems = validateTransaction(input, accounts);
    setErrors(problems.map((problem) => TRANSACTION_ERROR_MESSAGES[problem]));
    if (problems.length > 0) {
      return;
    }

    setSaving(true);
    await onSave(
      transaction ? markUpdated(transaction, input) : { ...createEntityFields(LOCAL_USER_ID), ...input },
    );
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className={formCardClassName} noValidate>
      <h2 className="text-lg font-semibold">{transaction ? "Editar movimiento" : "Registrar movimiento"}</h2>

      <div
        role="radiogroup"
        aria-label="Tipo de movimiento"
        className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800"
      >
        {KIND_OPTIONS.map((option) => (
          <button
            key={option.kind}
            type="button"
            role="radio"
            aria-checked={kind === option.kind}
            onClick={() => setKind(option.kind)}
            className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
              kind === option.kind
                ? "bg-white shadow-sm dark:bg-zinc-950"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="-mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {KIND_OPTIONS.find((option) => option.kind === kind)?.help}
      </p>

      <Field label={`Monto · ${amountCurrency}`} htmlFor="transaction-amount">
        <input
          ref={amountInput}
          id="transaction-amount"
          name="amount"
          inputMode={currencyDigits(amountCurrency) > 0 ? "decimal" : "numeric"}
          placeholder={currencyDigits(amountCurrency) > 0 ? "Ej: 25,50" : "Ej: 50.000"}
          defaultValue={
            prefill && Number.isInteger(prefill.amount)
              ? formatAmountInput(prefill.amount, transactionCurrency(prefill, accounts, currency))
              : undefined
          }
          className={inputClassName}
          autoComplete="off"
        />
      </Field>

      {needsSource && (
        <Field label="¿De dónde sale el dinero?" htmlFor="transaction-from">
          <select
            id="transaction-from"
            name="fromAccountId"
            // Only keep the choice if it is in this list; otherwise nothing is selected.
            value={source ? sourceId : ""}
            onChange={(event) => setSourceId(event.target.value)}
            className={inputClassName}
          >
            <AccountOptions accounts={selectableAccounts} describe={describe} />
          </select>
        </Field>
      )}

      {needsDestination && (
        <Field label="¿A dónde entra el dinero?" htmlFor="transaction-to">
          <select
            id="transaction-to"
            name="toAccountId"
            // Only keep the choice if it is in this list; otherwise nothing is selected.
            value={destination ? destinationId : ""}
            onChange={(event) => setDestinationId(event.target.value)}
            className={inputClassName}
          >
            <AccountOptions accounts={destinationOptions} describe={describe} />
          </select>
          {payingDebt && owedOn(destination) > 0 && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Debes {formatMoney(owedOn(destination), destination.currency)}
              </span>
              <button
                type="button"
                onClick={payEverything}
                className="rounded-lg px-2 py-1 font-medium underline hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Pagar todo
              </button>
            </div>
          )}
        </Field>
      )}

      {crossCurrency && destination && (
        <Field
          label={`¿Cuánto llegó a ${destination.name}? · ${destination.currency}`}
          htmlFor="transaction-to-amount"
          hint="Escribe lo que realmente llegó, con comisiones incluidas. LIFEOS calcula la tasa con los dos montos."
        >
          <input
            ref={toAmountInput}
            id="transaction-to-amount"
            name="toAmount"
            inputMode={currencyDigits(destination.currency) > 0 ? "decimal" : "numeric"}
            placeholder={currencyDigits(destination.currency) > 0 ? "Ej: 25,50" : "Ej: 395.000"}
            defaultValue={
              prefill?.toAmount !== undefined ? formatAmountInput(prefill.toAmount, destination.currency) : undefined
            }
            className={inputClassName}
            autoComplete="off"
          />
        </Field>
      )}

      <Field label="Fecha" htmlFor="transaction-date">
        <input
          id="transaction-date"
          name="date"
          type="date"
          defaultValue={prefill?.date ?? toLocalDate()}
          className={inputClassName}
        />
      </Field>

      <Field
        label="Categoría (opcional)"
        htmlFor="transaction-category"
        hint={payingDebt ? `Si la dejas vacía, se guarda como “${DEBT_PAYMENT_CATEGORY}”.` : undefined}
      >
        <input
          id="transaction-category"
          name="category"
          list="transaction-categories"
          placeholder={payingDebt ? DEBT_PAYMENT_CATEGORY : "Ej: Mercado"}
          defaultValue={prefill?.category}
          className={inputClassName}
          autoComplete="off"
        />
        <datalist id="transaction-categories">
          {SUGGESTED_CATEGORIES.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </Field>

      <Field label="Descripción (opcional)" htmlFor="transaction-description">
        <input
          id="transaction-description"
          name="description"
          placeholder="Ej: Almuerzo con compañeros"
          defaultValue={prefill?.description}
          className={inputClassName}
          autoComplete="off"
        />
      </Field>

      <ErrorList messages={errors} />

      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? "Guardando…" : transaction ? "Guardar cambios" : "Guardar movimiento"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="self-center rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
        >
          Eliminar movimiento
        </button>
      )}
    </form>
  );
}

function AccountOptions({ accounts, describe }: { accounts: Account[]; describe: (account: Account) => string }) {
  return (
    <>
      <option value="" disabled>
        Elige una cuenta
      </option>
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {describe(account)}
        </option>
      ))}
    </>
  );
}
