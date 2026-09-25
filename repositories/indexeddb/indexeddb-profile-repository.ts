import { PROFILE_ID } from "@/domain/profile";
import type { ProfileRepository } from "../profile-repository";
import type { LifeosDatabase } from "./lifeos-database";

export function createIndexedDbProfileRepository(db: LifeosDatabase): ProfileRepository {
  return {
    getProfile: () => db.profile.get(PROFILE_ID),
    saveProfile: async (profile) => {
      await db.profile.put(profile);
    },
  };
}
