import type { AccountType } from "./types";

/** Credit cards and loans hold money owed: their balance is negative while there is debt. */
export function isDebtAccountType(type: AccountType): boolean {
  return type === "credit" || type === "loan";
}
