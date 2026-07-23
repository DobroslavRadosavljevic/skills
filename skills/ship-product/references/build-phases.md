# Build phases

Implement code in every build phase. Live testing starts only after the env gate.

## 1 — Brief

1. Fill the product map in [product-brief.md](product-brief.md).
2. Lock identity Mode A or B, money model, core loop.
3. List optional capabilities that are actually on.
4. Derive the install set from [stack.md](stack.md). Do not install unused stacks.

## 2 — Scaffold

1. Apply the workspace rule (root vs product subfolder).
2. Scaffold with TanStack CLI (TanStack Start, Bun, TypeScript).
3. Add Docker Compose: Postgres always; Redis only if auth and/or rate limits.
4. Add t3-env + Zod env module and a complete `.env.example` ([env-gate.md](env-gate.md)).
5. Write `README.md` (humans) and `AGENTS.md` ([agents-md.md](agents-md.md)).
6. Follow [naming.md](naming.md) from the first file created.

## 3 — Foundation

1. Drizzle schema + migrations; health endpoint.
2. shadcn Base UI components via CLI; Hugeicons (not Lucide); Inter or Geist.
3. evlog wiring; app shell / layout primitives.
4. **Mode A:** Better Auth (email verification required), Redis secondary storage, optional Google OAuth scaffolding behind env.
5. **Mode B:** guest order + access-token tables (and R2 keys if downloads are on).
6. Rate limiter + Turnstile modules only if those capabilities are on.
7. Sentry only if enabled for this product.

## 4 — Domain

1. Implement the real product feature end-to-end in code.
2. TanStack Query for API data; Legend State for local UI only.
3. Mode A: dashboard surfaces for the core loop. Mode B: configure → checkout entry without a signed-in dashboard.
4. Empty, loading, validation, and failure UI states for the core loop.

## 5 — Money + email

1. Polar checkout + webhook handlers with signature verification and idempotent event storage ([payments.md](payments.md)).
2. Resend + React Email templates needed by the mode (verify, receipts, guest delivery).
3. Wire clients against env schema. **No live checkout or email sends yet.**

## 6 — Shell + optionals

1. Minimal marketing: landing + pricing.
2. Legal placeholders: terms + privacy (user will fill copy).
3. Contact/support stub if useful.
4. Optional integrations only if on: OpenRouter (`x-ai/grok-4.5`) + Streamdown, PDFx, files-sdk+R2, Motion.
5. Seed script structure if local demo data will help after `.env`.

## GATE — Stop for `.env`

1. Confirm [done-before-gate](#done-before-env-gate) checklist.
2. Present the `.env.example` checklist from [env-gate.md](env-gate.md).
3. Ask the user for a real `.env`. **Wait. Do not continue to live testing.**
4. Typecheck and unit tests that need no cloud secrets are allowed.

## 7 — Verify

Only after `.env` exists and validates — see [verification.md](verification.md).

1. `docker compose up` (Postgres; Redis if present).
2. Migrate; seed if useful.
3. Run the app; execute the primary paid browser journey for the mode.

## 8 — Fix

1. Fix every actionable defect blocking the paid journey.
2. Re-run affected verification.
3. Stop when the primary journey works; report residual blockers honestly.

## Done before env gate

| Check | Required |
| --- | --- |
| Product features + UI for chosen identity mode | Yes |
| Integrations coded against env schema | Yes |
| Minimal marketing + legal placeholders | Yes |
| README + AGENTS.md with env gate | Yes |
| `.env.example` with Compose defaults | Yes |
| Compose Postgres; Redis only if auth/limits | Yes |
| Workspace rule followed | Yes |
| Typecheck / unit without cloud secrets | Preferred |
| Live browser / provider journeys | No — after `.env` only |
| Hugeicons free set (not Lucide) | Yes when UI exists |
