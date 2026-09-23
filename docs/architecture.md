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

## Financial model

The financial domain must distinguish three events:

| Event | Available balance | Debt |
| --- | ---: | ---: |
| Cash expense | decreases | unchanged |
| Credit purchase | unchanged | increases |
| Debt payment | decreases | decreases |

The application should store the individual events and calculate balances for a selected date range. It must not save `availableBalance` or `totalDebt` as mutable source-of-truth fields.

## Persistence path

```text
First: repository interface + local browser storage
Later: repository implementation backed by PostgreSQL and object storage
```

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
