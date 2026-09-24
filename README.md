# LIFEOS

> A personal life operating system for recording meaningful facts, understanding progress, and making better decisions over time.

LIFEOS is a long-term personal web application. It brings together finances, habits, goals, learning, health, relationships, and meaningful memories in one place.

This is not a 30-day challenge tracker. The goal is to preserve a trustworthy history for years, then turn that history into useful reports and reflections.

## Why LIFEOS?

Personal information usually lives in disconnected places: a banking app, a notes app, a calendar, photos, and habit trackers. LIFEOS explores a single, private-first system that connects those facts without turning a person's life into an artificial score.

For example, a date with a partner can become one meaningful moment connected to:

- an activity together;
- a reflection or note;
- photos stored privately;
- an optional financial expense; and
- a shared goal, such as spending quality time together.

## MVP scope

The first usable version will focus on daily, high-value actions:

1. **Finances:** record income, cash expenses, credit-card purchases, debts, and debt payments.
2. **Habits:** record habits with real values such as minutes, quantity, or notes.
3. **Moments:** save meaningful activities with notes and, later, photos.
4. **Dashboard:** show the current financial position and today's most relevant actions.

Goals, reports, charts, cloud synchronization, and natural-language queries will be added progressively after the core records are reliable.

## Data principle

**Store facts. Calculate results.**

LIFEOS stores events such as an income, a purchase, a payment, or a study session. It calculates derived values such as available balance, total debt, hours studied, streaks, and goal progress from those records.

This prevents contradictory data and keeps historical reports reliable.

### Financial rules

Every financial fact is a transaction that moves money out of one account and/or into another. Credit cards and loans are accounts with a negative balance while money is owed.

```text
account balance   = opening balance + money in - money out
available balance = cash + debit + savings balances
total debt        = credit card + loan balances
```

A credit-card purchase increases debt but does not reduce available cash until the debt is paid. Paying the card is a transfer from a debit account to the card.

## Architecture

The project will keep the UI separate from business rules and persistence:

```text
Next.js UI
    ↓
Feature actions and forms
    ↓
Domain rules and calculations
    ↓
Repository interface
    ↓
localStorage first → database and sync later
```

Read the detailed architectural decisions in [docs/architecture.md](docs/architecture.md). Future ideas that could set LIFEOS apart are collected in [docs/ideas.md](docs/ideas.md).

## Tech stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- ESLint
- Vitest (`npm test`)

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Roadmap

- [x] Initialize the Next.js project and GitHub repository.
- [x] Document the product vision and core data rules.
- [x] Define the financial domain model (single ledger of transactions).
- [x] Calculate account balances, available balance, and total debt with tests.
- [x] Record income, expenses, credit purchases, and debt payments.
- [x] Add local persistence (IndexedDB) behind a repository interface.
- [x] Build the financial dashboard.
- [x] Export and import backups as JSON files.
- [x] Edit and soft-delete transactions, with undo.
- [x] Edit, archive and delete accounts.
- [x] Monthly report with spending by category, downloadable as Excel or PDF.
- [ ] Add quantitative habit tracking.
- [ ] Add meaningful moments and photo storage.
- [ ] Add reports, charts, and date filters.
- [ ] Add authentication, cloud synchronization, and private media storage.

## Privacy

LIFEOS is designed for sensitive personal information. Never commit real financial records, private notes, photos, passwords, API keys, or `.env` files to this public repository.

## Learning approach

This project is built as a learning journey. Each feature starts with a small, understandable implementation, followed by testing and refactoring when necessary. The commit history documents that evolution.
