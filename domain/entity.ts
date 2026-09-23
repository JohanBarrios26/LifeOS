import type { BaseEntity } from "./finance/types";

/**
 * Fields every new record needs. The id is created on the device, so records created
 * offline can be synchronized later without clashing with ids from other devices.
 */
export function createEntityFields(userId: string, now: Date = new Date()): BaseEntity {
  const timestamp = now.toISOString();
  return { id: crypto.randomUUID(), userId, createdAt: timestamp, updatedAt: timestamp };
}
