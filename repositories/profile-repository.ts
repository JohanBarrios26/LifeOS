import type { Profile } from "@/domain/profile";

/** Where the person's profile is stored. Like FinanceRepository, screens never touch the database directly. */
export interface ProfileRepository {
  /** Undefined until the person goes through the welcome step. */
  getProfile(): Promise<Profile | undefined>;
  saveProfile(profile: Profile): Promise<void>;
}
