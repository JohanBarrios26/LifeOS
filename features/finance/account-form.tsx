"use client";

import { type FormEvent, useState } from "react";
import { Button, ErrorList, Field, formCardClassName, inputClassName } from "@/components/form";
import { createEntityFields, markUpdated } from "@/domain/entity";
import { type AccountRemoval, isDebtAccountType } from "@/domain/finance/accounts";
import { CURRENCIES, currencyDigits } from "@/domain/finance/currencies";
import { ACCOUNT_TYPES, type Account, type AccountType, type CurrencyCode } from "@/domain/finance/types";
import { toLocalDate } from "@/lib/dates";
import { formatAmountInput, formatShortDate, parseAmount } from "@/lib/format";
import { LOCAL_USER_ID } from "@/lib/preferences";
import { ACCOUNT_TYPE_LABELS } from "./labels";

interface AccountFormProps {
  /** Suggested currency for a new account: the person's main currency. */
  currency: CurrencyCode;
  /** The account being edited. Without it, the form creates a new one. */
  account?: Account;
  /** What can be done to take the edited account out of use (see getAccountRemoval). */
  removal?: AccountRemoval;
  onSave: (account: Account) => Promise<void>;
  onCancel?: () => void;
  onRemove?: () => void;
  onReactivate?: () => void;
}

export function AccountForm({
  currency,
  account,
  removal,
  onSave,
  onCancel,
  onRemove,
  onReactivate,
}: AccountFormProps) {
  const [type, setType] = useState<AccountType>(account?.type ?? "debit");
  const [accountCurrency, setAccountCurrency] = useState<CurrencyCode>(account?.currency ?? currency);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const isDebt = isDebtAccountType(type);
  const hasCents = currencyDigits(accountCurrency) > 0;

  // An existing account keeps its group: money cannot turn into debt, because the
  // sign of its whole history would change meaning.
  const typeOptions = account
    ? ACCOUNT_TYPES.filter((option) => isDebtAccountType(option) === isDebtAccountType(account.type))
    : ACCOUNT_TYPES;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const amount = parseAmount(String(formData.get("openingBalance") ?? ""), accountCurrency);

    const messages: string[] = [];
    if (!name) {
      messages.push("Escribe un nombre para la cuenta.");
    }
    if (amount === null) {
      messages.push("Escribe un saldo válido, por ejemplo 1.200.000.");
    }
    setErrors(messages);
    if (amount === null || messages.length > 0) {
      return;
    }

    // Money owed is stored as a negative balance (see docs/architecture.md).
    const openingBalance = isDebt && amount > 0 ? -amount : amount;

    setSaving(true);
    if (account) {
      await onSave(markUpdated(account, { name, type, openingBalance }));
    } else {
      await onSave({
        ...createEntityFields(LOCAL_USER_ID),
        name,
        type,
        currency: accountCurrency,
        openingBalance,
        openingDate: toLocalDate(),
      });
      form.reset();
      setType("debit");
      setAccountCurrency(currency);
    }
    setSaving(false);
  }

  const balanceLabel = account
    ? isDebt
      ? "¿Cuánto debías al agregarla?"
      : "¿Cuánto tenía al agregarla?"
    : isDebt
      ? "¿Cuánto debes hoy?"
      : "¿Cuánto dinero tiene hoy?";
  const balanceHint = account
    ? `Es el saldo del ${formatShortDate(account.openingDate)}, cuando la agregaste. Tus movimientos se suman aparte.`
    : isDebt
      ? "Escribe el total que debes. Si no debes nada, escribe 0."
      : "Si está vacía, escribe 0.";

  return (
    <form onSubmit={handleSubmit} className={formCardClassName} noValidate>
      <h2 className="text-lg font-semibold">{account ? "Editar cuenta" : "Nueva cuenta"}</h2>

      {account?.archivedAt && (
        <p className="rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          Esta cuenta está archivada: no aparece al registrar movimientos.
        </p>
      )}

      <Field label="Tipo de cuenta" htmlFor="account-type">
        <select
          id="account-type"
          value={type}
          onChange={(event) => setType(event.target.value as AccountType)}
          className={inputClassName}
        >
          {typeOptions.map((accountType) => (
            <option key={accountType} value={accountType}>
              {ACCOUNT_TYPE_LABELS[accountType]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Nombre" htmlFor="account-name">
        <input
          id="account-name"
          name="name"
          placeholder={isDebt ? "Ej: Tarjeta Nu" : "Ej: Cuenta débito"}
          defaultValue={account?.name}
          className={inputClassName}
          autoComplete="off"
        />
      </Field>

      <Field
        label="Moneda"
        htmlFor="account-currency"
        hint={
          account
            ? "La moneda no se puede cambiar: cambiaría el valor de todo su historial."
            : "Cada cuenta lleva sus movimientos en su propia moneda."
        }
      >
        <select
          id="account-currency"
          value={accountCurrency}
          onChange={(event) => setAccountCurrency(event.target.value)}
          disabled={account !== undefined}
          className={`${inputClassName} disabled:opacity-60`}
        >
          {CURRENCIES.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name} ({option.code})
            </option>
          ))}
        </select>
      </Field>

      <Field label={balanceLabel} htmlFor="account-opening-balance" hint={balanceHint}>
        <input
          id="account-opening-balance"
          name="openingBalance"
          inputMode={hasCents ? "decimal" : "numeric"}
          placeholder={hasCents ? "Ej: 1.500,00" : "Ej: 1.200.000"}
          defaultValue={
            account ? formatAmountInput(Math.abs(account.openingBalance), account.currency) : undefined
          }
          className={inputClassName}
          autoComplete="off"
        />
      </Field>

      <ErrorList messages={errors} />

      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? "Guardando…" : account ? "Guardar cambios" : "Guardar cuenta"}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>

      {account && <RemovalSection account={account} removal={removal} onRemove={onRemove} onReactivate={onReactivate} />}
    </form>
  );
}

function RemovalSection({
  account,
  removal,
  onRemove,
  onReactivate,
}: {
  account: Account;
  removal?: AccountRemoval;
  onRemove?: () => void;
  onReactivate?: () => void;
}) {
  const note = "text-center text-sm text-zinc-500 dark:text-zinc-400";
  const dangerButton =
    "self-center rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950";

  if (account.archivedAt) {
    return (
      <Button variant="secondary" onClick={onReactivate}>
        Reactivar cuenta
      </Button>
    );
  }
  if (removal === "delete") {
    return (
      <div className="flex flex-col gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <button type="button" onClick={onRemove} className={dangerButton}>
          Eliminar cuenta
        </button>
        <p className={note}>No tiene movimientos, así que no se pierde ningún historial.</p>
      </div>
    );
  }
  if (removal === "archive") {
    return (
      <div className="flex flex-col gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <button type="button" onClick={onRemove} className={dangerButton}>
          Archivar cuenta
        </button>
        <p className={note}>Su saldo está en $0. Se conserva su historial y deja de aparecer en tus listas.</p>
      </div>
    );
  }
  return (
    <p className={`border-t border-zinc-200 pt-3 dark:border-zinc-800 ${note}`}>
      {isDebtAccountType(account.type)
        ? "Para archivar esta cuenta, primero paga toda su deuda."
        : "Para archivar esta cuenta, primero deja su saldo en $0 (transfiere su dinero a otra cuenta)."}
    </p>
  );
}
