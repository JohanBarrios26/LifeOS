"use client";

import { useState } from "react";
import { Button } from "@/components/form";
import { BackupPanel } from "@/features/backup/backup-panel";
import { DEFAULT_CURRENCY } from "@/lib/preferences";
import { AccountForm } from "./account-form";
import { FinanceDashboard } from "./finance-dashboard";
import { TransactionForm } from "./transaction-form";
import { useFinanceData } from "./use-finance-data";

type OpenForm = "none" | "transaction" | "account";

export function FinanceApp() {
  const { data, failed, saveAccount, saveTransaction, importRecords } = useFinanceData();
  const [openForm, setOpenForm] = useState<OpenForm>("none");
  const closeForm = () => setOpenForm("none");

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
          {openForm === "none" && (
            <div className="flex gap-2">
              <Button onClick={() => setOpenForm("transaction")} className="flex-1">
                + Registrar movimiento
              </Button>
              <Button variant="secondary" onClick={() => setOpenForm("account")}>
                + Cuenta
              </Button>
            </div>
          )}

          {openForm === "transaction" && (
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

          {openForm === "account" && (
            <AccountForm
              currency={DEFAULT_CURRENCY}
              onSave={async (account) => {
                await saveAccount(account);
                closeForm();
              }}
              onCancel={closeForm}
            />
          )}

          <FinanceDashboard accounts={data.accounts} transactions={data.transactions} currency={DEFAULT_CURRENCY} />
        </div>
      )}

      {/* Same position on both screens, so its message survives the switch after a first import. */}
      <BackupPanel accounts={data.accounts} transactions={data.transactions} onImport={importRecords} />
    </div>
  );
}
