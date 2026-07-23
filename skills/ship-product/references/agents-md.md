# Product AGENTS.md template

Create `AGENTS.md` at the product root during scaffold. Fill bracketed sections. Keep the **Env testing gate** wording intact.

```markdown
# AGENTS.md

## Project

- Product: [one sentence]
- Primary paid journey: [steps]
- Identity mode: [A — accounts + dashboard | B — guest checkout]
- Audience: [B2C / B2B / …]

## Stack

List only packages actually installed for this product.

- Runtime: Bun + TanStack Start
- API: in-process Elysia at /api/*
- DB: PostgreSQL + Drizzle
- [Auth / Polar / Resend / Redis / AI / … as applicable]

## Layout

- [Key folders and what belongs where]
- Naming: folder = noun/domain; leaf file = short aspect/verb; do not repeat the parent folder in the filename. Prefer `queries/users/profile.ts` over `queries/user-profile-query.ts`.

## State

- TanStack Query: API reads/writes and server cache
- Legend State: local UI only (sidebar, dialogs, local search, transient toggles)
- Do not mirror server entities in Legend State

## Commands

- `bun run dev`
- `docker compose up -d`
- `bun run db:migrate` (or project equivalent)
- `bun run db:seed` (if present)
- `bun run typecheck`
- `bun run test` / `bun run test:e2e` (E2E only after real `.env`)

## Local Compose defaults

- Postgres: user `postgres`, password `postgres`, db `app`, port `5432`
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app`
- Redis (only if auth and/or rate limits): `REDIS_URL=redis://localhost:6379`
- App: `http://localhost:3000`

## Env testing gate

Before any live/browser/E2E/provider testing, stop and ask for a real `.env`
covering `.env.example`. Do not continue testing until it exists and validates.
Implementing features and UI does not require the real `.env`; testing does.
Local Compose may use the documented database/Redis defaults above.

## Non-goals

[List what this product skipped: TipTap, analytics, admin, CI, teams, job queues, …]
```

## README.md (humans)

Also ship a short `README.md`:

- What the product is
- Prerequisites (Bun, Docker)
- Copy `.env.example` → `.env` (note the testing gate for agents)
- `docker compose up -d`, migrate, `bun run dev`
- Local default credentials table
- Useful scripts only
