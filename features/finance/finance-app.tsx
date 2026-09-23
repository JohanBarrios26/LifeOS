"use client";

import { useState } from "react";
import { Button } from "@/components/form";
import { markDeleted, restoreDeleted } from "@/domain/entity";
import type { Transaction } from "@/domain/finance/types";
import { BackupPanel } from "@/features/backup/backup-panel";
import { DEFAULT_CURRENCY } from "@/lib/preferences";
import { AccountForm } from "./account-form";
import { FinanceDashboard } from "./finance-dashboard";
import { TransactionForm } from "./transaction-form";
import { useFinanceData } from "./use-finance-data";

type OpenForm =
  | { type: "none" }
  | { type: "new-transaction" }
  | { type: "edit-transaction"; transaction: Transaction }
  | { type: "account" };

export function FinanceApp() {
  const { data, failed, saveAccount, saveTransaction, importRecords } = useFinanceData();
  const [openForm, setOpenForm] = useState<OpenForm>({ type: "none" });
  const [recentlyDeleted, setRecentlyDeleted] = useState<Transaction | null>(null);

  function showForm(form: OpenForm) {
    setOpenForm(form);
    setRecentlyDeleted(null);
  }
  const closeForm = () => setOpenForm({ type: "none" });

  function editTransaction(transaction: Transaction) {
    // Adjustments cannot be created from the form yet, so they cannot be edited either.
    if (transaction.kind === "adjustment") {
      return;
    }
    showForm({ type: "edit-transaction", transaction });
    // The form opens at the top of the page.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteTransaction(transaction: Transaction) {
    const deleted = markDeleted(transaction);
    await saveTransaction(deleted);
    closeForm();
    setRecentlyDeleted(deleted);
  }

  async function undoDelete() {
    if (recentlyDeleted) {
      await saveTransaction(restoreDeleted(recentlyDeleted));
      setRecentlyDeleted(null);
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

  const activeAccounts = data.accounts.filter((account) => !account.deletedAt);

  return (
    <div className="flex flex-col gap-6">
      {activeAccounts.length === 0 ? (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Empieza creando tu primera cuenta</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Por ejemplo: tu cuenta débito, el efectivo de tu billetera o tu tarjeta de crédito.
            </p>
          </div>
          <AccountForm currency={DEFAULT_CURRENCY} onSave={saveAccount} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {recentlyDeleted && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              <span>Movimiento eliminado.</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={undoDelete} className="rounded-lg px-2 py-1 font-semibold underline">
                  Deshacer
                </button>
                <button
                  type="button"
                  onClick={() => setRecentlyDeleted(null)}
                  aria-label="Cerrar aviso"
                  className="rounded-lg px-2 py-1 opacity-70 hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {openForm.type === "none" && (
            <div className="flex gap-2">
              <Button onClick={() => showForm({ type: "new-transaction" })} className="flex-1">
                + Registrar movimiento
              </Button>
              <Button variant="secondary" onClick={() => showForm({ type: "account" })}>
                + Cuenta
              </Button>
            </div>
          )}

          {openForm.type === "new-transaction" && (
            <TransactionForm
              accounts={activeAccounts}
              currency={DEFAULT_CURRENCY}
              onSave={async (transaction) => {
                await saveTransaction(transaction);
                closeForm();
              }}
              onCancel={closeForm}
            />
          )}

          {openForm.type === "edit-transaction" && (
            <TransactionForm
              // A new key per transaction resets the form when another one is chosen.
              key={openForm.transaction.id}
              accounts={activeAccounts}
              currency={DEFAULT_CURRENCY}
              transaction={openForm.transaction}
              onSave={async (transaction) => {
                await saveTransaction(transaction);
                closeForm();
              }}
              onCancel={closeForm}
              onDelete={() => deleteTransaction(openForm.transaction)}
            />
          )}

          {openForm.type === "account" && (
            <AccountForm
              currency={DEFAULT_CURRENCY}
              onSave={async (account) => {
                await saveAccount(account);
                closeForm();
              }}
              onCancel={closeForm}
            />
          )}

          <FinanceDashboard
            accounts={data.accounts}
            transactions={data.transactions}
            currency={DEFAULT_CURRENCY}
            onSelectTransaction={editTransaction}
          />
        </div>
      )}

      {/* Same position on both screens, so its message survives the switch after a first import. */}
      <BackupPanel accounts={data.accounts} transactions={data.transactions} onImport={importRecords} />
    </div>
  );
}
