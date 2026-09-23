"use client";

import { type FormEvent, useState } from "react";
import { Button, ErrorList, Field, formCardClassName, inputClassName } from "@/components/form";
import { createEntityFields } from "@/domain/entity";
import type { Account, CurrencyCode, Transaction } from "@/domain/finance/types";
import { type TransactionInput, validateTransaction } from "@/domain/finance/validation";
import { toLocalDate } from "@/lib/dates";
import { parseAmount } from "@/lib/format";
import { LOCAL_USER_ID } from "@/lib/preferences";
import { ACCOUNT_TYPE_LABELS, SUGGESTED_CATEGORIES, TRANSACTION_ERROR_MESSAGES } from "./labels";

type FormKind = "expense" | "income" | "transfer";

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
    help: "Dinero que mueves entre tus cuentas, como pagar la tarjeta o ahorrar.",
  },
];

interface TransactionFormProps {
  accounts: Account[];
  currency: CurrencyCode;
  onSave: (transaction: Transaction) => Promise<void>;
  onCancel: () => void;
}

export function TransactionForm({ accounts, currency, onSave, onCancel }: TransactionFormProps) {
  const [kind, setKind] = useState<FormKind>("expense");
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const moneyAccounts = accounts.filter((account) => account.type !== "credit" && account.type !== "loan");
  const needsSource = kind !== "income";
  const needsDestination = kind !== "expense";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const text = (field: string) => String(formData.get(field) ?? "").trim() || undefined;

    const input: TransactionInput = {
      kind,
      date: text("date") ?? "",
      // An unreadable amount becomes NaN, which the "whole number" rule rejects.
      amount: parseAmount(text("amount") ?? "", currency) ?? Number.NaN,
      fromAccountId: needsSource ? text("fromAccountId") : undefined,
      toAccountId: needsDestination ? text("toAccountId") : undefined,
      category: text("category"),
      description: text("description"),
    };

    const problems = validateTransaction(input);
    setErrors(problems.map((problem) => TRANSACTION_ERROR_MESSAGES[problem]));
    if (problems.length > 0) {
      return;
    }

    setSaving(true);
    await onSave({ ...createEntityFields(LOCAL_USER_ID), ...input });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className={formCardClassName} noValidate>
      <h2 className="text-lg font-semibold">Registrar movimiento</h2>

      <div role="radiogroup" aria-label="Tipo de movimiento" className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
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
          id="transaction-amount"
          name="amount"
          inputMode="numeric"
          placeholder="Ej: 50.000"
          className={inputClassName}
          autoComplete="off"
        />
      </Field>

      {needsSource && (
        <Field label="¿De dónde sale el dinero?" htmlFor="transaction-from">
          <AccountSelect id="transaction-from" name="fromAccountId" accounts={accounts} />
        </Field>
      )}

      {needsDestination && (
        <Field label="¿A dónde entra el dinero?" htmlFor="transaction-to">
          <AccountSelect
            id="transaction-to"
            name="toAccountId"
            accounts={kind === "income" ? moneyAccounts : accounts}
          />
        </Field>
      )}

      <Field label="Fecha" htmlFor="transaction-date">
        <input
          id="transaction-date"
          name="date"
          type="date"
          defaultValue={toLocalDate()}
          className={inputClassName}
        />
      </Field>

      <Field label="Categoría (opcional)" htmlFor="transaction-category">
        <input
          id="transaction-category"
          name="category"
          list="transaction-categories"
          placeholder="Ej: Mercado"
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
          className={inputClassName}
          autoComplete="off"
        />
      </Field>

      <ErrorList messages={errors} />

      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? "Guardando…" : "Guardar movimiento"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function AccountSelect({ id, name, accounts }: { id: string; name: string; accounts: Account[] }) {
  return (
    <select id={id} name={name} defaultValue="" className={inputClassName}>
      <option value="" disabled>
        Elige una cuenta
      </option>
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {account.name} · {ACCOUNT_TYPE_LABELS[account.type]}
        </option>
      ))}
    </select>
  );
}
