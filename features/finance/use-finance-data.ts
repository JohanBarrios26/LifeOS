import { useCallback, useEffect, useState } from "react";
import type { Account, Transaction } from "@/domain/finance/types";
import { getFinanceRepository } from "@/repositories";

interface FinanceData {
  accounts: Account[];
  transactions: Transaction[];
}

async function loadFinanceData(): Promise<FinanceData> {
  const repository = getFinanceRepository();
  const [accounts, transactions] = await Promise.all([
    repository.listAccounts(),
    repository.listTransactions(),
  ]);
  return { accounts, transactions };
}

/** Loads the financial records saved in this browser and saves new ones. */
export function useFinanceData() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Ignore the result if the screen closed before loading finished.
    let active = true;
    loadFinanceData().then(
      (loaded) => active && setData(loaded),
      // IndexedDB can be blocked, e.g. in some private browsing modes.
      () => active && setFailed(true),
    );
    return () => {
      active = false;
    };
  }, []);

  const saveAccount = useCallback(async (account: Account) => {
    await getFinanceRepository().saveAccount(account);
    setData(await loadFinanceData());
  }, []);

  const saveTransaction = useCallback(async (transaction: Transaction) => {
    await getFinanceRepository().saveTransaction(transaction);
    setData(await loadFinanceData());
  }, []);

  return { data, failed, saveAccount, saveTransaction };
}
