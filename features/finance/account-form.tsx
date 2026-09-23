"use client";

import { type FormEvent, useState } from "react";
import { Button, ErrorList, Field, formCardClassName, inputClassName } from "@/components/form";
import { createEntityFields } from "@/domain/entity";
import type { Account, AccountType, CurrencyCode } from "@/domain/finance/types";
import { toLocalDate } from "@/lib/dates";
import { parseAmount } from "@/lib/format";
import { LOCAL_USER_ID } from "@/lib/preferences";
import { ACCOUNT_TYPE_LABELS } from "./labels";

const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[];

interface AccountFormProps {
  currency: CurrencyCode;
  onSave: (account: Account) => Promise<void>;
  onCancel?: () => void;
}

export function AccountForm({ currency, onSave, onCancel }: AccountFormProps) {
  const [type, setType] = useState<AccountType>("debit");
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const isDebt = type === "credit" || type === "loan";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const amount = parseAmount(String(formData.get("openingBalance") ?? ""), currency);

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

    setSaving(true);
    await onSave({
      ...createEntityFields(LOCAL_USER_ID),
      name,
      type,
      currency,
      // Money owed is stored as a negative balance (see docs/architecture.md).
      openingBalance: isDebt && amount > 0 ? -amount : amount,
      openingDate: toLocalDate(),
    });
    setSaving(false);
    form.reset();
    setType("debit");
  }

  return (
    <form onSubmit={handleSubmit} className={formCardClassName} noValidate>
      <h2 className="text-lg font-semibold">Nueva cuenta</h2>

      <Field label="Tipo de cuenta" htmlFor="account-type">
        <select
          id="account-type"
          value={type}
          onChange={(event) => setType(event.target.value as AccountType)}
          className={inputClassName}
        >
          {ACCOUNT_TYPES.map((accountType) => (
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
          className={inputClassName}
          autoComplete="off"
        />
      </Field>

      <Field
        label={isDebt ? "¿Cuánto debes hoy?" : "¿Cuánto dinero tiene hoy?"}
        htmlFor="account-opening-balance"
        hint={isDebt ? "Escribe el total que debes. Si no debes nada, escribe 0." : "Si está vacía, escribe 0."}
      >
        <input
          id="account-opening-balance"
          name="openingBalance"
          inputMode="numeric"
          placeholder="Ej: 1.200.000"
          className={inputClassName}
          autoComplete="off"
        />
      </Field>

      <ErrorList messages={errors} />

      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? "Guardando…" : "Guardar cuenta"}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
