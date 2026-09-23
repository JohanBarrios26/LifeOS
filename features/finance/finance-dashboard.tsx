import { getAccountBalance, getAvailableBalance, getTotalDebt } from "@/domain/finance/balance";
import type { Account, CurrencyCode, Money, Transaction } from "@/domain/finance/types";
import { formatMoney, formatShortDate } from "@/lib/format";
import { ACCOUNT_TYPE_LABELS, TRANSACTION_KIND_LABELS } from "./labels";

const RECENT_TRANSACTIONS_LIMIT = 5;

interface FinanceDashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  currency: CurrencyCode;
}

export function FinanceDashboard({ accounts, transactions, currency }: FinanceDashboardProps) {
  const activeAccounts = accounts.filter((account) => !account.deletedAt);
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));
  const recentTransactions = transactions
    .filter((transaction) => !transaction.deletedAt)
    // Newest first; on the same day, the one recorded last goes first.
    .toSorted((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, RECENT_TRANSACTIONS_LIMIT);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-2 gap-3" aria-label="Resumen">
        <SummaryCard
          label="Disponible"
          amount={getAvailableBalance(accounts, transactions)}
          currency={currency}
          tone="positive"
        />
        <SummaryCard
          label="Deuda total"
          amount={getTotalDebt(accounts, transactions)}
          currency={currency}
          tone="negative"
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Cuentas</h2>
        <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {activeAccounts.map((account) => {
            const balance = getAccountBalance(account, transactions);
            return (
              <li key={account.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{account.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {ACCOUNT_TYPE_LABELS[account.type]}
                  </p>
                </div>
                <p
                  className={`shrink-0 font-semibold tabular-nums ${
                    balance < 0 ? "text-red-600 dark:text-red-400" : ""
                  }`}
                >
                  {formatMoney(balance, account.currency)}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Movimientos recientes
        </h2>
        {recentTransactions.length === 0 && (
          <p className="rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Aún no hay movimientos. Registra tu primer gasto o ingreso.
          </p>
        )}
        <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white empty:hidden dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {recentTransactions.map((transaction) => (
            <li key={transaction.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {transaction.description ?? transaction.category ?? TRANSACTION_KIND_LABELS[transaction.kind]}
                </p>
                <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                  {formatShortDate(transaction.date)} · {describeAccounts(transaction, accountNames)}
                </p>
              </div>
              <TransactionAmount transaction={transaction} currency={currency} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  amount,
  currency,
  tone,
}: {
  label: string;
  amount: Money;
  currency: CurrencyCode;
  tone: "positive" | "negative";
}) {
  const toneClasses =
    tone === "positive"
      ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
      : "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100";

  return (
    <div className={`rounded-2xl p-4 ${toneClasses}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(amount, currency)}</p>
    </div>
  );
}

function TransactionAmount({ transaction, currency }: { transaction: Transaction; currency: CurrencyCode }) {
  if (transaction.kind === "income") {
    return (
      <p className="shrink-0 font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
        +{formatMoney(transaction.amount, currency)}
      </p>
    );
  }
  if (transaction.kind === "expense") {
    return <p className="shrink-0 font-semibold tabular-nums">{formatMoney(-transaction.amount, currency)}</p>;
  }
  // Transfers only move money between the user's own accounts.
  return (
    <p className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">
      {formatMoney(transaction.amount, currency)}
    </p>
  );
}

function describeAccounts(transaction: Transaction, accountNames: Map<string, string>): string {
  const from = transaction.fromAccountId ? accountNames.get(transaction.fromAccountId) : undefined;
  const to = transaction.toAccountId ? accountNames.get(transaction.toAccountId) : undefined;

  if (from && to) {
    return `${from} → ${to}`;
  }
  return from ?? to ?? "";
}
