import { useCallback, useEffect, useState } from "react";
import type { BackupRecords } from "@/domain/backup";
import type { Account, Transaction } from "@/domain/finance/types";
import type { Profile } from "@/domain/profile";
import { getFinanceRepository, getProfileRepository } from "@/repositories";

interface FinanceData {
  accounts: Account[];
  transactions: Transaction[];
  /** Undefined until the person goes through the welcome step. */
  profile: Profile | undefined;
}

async function loadFinanceData(): Promise<FinanceData> {
  const repository = getFinanceRepository();
  const [accounts, transactions, profile] = await Promise.all([
    repository.listAccounts(),
    repository.listTransactions(),
    getProfileRepository().getProfile(),
  ]);
  return { accounts, transactions, profile };
}

/** Loads the records saved in this browser (finances and profile) and saves new ones. */
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

  const saveProfile = useCallback(async (profile: Profile) => {
    await getProfileRepository().saveProfile(profile);
    setData(await loadFinanceData());
  }, []);

  const importRecords = useCallback(async ({ accounts, transactions, profile }: BackupRecords) => {
    await getFinanceRepository().saveAll({ accounts, transactions });
    if (profile) {
      await getProfileRepository().saveProfile(profile);
    }
    setData(await loadFinanceData());
  }, []);

  return { data, failed, saveAccount, saveTransaction, saveProfile, importRecords };
}
