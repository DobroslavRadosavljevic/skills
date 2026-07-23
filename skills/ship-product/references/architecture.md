# Architecture

One application, one process. Not a monorepo. Not a separate API deployable.

## Request path

```text
Browser
  → TanStack Start routes / loaders / server functions
  → /api/* splat server route
  → in-process Elysia (Web Standard Request/Response)
  → feature modules
  → Drizzle → PostgreSQL

External: Better Auth (Mode A) · Polar · Resend · OpenRouter · R2 · Turnstile · Sentry
```

- **Server functions** — same-origin app operations.
- **Elysia `/api/*`** — Better Auth handlers, webhooks, health, public HTTP APIs.
- Authorize every private read/mutation on the server. Route guards are navigation only.

## State ownership

| Concern | Tool |
| --- | --- |
| API reads, mutations, cache, refetch | TanStack Query |
| Local UI only (sidebar open, dialog open, local filter text, transient toggles) | Legend State |

Do **not** mirror server entities in Legend State.

## Suggested top-level shape

Adapt names to the product; keep paths short ([naming.md](naming.md)):

```text
src/
  routes/           # file routes: marketing, auth or guest, app shell
  features/         # domain folders (orders, speeches, …)
  components/       # ui/, layout/, forms/, data/, feedback/
  server/           # auth/, db/, email/, billing/, files/, limits/
  env/              # t3-env schemas
  styles/
```

Feature folders own their UI pieces, validation, and server modules when that keeps change locality high. Prefer domain nouns over generic `utils/` dumping grounds.

## Mode A extras

- Better Auth tables + app profile tables as needed
- Redis as Better Auth secondary storage
- Protected `_app` (or equivalent) route tree and settings

## Mode B extras

- `orders` (or equivalent) with email, payment status, Polar ids
- `access` tokens/hashes → opaque public routes
- Optional R2 object keys for downloadable results
- No signed-in dashboard unless brief expands later

## Guest access links

- Cryptographically random opaque ids (not sequential)
- Server validates token → loads order/result
- Prefer expiring links; allow regenerate via email when product needs it
- Never put secrets in the URL beyond the opaque token

## Security baselines

- Env validation via t3-env + Zod
- CSRF protection for server functions where the framework expects it
- Webhook signature verification (Polar) and idempotent event storage
- Rate limits on auth, AI, and checkout when those surfaces exist
- Turnstile on public abuse-prone forms when enabled
