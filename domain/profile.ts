import { DEFAULT_CURRENCY } from "./finance/currencies";
import type { BaseEntity, CurrencyCode } from "./finance/types";

/** The person's own preferences. There is exactly one per user, always with this id. */
export const PROFILE_ID = "profile";
export const MAX_DISPLAY_NAME_LENGTH = 40;

export interface Profile extends BaseEntity {
  /** How the person wants to be called. Empty when they preferred not to say. */
  displayName: string;
  /** Default for new accounts and quick entry. Profiles created before it existed use COP. */
  mainCurrency?: CurrencyCode;
}

export function mainCurrencyOf(profile: Profile | undefined): CurrencyCode {
  return profile?.mainCurrency ?? DEFAULT_CURRENCY;
}

/** "  johan   barrios " → "johan barrios", at most MAX_DISPLAY_NAME_LENGTH characters. */
export function cleanDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, MAX_DISPLAY_NAME_LENGTH).trim();
}

/** "Hola, Johan 👋", or "Hola 👋" when there is no name. */
export function greeting(profile: Profile | undefined): string {
  return profile?.displayName ? `Hola, ${profile.displayName} 👋` : "Hola 👋";
}
