import type { FinanceRepository } from "./finance-repository";
import { createIndexedDbFinanceRepository } from "./indexeddb/indexeddb-finance-repository";
import { createIndexedDbProfileRepository } from "./indexeddb/indexeddb-profile-repository";
import { LifeosDatabase } from "./indexeddb/lifeos-database";
import type { ProfileRepository } from "./profile-repository";

// Browser only: IndexedDB does not exist on the server. Created on first use and then reused.
let database: LifeosDatabase | undefined;
const getDatabase = () => (database ??= new LifeosDatabase());

export function getFinanceRepository(): FinanceRepository {
  return createIndexedDbFinanceRepository(getDatabase());
}

export function getProfileRepository(): ProfileRepository {
  return createIndexedDbProfileRepository(getDatabase());
}
