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

Paying a debt is a regular `transfer` into the credit card or loan. The form keeps three tabs (expense, income, transfer); when a transfer's destination is a debt, it shows how much is owed, offers "Pagar todo" and defaults the category to "Pago de deuda". Payments per debt are derived from transfers into each debt account.

### Closing accounts

`getAccountRemoval` decides how an account can leave the lists, so money never disappears from the totals:

| Account | Action | Field |
| --- | --- | --- |
| No movements (probably created by mistake) | Delete | `deletedAt` |
| History and a zero balance (e.g. a cancelled card) | Archive: history stays valid | `archivedAt` |
| Still holds money or debt | Not allowed until it reaches zero | — |

Archived accounts are hidden when recording new transactions but still appear when editing a transaction that uses them. An existing account can change type only within its group (money or debt), because the sign of its history depends on it.

### Interest, fees and installments

LIFEOS does **not** calculate interest from a rate. Banks use daily balances, different rates per purchase type and monthly rate changes, so a calculated figure would drift away from the real statement.

- Interest, card fees and insurance are recorded as the bank charges them: an `expense` from the card, category "Intereses" or "Cuota de manejo", using the figure on the statement.
- A purchase in installments is recorded once, for its full amount, on the day it was made: the whole amount is owed from that moment.
- Future: "match the statement" — the person types the balance on the statement and LIFEOS records the difference as interest or an `adjustment`.

Why one ledger instead of separate `Income`, `CashExpense`, `CreditPurchase` and `DebtPayment` entities: transfers, refunds, card interest and cash advances fit without new entities, and one calculation serves every account. `availableBalance` and `totalDebt` are never stored.

## Quick entry

`parseQuickEntry` turns a sentence ("almuerzo 25 mil con la nu") into a `TransactionInput` draft. It never saves: the person sees what was understood and confirms, adjusts it in the full form, or completes what is missing. The draft still goes through `validateTransaction`.

- Amounts: "25.000", "$25.000", "25 mil", "25k", "1,5 millones", "30 lucas", "2 palos". With several numbers, the one written as money wins.
- Accounts: by a word from their name ("nu") or by type ("efectivo", "débito") when only one account has that type. If none is mentioned, the usual account is suggested and marked as a guess.
- Kind: income words ("salario", "prima"), a payment word plus a debt account ("pago nu"), or a savings word plus a savings account; otherwise an expense.

## Installable app (PWA)

`app/manifest.ts` describes the app for phones (name, icons, colors and the "Registrar" and "Reporte" shortcuts). Icons are generated from one SVG with `npm run icons`. Installing requires HTTPS (localhost counts as secure). Offline caching with a service worker is not implemented yet.

## Monthly report

`getMonthlySummary` recalculates a month from the stored transactions; nothing is saved.

- **Expenses** count spending when it happens, however it was paid. A card purchase is an expense that day; paying the card later is a **debt payment**, not a second expense. Transfers between own accounts are neither.
- **Interest** is the total of expenses in the "Intereses" category.
- **End-of-month position** uses only the accounts opened and transactions dated up to the month's last day.

The report downloads as Excel (`write-excel-file`) or PDF (`jspdf` + `jspdf-autotable`). Both files are built from the same tables (`buildReportTables`) so they always match, and the libraries load only when a download is requested. The PDF uses the built-in Helvetica font, which only covers WinAnsi characters: `pdfText` replaces or removes anything else.

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

Screens call `getFinanceRepository()` and `getProfileRepository()` and never touch IndexedDB directly.

### Database versions

| Version | Date | Change |
| --- | --- | --- |
| 1 | Sep 2026 | `accounts`, `transactions` |
| 2 | Sep 2026 | `profile` (how the person wants to be called) |

A shipped version is never edited: each change is a new version, and Dexie upgrades existing browsers without touching their data. `lifeos-database.test.ts` opens a version-1 database with the current code to prove it.

## Profile

Each person chooses how LIFEOS greets them on the welcome step, or prefers not to say. The name lives in the browser like every other record (one `Profile` with id `"profile"`), is included in backups, and never appears in the code.

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
