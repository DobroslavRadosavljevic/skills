---
name: ship-product
description: >-
  Manually build a paid TanStack Start fullstack product end-to-end (need-based
  stack, Polar, auth or guest checkout, env gate before live testing). HUMAN
  INVOCATION ONLY — do not auto-apply. Use only when the user explicitly invokes
  ship-product / $ship-product.
---

# Ship Product

Build one concrete paid product end-to-end. Not a sellable boilerplate kit.

## Invocation

**Manual / human-only.** Apply this skill only when a human explicitly invokes
it (for example `$ship-product`, "use ship-product", or "follow ship-product").
Do not load or follow it automatically because the task looks like a greenfield
app, SaaS, or TanStack Start project.

## Hard rules

- **Need-based installs** — thin backbone first; add packages only when the product map requires them. See [references/stack.md](references/stack.md).
- **Env gate** — implement features, UI, and integrations in code first. Do **not** run live provider calls, browser E2E against paid/AI/email flows, or claim the app works until a user-provided `.env` exists and validates. Details: [references/env-gate.md](references/env-gate.md).
- **Self-contained** — this skill embeds its own stack, naming, and workflow rules. Do not depend on other agent skills.
- **No competitor source** — do not copy ShipFast, Supastarter, or unrelated product repos.
- **Prefer `bun` / `bunx`** in all command examples.

## Workflow

Follow [references/build-phases.md](references/build-phases.md). Summary:

1. **Brief** — fill the product map ([references/product-brief.md](references/product-brief.md)): identity Mode A or B, money, core loop, optionals.
2. **Scaffold** — TanStack CLI in the opened workspace (see workspace rule below). Docker Compose, t3-env, `.env.example`, `README.md`, `AGENTS.md`.
3. **Foundation** — Drizzle, UI kit, evlog, health. Mode A: Better Auth + Redis secondary storage. Mode B: guest order/access tables.
4. **Domain** — real product feature. TanStack Query for API; Legend State for local UI only.
5. **Money + email** — Polar + Resend wired against env schema (no live sends yet).
6. **Shell + optionals** — marketing, legal placeholders, then AI/PDF/R2/etc. only if needed.
7. **GATE** — stop; present `.env.example` checklist; wait for real `.env`.
8. **Verify + fix** — after `.env` validates: compose up, migrate, seed if useful, browser paid journey, fix until clean ([references/verification.md](references/verification.md)).

## Workspace rule

| Situation | Action |
| --- | --- |
| Empty / new workspace cwd | Scaffold at workspace root |
| Non-empty workspace | Ask once; recommended default = product-named subfolder |
| Unrelated dirty files | Do not clobber or rewrite unrelated work |

## Identity modes

Pick one primary mode (details in [references/product-brief.md](references/product-brief.md)):

- **Mode A — Accounts + dashboard:** Better Auth, email verification required, optional Google OAuth, signed-in shell.
- **Mode B — Guest checkout:** configure → email → pay → deliver via email and/or unique opaque URL and/or R2 download. No dashboard unless the brief adds it.

## Architecture snapshot

- One app, one process: TanStack Start + in-process Elysia at `/api/*`.
- Feature-oriented layout; short path naming ([references/naming.md](references/naming.md)).
- Legend State = local UI only; TanStack Query = API/server state ([references/architecture.md](references/architecture.md)).
- Redis when rate limits **or** Better Auth (secondary storage). Omit Redis for guest apps with neither.
- Payments: [references/payments.md](references/payments.md).

## Docs every product ships

- `README.md` — humans: what it is, setup, local defaults, scripts.
- `AGENTS.md` — agents: stack, layout, commands, **env testing gate**, naming, non-goals. Use [references/agents-md.md](references/agents-md.md).
- `.env.example` — complete variable list with Compose defaults ([references/env-gate.md](references/env-gate.md)).

## Done before env gate

- Product features + UI for the chosen identity mode
- Integrations coded against env schema (not live-called)
- Minimal marketing + legal placeholders
- README + AGENTS.md + `.env.example`
- Compose Postgres; Redis only if auth and/or rate limits
- Typecheck / unit tests without cloud secrets preferred
- Live browser / provider journeys: **not yet**

## Stop condition (after .env)

Primary paid user journey works in a real browser for the chosen mode. Fix defects until none remain that block that journey.
