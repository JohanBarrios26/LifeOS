import type { FinanceRepository } from "./finance-repository";
import { createIndexedDbFinanceRepository } from "./indexeddb/indexeddb-finance-repository";
import { LifeosDatabase } from "./indexeddb/lifeos-database";

let financeRepository: FinanceRepository | undefined;

/** The repository the app uses. Browser only: IndexedDB does not exist on the server. */
export function getFinanceRepository(): FinanceRepository {
  financeRepository ??= createIndexedDbFinanceRepository(new LifeosDatabase());
  return financeRepository;
}
