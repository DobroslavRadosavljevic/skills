# Verification (after `.env`)

Run only after a user-provided `.env` exists and passes t3-env validation.

## Boot

1. `docker compose up -d` (Postgres; Redis if present).
2. Apply migrations.
3. Seed only if it helps local testing.
4. Start the app; hit health endpoint.

## Mode A — primary journey

1. Sign up (Turnstile if enabled).
2. Complete email verification (Resend).
3. Sign in; land in dashboard/shell.
4. Exercise the core product loop.
5. Start Polar checkout (sandbox); return; confirm local entitlement/state.
6. Confirm receipt or verify email as designed.
7. Spot-check settings, sign out, protected route redirect.

## Mode B — primary journey

1. Configure the product on the marketing/flow UI.
2. Enter email; start Polar checkout (sandbox).
3. Confirm webhook updates order to paid (or complete sandbox return path).
4. Confirm delivery email received (or provider dashboard + local delivery ledger).
5. Open unique access link and/or R2 download; confirm content.
6. Confirm invalid/expired tokens fail closed.

## When AI is on

- Trigger generation with `AI_MODEL` default `x-ai/grok-4.5` via OpenRouter.
- Confirm Streamdown (or chosen UI) renders streamed output.
- Confirm rate limits behave under repeated abuse attempts.

## When files/PDF on

- Upload or generate PDF via PDFx as designed.
- Confirm R2 object exists and authorized download works.

## Fix loop

1. Record failures with enough detail to reproduce.
2. Fix actionable defects.
3. Re-run the affected journey.
4. Stop when the primary paid journey works; list any deferred non-blockers.

## Do not claim done when

- `.env` was never provided
- Checkout, email, or AI was skipped “because sandbox”
- Only unit tests passed with no browser journey
- Mode B links are guessable or unsigned
