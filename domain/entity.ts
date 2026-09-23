import type { BaseEntity } from "./finance/types";

/**
 * Fields every new record needs. The id is created on the device, so records created
 * offline can be synchronized later without clashing with ids from other devices.
 */
export function createEntityFields(userId: string, now: Date = new Date()): BaseEntity {
  const timestamp = now.toISOString();
  return { id: crypto.randomUUID(), userId, createdAt: timestamp, updatedAt: timestamp };
}

/** Applies changes to a record. Its identity (id, userId, createdAt) never changes. */
export function markUpdated<T extends BaseEntity>(record: T, changes: Partial<T>, now: Date = new Date()): T {
  return {
    ...record,
    ...changes,
    id: record.id,
    userId: record.userId,
    createdAt: record.createdAt,
    updatedAt: now.toISOString(),
  };
}

/** Soft delete: the record stays stored, and calculations ignore it because deletedAt is set. */
export function markDeleted<T extends BaseEntity>(record: T, now: Date = new Date()): T {
  const timestamp = now.toISOString();
  return { ...record, deletedAt: timestamp, updatedAt: timestamp };
}

/** Undoes a soft delete. */
export function restoreDeleted<T extends BaseEntity>(record: T, now: Date = new Date()): T {
  return { ...record, deletedAt: undefined, updatedAt: now.toISOString() };
}
