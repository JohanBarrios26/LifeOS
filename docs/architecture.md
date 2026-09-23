# LIFEOS Architecture

## Purpose

This document records the initial technical decisions for LIFEOS. It is intentionally small: the product should become useful before it becomes complex.

## Core principles

1. **Store facts, calculate results.** Derived values are calculated from their source records rather than stored independently.
2. **Preserve history.** Disabling a habit or completing a goal must not erase past records.
3. **Keep domain rules independent from the UI.** A financial calculation should be testable without rendering a React component.
4. **Make persistence replaceable.** The application can start with browser storage, but components should not depend directly on `localStorage`.
5. **Use real data, not artificial scores.** Reports describe recorded actions and trends; they do not rate a person or a relationship.

## Layers

```text
app/          Routes, layouts, and page composition
features/     Feature-specific forms, views, and actions
domain/       Types, domain rules, calculations, and validation
repositories/ Interfaces and persistence implementations
```

The first implementation can be lightweight. Folders are introduced only when a feature needs them.

## Financial model: a single ledger

Every financial fact is a `Transaction` that moves money **out of** one account and/or **into** another. Credit cards and loans are accounts too; their balance is negative while money is owed.

```text
Account      cash | debit | savings | credit | loan
Transaction  income | expense | transfer | adjustment
             amount (always positive), fromAccountId?, toAccountId?
```

| Real-world event | How it is recorded | Available balance | Debt |
| --- | --- | ---: | ---: |
| Income | `income` into Debit | increases | unchanged |
| Cash/debit expense | `expense` from Debit | decreases | unchanged |
| Credit purchase | `expense` from Credit card | unchanged | increases |
| Debt payment | `transfer` from Debit to Credit card | decreases | decreases |
| Move to savings | `transfer` from Debit to Savings | moves | unchanged |

One rule computes every balance:

```text
balance = openingBalance + money into the account − money out of the account
```

- **Available balance** = sum of `cash`, `debit` and `savings` balances.
- **Total debt** = sum of `credit` and `loan` balances (shown as a positive number).

Why one ledger instead of separate `Income`, `CashExpense`, `CreditPurchase` and `DebtPayment` entities: transfers, refunds, card interest and cash advances fit without new entities, and one calculation serves every account. `availableBalance` and `totalDebt` are never stored.

## Data conventions

- **Money is an integer** in the currency's minor unit (cents for USD, pesos for COP). Floating-point math (`0.1 + 0.2 !== 0.3`) must never touch money.
- **Dates of facts are local calendar dates** (`"2026-09-23"`), so a record made at 11 p.m. stays on the day it happened.
- **Every entity** has `id` (UUID created on the device), `userId`, `createdAt`, `updatedAt` and an optional `deletedAt`. Deleting sets `deletedAt`; calculations ignore those records.
- **Stored data carries a `schemaVersion`** so older data can be migrated instead of lost.

## Persistence path

```text
Now:   FinanceRepository interface + IndexedDB (Dexie) in the browser
Later: repository implementation backed by PostgreSQL and object storage
```

Screens call `getFinanceRepository()` and never touch IndexedDB directly.

## Backups

While data lives only in the browser, a JSON backup is the only protection against losing it.

- The file contains every record, deleted ones included, plus `app: "lifeos"`, `schemaVersion` and `exportedAt`.
- Importing checks every record before writing anything (`parseBackup`), then saves all records in one database transaction: a failed import changes nothing.
- Importing adds records and replaces those with the same `id`. It never deletes existing records.
- When records change shape, increase `BACKUP_SCHEMA_VERSION` and teach `parseBackup` to upgrade older files.

Photos belong in object storage, not directly in a relational database row. The database stores their metadata and their relationship to a meaningful moment.

## Initial module order

1. Finance
2. Local persistence
3. Financial dashboard
4. Habits
5. Goals
6. Meaningful moments and photos
7. Reports and charts
8. Authentication and synchronization

## Non-goals for the first version

- Native mobile applications
- Medical tracking or advice
- Automatic import from banks
- Artificial relationship or life scores
- AI features without reliable underlying data
