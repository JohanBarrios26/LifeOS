"use client";

import { type FormEvent, useRef, useState } from "react";
import { Button, ErrorList, Field, formCardClassName, inputClassName } from "@/components/form";
import { createEntityFields, markUpdated } from "@/domain/entity";
import { isDebtAccountType } from "@/domain/finance/accounts";
import type { Account, CurrencyCode, Money, Transaction } from "@/domain/finance/types";
import { type TransactionInput, validateTransaction } from "@/domain/finance/validation";
import { toLocalDate } from "@/lib/dates";
import { formatAmountInput, formatMoney, parseAmount } from "@/lib/format";
import { LOCAL_USER_ID } from "@/lib/preferences";
import { ACCOUNT_TYPE_LABELS, SUGGESTED_CATEGORIES, TRANSACTION_ERROR_MESSAGES } from "./labels";

/**
 * What the person is doing. A debt payment is not a new kind of record: it is stored as a
 * transfer from available money into a credit card or loan (see docs/architecture.md).
 */
type FormKind = "expense" | "income" | "debt_payment" | "transfer";

const DEBT_PAYMENT_CATEGORY = "Pago de deuda";

const KIND_OPTIONS: { kind: FormKind; label: string; help: string }[] = [
  {
    kind: "expense",
    label: "Gasto",
    help: "Compras y pagos. Si pagas con tarjeta de crédito, elige la tarjeta: aumentará tu deuda.",
  },
  { kind: "income", label: "Ingreso", help: "Dinero que recibes: salario, ventas, regalos." },
  {
    kind: "debt_payment",
    label: "Pago de deuda",
    help: "Abonas a una tarjeta o préstamo con tu dinero disponible: bajan tu deuda y tu disponible.",
  },
  {
    kind: "transfer",
    label: "Transferencia",
    help: "Dinero que mueves entre tus cuentas, por ejemplo para ahorrar.",
  },
];

interface TransactionFormProps {
  accounts: Account[];
  /** Current balance of each account, to show what is available and what is owed. */
  balances: Map<string, Money>;
  currency: CurrencyCode;
  /** The transaction being edited. Without it, the form records a new one. */
  transaction?: Transaction;
  onSave: (transaction: Transaction) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}

export function TransactionForm({
  accounts,
  balances,
  currency,
  transaction,
  onSave,
  onCancel,
  onDelete,
}: TransactionFormProps) {
  const [kind, setKind] = useState<FormKind>(() => initialKind(transaction, accounts));
  const [debtId, setDebtId] = useState(
    transaction && initialKind(transaction, accounts) === "debt_payment" ? (transaction.toAccountId ?? "") : "",
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const amountInput = useRef<HTMLInputElement>(null);

  const moneyAccounts = accounts.filter((account) => !isDebtAccountType(account.type));
  const debtAccounts = accounts.filter((account) => isDebtAccountType(account.type));
  const isDebtPayment = kind === "debt_payment";
  const needsSource = kind !== "income";
  const needsDestination = kind !== "expense";

  // Debts are negative balances; show them as the positive amount owed.
  const owedOn = (accountId: string) => Math.max(0, -(balances.get(accountId) ?? 0));
  const selectedDebt = debtAccounts.find((account) => account.id === debtId);

  function payEverything() {
    if (selectedDebt && amountInput.current) {
      amountInput.current.value = formatAmountInput(owedOn(selectedDebt.id), currency);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const text = (field: string) => String(formData.get(field) ?? "").trim() || undefined;

    const input: TransactionInput = {
      kind: isDebtPayment ? "transfer" : kind,
      date: text("date") ?? "",
      // An unreadable amount becomes NaN, which the "whole number" rule rejects.
      amount: parseAmount(text("amount") ?? "", currency) ?? Number.NaN,
      fromAccountId: needsSource ? text("fromAccountId") : undefined,
      toAccountId: needsDestination ? text("toAccountId") : undefined,
      category: text("category") ?? (isDebtPayment ? DEBT_PAYMENT_CATEGORY : undefined),
      description: text("description"),
    };

    const problems = validateTransaction(input);
    setErrors(
      problems.map((problem) =>
        isDebtPayment && problem === "missing_destination_account"
          ? "Elige la tarjeta o el préstamo que vas a abonar."
          : TRANSACTION_ERROR_MESSAGES[problem],
      ),
    );
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
        className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 sm:grid-cols-4 dark:bg-zinc-800"
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

      <Field label="Monto" htmlFor="transaction-amount">
        <input
          ref={amountInput}
          id="transaction-amount"
          name="amount"
          inputMode="numeric"
          placeholder="Ej: 50.000"
          defaultValue={transaction ? formatAmountInput(transaction.amount, currency) : undefined}
          className={inputClassName}
          autoComplete="off"
        />
      </Field>

      {needsSource && (
        <Field
          label={isDebtPayment ? "¿De dónde sale el pago?" : "¿De dónde sale el dinero?"}
          htmlFor="transaction-from"
        >
          <AccountSelect
            // Remount when the list changes, so no account is selected silently.
            key={isDebtPayment ? "money" : "all"}
            id="transaction-from"
            name="fromAccountId"
            accounts={isDebtPayment ? moneyAccounts : accounts}
            describe={(account) =>
              isDebtPayment
                ? `${account.name} · ${formatMoney(balances.get(account.id) ?? 0, currency)}`
                : `${account.name} · ${ACCOUNT_TYPE_LABELS[account.type]}`
            }
            defaultValue={transaction?.fromAccountId}
          />
        </Field>
      )}

      {needsDestination && isDebtPayment && (
        <Field
          label="¿A qué deuda abonas?"
          htmlFor="transaction-debt"
          hint={debtAccounts.length === 0 ? "Aún no tienes tarjetas ni préstamos. Créalos con “+ Cuenta”." : undefined}
        >
          <select
            id="transaction-debt"
            name="toAccountId"
            value={debtId}
            onChange={(event) => setDebtId(event.target.value)}
            className={inputClassName}
          >
            <option value="" disabled>
              Elige la tarjeta o el préstamo
            </option>
            {debtAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · debes {formatMoney(owedOn(account.id), currency)}
              </option>
            ))}
          </select>
          {selectedDebt && owedOn(selectedDebt.id) > 0 && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Debes {formatMoney(owedOn(selectedDebt.id), currency)}
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

      {needsDestination && !isDebtPayment && (
        <Field label="¿A dónde entra el dinero?" htmlFor="transaction-to">
          <AccountSelect
            key={kind === "income" ? "money" : "all"}
            id="transaction-to"
            name="toAccountId"
            accounts={kind === "income" ? moneyAccounts : accounts}
            describe={(account) => `${account.name} · ${ACCOUNT_TYPE_LABELS[account.type]}`}
            defaultValue={transaction?.toAccountId}
          />
        </Field>
      )}

      <Field label="Fecha" htmlFor="transaction-date">
        <input
          id="transaction-date"
          name="date"
          type="date"
          defaultValue={transaction?.date ?? toLocalDate()}
          className={inputClassName}
        />
      </Field>

      <Field
        label="Categoría (opcional)"
        htmlFor="transaction-category"
        hint={isDebtPayment ? "Si la dejas vacía, se guarda como “Pago de deuda”." : undefined}
      >
        <input
          id="transaction-category"
          name="category"
          list="transaction-categories"
          placeholder={isDebtPayment ? DEBT_PAYMENT_CATEGORY : "Ej: Mercado"}
          defaultValue={transaction?.category}
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
          placeholder={isDebtPayment ? "Ej: Abono de septiembre" : "Ej: Almuerzo con compañeros"}
          defaultValue={transaction?.description}
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

/** A transfer from available money into a debt is shown in the "Pago de deuda" tab. */
function initialKind(transaction: Transaction | undefined, accounts: Account[]): FormKind {
  if (!transaction || transaction.kind === "adjustment") {
    return "expense";
  }
  if (transaction.kind === "transfer") {
    const from = accounts.find((account) => account.id === transaction.fromAccountId);
    const to = accounts.find((account) => account.id === transaction.toAccountId);
    if (from && to && !isDebtAccountType(from.type) && isDebtAccountType(to.type)) {
      return "debt_payment";
    }
  }
  return transaction.kind;
}

function AccountSelect({
  id,
  name,
  accounts,
  describe,
  defaultValue,
}: {
  id: string;
  name: string;
  accounts: Account[];
  describe: (account: Account) => string;
  defaultValue?: string;
}) {
  // Only preselect an account that is in this list; otherwise the browser would pick another one silently.
  const initial = accounts.some((account) => account.id === defaultValue) ? defaultValue : "";

  return (
    <select id={id} name={name} defaultValue={initial} className={inputClassName}>
      <option value="" disabled>
        Elige una cuenta
      </option>
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {describe(account)}
        </option>
      ))}
    </select>
  );
}
