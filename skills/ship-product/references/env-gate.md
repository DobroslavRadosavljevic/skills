# Env gate

## Rule

Before any live/browser/E2E/provider testing, **stop** and ask the user for a real `.env` covering every variable in `.env.example`. Do not continue testing until that file exists and passes env validation.

Implementing features and UI does **not** require the real `.env`. Testing does.

Local Docker Compose may use the documented database/Redis defaults below.

## What may run before user secrets

- Write application code, migrations, UI, `.env.example`, README, AGENTS.md
- Start **Postgres** (and **Redis** when auth/limits are on) via Compose using defaults
- Typecheck and unit tests that do not call cloud providers

## What must wait for user `.env`

- Live OpenRouter / Polar / Resend / Sentry / R2 / Turnstile / Google OAuth calls
- Browser or Playwright journeys that exercise pay, email, AI, or OAuth
- Claiming the product “works” end-to-end

## Local Compose defaults

Document these exact values in every product `.env.example` and `AGENTS.md`:

| Service / var | Local default |
| --- | --- |
| Postgres user | `postgres` |
| Postgres password | `postgres` |
| Postgres db | `app` |
| Postgres port | `5432` |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/app` |
| Redis port (when Redis on) | `6379` |
| `REDIS_URL` (when Redis on) | `redis://localhost:6379` |
| `APP_URL` | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Dev-only placeholder in `.env.example` — replace for real testing |
| `AI_MODEL` (when AI on) | `x-ai/grok-4.5` |

Compose: Postgres whenever the DB is used. Redis only when Better Auth and/or rate limits are on.

## `.env.example` checklist

Ship every variable the **installed** capabilities need. Comment local defaults vs user secrets.

| Group | Variables |
| --- | --- |
| App | `APP_URL`, `NODE_ENV` |
| Database | `DATABASE_URL` |
| Auth (Mode A) | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (or app URL), `REDIS_URL`, optional `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` |
| Redis | `REDIS_URL` when auth and/or rate limits on |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` |
| Payments | `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, product/price ids as required by Polar setup |
| AI | `OPENROUTER_API_KEY`, `AI_MODEL=x-ai/grok-4.5` |
| Sentry | `SENTRY_DSN` (and related) when enabled |
| Turnstile | `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` when enabled |
| R2 / files | Account id, access key id, secret access key, bucket, public/base URL when enabled |

## Agent stop message (template)

When the gate is reached, tell the user:

1. Build phases 1–6 are complete (or list gaps).
2. Paste or attach the required keys from `.env.example` (grouped).
3. Local Compose defaults for Postgres/Redis if applicable.
4. You will not start live testing until `.env` is present and validates.

## After `.env` arrives

1. Confirm file exists and t3-env validation passes.
2. Proceed to verification ([verification.md](verification.md)).
