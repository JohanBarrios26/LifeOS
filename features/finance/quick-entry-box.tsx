"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button, inputClassName } from "@/components/form";
import { createEntityFields } from "@/domain/entity";
import { isDebtAccountType } from "@/domain/finance/accounts";
import { transactionCurrency } from "@/domain/finance/currencies";
import type { Account, CurrencyCode, Transaction } from "@/domain/finance/types";
import { type TransactionInput, validateTransaction } from "@/domain/finance/validation";
import { shiftDate, toLocalDate } from "@/lib/dates";
import { formatMoney, formatShortDate } from "@/lib/format";
import { LOCAL_USER_ID } from "@/lib/preferences";
import { TRANSACTION_ERROR_MESSAGES, TRANSACTION_KIND_LABELS } from "./labels";
import { type QuickEntryDraft, parseQuickEntry } from "./quick-entry";

interface QuickEntryBoxProps {
  /** Open accounts: archived ones are not offered. */
  accounts: Account[];
  transactions: Transaction[];
  currency: CurrencyCode;
  onSave: (transaction: Transaction) => Promise<void>;
  /** Opens the full form with what was understood, to review or complete it. */
  onAdjust: (draft: TransactionInput) => void;
}

export function QuickEntryBox({ accounts, transactions, currency, onSave, onAdjust }: QuickEntryBoxProps) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<QuickEntryDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // The home-screen shortcut "Registrar" opens LIFEOS with ?registrar: put the cursor here.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("registrar")) {
      input.current?.focus();
    }
  }, []);

  function understand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (text.trim()) {
      setDraft(parseQuickEntry(text, { accounts, transactions, currency, today: toLocalDate() }));
    }
  }

  async function save(input: TransactionInput) {
    setSaving(true);
    await onSave({ ...createEntityFields(LOCAL_USER_ID), ...input });
    setSaving(false);
    setText("");
    setDraft(null);
  }

  return (
    <section
      aria-label="Registro rápido"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <form onSubmit={understand} className="flex gap-2">
        <label htmlFor="quick-entry" className="sr-only">
          Registro rápido
        </label>
        <input
          id="quick-entry"
          ref={input}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setDraft(null);
          }}
          placeholder="Ej: almuerzo 25 mil con la nu"
          enterKeyHint="done"
          autoComplete="off"
          className={inputClassName}
        />
        <Button type="submit" disabled={!text.trim()}>
          Listo
        </Button>
      </form>

      {draft ? (
        <DraftPreview
          draft={draft}
          accounts={accounts}
          currency={currency}
          saving={saving}
          onSave={() => save(draft.input)}
          onAdjust={() => onAdjust(draft.input)}
          onDiscard={() => setDraft(null)}
        />
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Escribe como hablas: “mercado 180 mil débito”, “salario 2,5 millones”, “pago nu 300 mil”, “taxi 12k ayer”.
          {new Set(accounts.map((account) => account.currency)).size > 1 &&
            " En otras monedas: “almuerzo 45 reais”, “uber US$12”."}
        </p>
      )}
    </section>
  );
}

function DraftPreview({
  draft,
  accounts,
  currency,
  saving,
  onSave,
  onAdjust,
  onDiscard,
}: {
  draft: QuickEntryDraft;
  accounts: Account[];
  currency: CurrencyCode;
  saving: boolean;
  onSave: () => void;
  onAdjust: () => void;
  onDiscard: () => void;
}) {
  const { input, guessed } = draft;
  const problems = validateTransaction(input, accounts);
  const accountName = (id?: string) => accounts.find((account) => account.id === id)?.name;
  const destination = accounts.find((account) => account.id === input.toAccountId);
  const isDebtPayment = input.kind === "transfer" && destination !== undefined && isDebtAccountType(destination.type);
  const today = toLocalDate();
  const dateLabel =
    input.date === today ? "Hoy" : input.date === shiftDate(today, -1) ? "Ayer" : formatShortDate(input.date);

  const rows: [string, string | undefined, boolean?][] = [
    ["Tipo", isDebtPayment ? "Pago de deuda" : TRANSACTION_KIND_LABELS[input.kind]],
    [
      "Monto",
      Number.isInteger(input.amount)
        ? formatMoney(input.amount, transactionCurrency(input, accounts, currency))
        : undefined,
    ],
    ["Sale de", input.kind === "income" ? "" : accountName(input.fromAccountId), guessed.source],
    ["Entra a", input.kind === "expense" ? "" : accountName(input.toAccountId), guessed.destination],
    ["Categoría", input.category ?? "Sin categoría"],
    ["Fecha", dateLabel],
    ["Descripción", input.description ?? "—"],
  ];

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-950">
        {rows
          .filter(([, value]) => value !== "")
          .map(([label, value, wasGuessed]) => (
            <div key={label} className="contents">
              <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
              <dd className={value === undefined ? "text-red-700 dark:text-red-400" : "font-medium"}>
                {value ?? "Falta"}
                {wasGuessed && value && (
                  <span className="font-normal text-zinc-500 dark:text-zinc-400"> · sugerida</span>
                )}
              </dd>
            </div>
          ))}
      </dl>

      {problems.length > 0 ? (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No entendí todo: {problems.map((problem) => TRANSACTION_ERROR_MESSAGES[problem].toLowerCase()).join(" ")}
          </p>
          <div className="flex gap-2">
            <Button onClick={onAdjust} className="flex-1">
              Completar
            </Button>
            <Button variant="secondary" onClick={onDiscard}>
              Descartar
            </Button>
          </div>
        </>
      ) : (
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={saving} className="flex-1">
            {saving ? "Guardando…" : "Guardar"}
          </Button>
          <Button variant="secondary" onClick={onAdjust}>
            Ajustar
          </Button>
          <Button variant="secondary" onClick={onDiscard}>
            ✕<span className="sr-only">Descartar</span>
          </Button>
        </div>
      )}
    </div>
  );
}
