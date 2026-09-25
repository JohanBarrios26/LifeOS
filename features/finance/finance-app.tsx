"use client";

import { useState } from "react";
import { Button } from "@/components/form";
import { markDeleted, markUpdated, restoreDeleted } from "@/domain/entity";
import { type AccountRemoval, getAccountRemoval } from "@/domain/finance/accounts";
import { getAccountBalance } from "@/domain/finance/balance";
import type { Account, Transaction } from "@/domain/finance/types";
import type { TransactionInput } from "@/domain/finance/validation";
import { greeting, mainCurrencyOf, type Profile } from "@/domain/profile";
import { BackupPanel } from "@/features/backup/backup-panel";
import { NameForm } from "@/features/profile/name-form";
import { formatMoney } from "@/lib/format";
import { transactionCurrency } from "@/domain/finance/currencies";
import { AccountForm } from "./account-form";
import { FinanceDashboard } from "./finance-dashboard";
import { QuickEntryBox } from "./quick-entry-box";
import { TransactionForm } from "./transaction-form";
import { useFinanceData } from "./use-finance-data";

type OpenForm =
  | { type: "none" }
  | { type: "new-transaction"; draft?: TransactionInput }
  | { type: "edit-transaction"; transaction: Transaction }
  | { type: "new-account" }
  | { type: "edit-account"; account: Account }
  | { type: "profile" };

/** A change the person can take back from the notice at the top. */
interface Undo {
  message: string;
  revert: () => Promise<void>;
}

export function FinanceApp() {
  const { data, failed, saveAccount, saveTransaction, saveProfile, importRecords } = useFinanceData();
  const [openForm, setOpenForm] = useState<OpenForm>({ type: "none" });
  const [undo, setUndo] = useState<Undo | null>(null);

  function showForm(form: OpenForm) {
    setOpenForm(form);
    setUndo(null);
    if (form.type.startsWith("edit")) {
      // The form opens at the top of the page.
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  const closeForm = () => setOpenForm({ type: "none" });

  function editTransaction(transaction: Transaction) {
    // Adjustments cannot be created from the form yet, so they cannot be edited either.
    if (transaction.kind !== "adjustment") {
      showForm({ type: "edit-transaction", transaction });
    }
  }

  async function saveQuickEntry(transaction: Transaction) {
    await saveTransaction(transaction);
    const title = transaction.description ?? transaction.category ?? "Movimiento";
    setUndo({
      message: `Registrado: ${title}, ${formatMoney(
        transaction.amount,
        transactionCurrency(transaction, data?.accounts ?? [], mainCurrencyOf(data?.profile)),
      )}.`,
      revert: () => saveTransaction(markDeleted(transaction)),
    });
  }

  async function deleteTransaction(transaction: Transaction) {
    const deleted = markDeleted(transaction);
    await saveTransaction(deleted);
    closeForm();
    setUndo({ message: "Movimiento eliminado.", revert: () => saveTransaction(restoreDeleted(deleted)) });
  }

  async function removeAccount(account: Account, removal: AccountRemoval) {
    if (removal === "delete") {
      const deleted = markDeleted(account);
      await saveAccount(deleted);
      closeForm();
      setUndo({ message: "Cuenta eliminada.", revert: () => saveAccount(restoreDeleted(deleted)) });
    } else if (removal === "archive") {
      const archived = markUpdated(account, { archivedAt: new Date().toISOString() });
      await saveAccount(archived);
      closeForm();
      setUndo({
        message: "Cuenta archivada.",
        revert: () => saveAccount(markUpdated(archived, { archivedAt: undefined })),
      });
    }
  }

  async function reactivateAccount(account: Account) {
    await saveAccount(markUpdated(account, { archivedAt: undefined }));
    closeForm();
  }

  async function revertLastChange() {
    if (undo) {
      await undo.revert();
      setUndo(null);
    }
  }

  if (failed) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
        No pudimos abrir tus datos en este navegador. Si estás en una ventana privada, abre LIFEOS en una
        ventana normal.
      </p>
    );
  }

  if (!data) {
    return <p className="text-zinc-500 dark:text-zinc-400">Cargando tus datos…</p>;
  }

  // Archived accounts still exist (their history is valid); deleted ones do not.
  const existingAccounts = data.accounts.filter((account) => !account.deletedAt);
  const mainCurrency = mainCurrencyOf(data.profile);
  const balances = new Map(
    existingAccounts.map((account) => [account.id, getAccountBalance(account, data.transactions)]),
  );

  const saveAndClose = <T,>(save: (record: T) => Promise<void>) => async (record: T) => {
    await save(record);
    closeForm();
  };

  return (
    <div className="flex flex-col gap-6">
      {undo && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          <span>{undo.message}</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={revertLastChange} className="rounded-lg px-2 py-1 font-semibold underline">
              Deshacer
            </button>
            <button
              type="button"
              onClick={() => setUndo(null)}
              aria-label="Cerrar aviso"
              className="rounded-lg px-2 py-1 opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {data.profile ? (
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{greeting(data.profile)}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Así están tus finanzas hoy.</p>
          </div>
          {openForm.type !== "profile" && (
            <button
              type="button"
              onClick={() => showForm({ type: "profile" })}
              className="shrink-0 rounded-lg px-2 py-1 text-sm text-zinc-500 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Editar perfil
            </button>
          )}
        </header>
      ) : (
        <Welcome onSave={saveProfile} />
      )}

      {openForm.type === "profile" && data.profile && (
        <NameForm profile={data.profile} onSave={saveAndClose(saveProfile)} onCancel={closeForm} />
      )}

      {/* The rest waits until the person has gone through the welcome step. */}
      {!data.profile ? null : existingAccounts.length === 0 ? (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Empieza creando tu primera cuenta</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Por ejemplo: tu cuenta débito, el efectivo de tu billetera o tu tarjeta de crédito.
            </p>
          </div>
          <AccountForm currency={mainCurrency} onSave={saveAccount} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {openForm.type === "none" && (
            <>
              <QuickEntryBox
                accounts={existingAccounts.filter((account) => !account.archivedAt)}
                transactions={data.transactions}
                currency={mainCurrency}
                onSave={saveQuickEntry}
                onAdjust={(draft) => showForm({ type: "new-transaction", draft })}
              />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => showForm({ type: "new-transaction" })} className="flex-1">
                  Formulario completo
                </Button>
                <Button variant="secondary" onClick={() => showForm({ type: "new-account" })}>
                  + Cuenta
                </Button>
              </div>
            </>
          )}

          {openForm.type === "new-transaction" && (
            <TransactionForm
              accounts={existingAccounts}
              balances={balances}
              currency={mainCurrency}
              draft={openForm.draft}
              onSave={saveAndClose(saveTransaction)}
              onCancel={closeForm}
            />
          )}

          {openForm.type === "edit-transaction" && (
            <TransactionForm
              // A new key per record resets the form when another one is chosen.
              key={openForm.transaction.id}
              accounts={existingAccounts}
              balances={balances}
              currency={mainCurrency}
              transaction={openForm.transaction}
              onSave={saveAndClose(saveTransaction)}
              onCancel={closeForm}
              onDelete={() => deleteTransaction(openForm.transaction)}
            />
          )}

          {openForm.type === "new-account" && (
            <AccountForm currency={mainCurrency} onSave={saveAndClose(saveAccount)} onCancel={closeForm} />
          )}

          {openForm.type === "edit-account" && (
            <AccountForm
              key={openForm.account.id}
              currency={mainCurrency}
              account={openForm.account}
              removal={getAccountRemoval(openForm.account, data.transactions)}
              onSave={saveAndClose(saveAccount)}
              onCancel={closeForm}
              onRemove={() =>
                removeAccount(openForm.account, getAccountRemoval(openForm.account, data.transactions))
              }
              onReactivate={() => reactivateAccount(openForm.account)}
            />
          )}

          <FinanceDashboard
            accounts={data.accounts}
            transactions={data.transactions}
            currency={mainCurrency}
            onSelectTransaction={editTransaction}
            onSelectAccount={(account) => showForm({ type: "edit-account", account })}
          />
        </div>
      )}

      {/* Same position on every screen, so its message survives the switch after a first import. */}
      <BackupPanel
        accounts={data.accounts}
        transactions={data.transactions}
        profile={data.profile}
        onImport={importRecords}
      />
    </div>
  );
}

function Welcome({ onSave }: { onSave: (profile: Profile) => Promise<void> }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Te damos la bienvenida a LIFEOS</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Registra los hechos importantes de tu vida y entiende tu progreso con datos reales.
        </p>
      </div>
      <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
        🔒 Tus datos se guardan solo en este dispositivo. Nadie más puede verlos, ni siquiera quien creó LIFEOS.
      </p>
      <NameForm onSave={onSave} />
    </div>
  );
}
