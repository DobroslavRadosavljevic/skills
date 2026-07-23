# Stack

Install only what the product map requires. Prefer `bun` / `bunx`.

## Backbone (every app)

| Layer | Choice |
| --- | --- |
| Runtime / scaffold | Bun + TanStack Start via TanStack CLI |
| Routing / SSR | TanStack Router via Start |
| API | In-process Elysia mounted at `/api/*` splat route |
| DB | PostgreSQL + Drizzle + Docker Compose Postgres |
| Env | t3-env (`@t3-oss/env-core` or matching) + Zod + complete `.env.example` |
| Validation | Zod at request/domain boundaries |
| Server state | TanStack Query — API reads/writes only |
| Local UI state | Legend State — sidebar, dialogs, local search, ephemeral UI only |
| Forms / tables | TanStack Form · Table when the UI needs them |
| UI kit | Tailwind 4 + shadcn (Base UI primitives) + Typeset + Sonner |
| Icons | Free Hugeicons — not Lucide. Replace shadcn Lucide defaults when installing components |
| Font | Inter or Geist as default; pick another if brand fits better |
| Dates | date-fns (+ helpers as needed) |
| Logging | evlog (wide events) |
| Marketing | Minimal landing / pricing; legal placeholder pages |
| Docs | README (humans) + AGENTS.md (agents, includes env gate) |
| Naming | Short paths — see [naming.md](naming.md) |
| Tests tooling | Vitest + Playwright (live E2E only after `.env`) |
| Deploy target | Vercel (document; do not add CI unless asked) |

## Add when the brief needs it

| Capability | Choice | Trigger |
| --- | --- | --- |
| Auth + dashboard | Better Auth + email verification required (+ optional Google OAuth) | Mode A |
| Guest delivery | Email + magic/opaque link and/or R2 download | Mode B |
| Payments | Polar | Any paid product |
| Email | Resend + React Email | Verify, receipts, guest delivery |
| Redis | Docker Redis + `REDIS_URL` | Rate limits **or** Better Auth (secondary storage) |
| Rate limits | `rate-limiter-flexible` + Redis | Auth, AI, or paid-action abuse risk |
| Captcha | Cloudflare Turnstile | Public signup or abuse-prone actions |
| Errors | Sentry (evlog drain OK) | Shipping beyond a local toy |
| Motion | `motion` | Marketing/product motion that matters |
| AI | `ai` + `@openrouter/ai-sdk-provider` | Core loop uses an LLM |
| AI model | `x-ai/grok-4.5` | Default when AI is on; `AI_MODEL` override OK |
| AI markdown UI | `streamdown` | Streaming or markdown model output |
| PDF | PDFx (`bunx pdfx-cli`) + `@react-pdf/renderer` | Downloadable documents |
| Uploads / files | `files-sdk` + R2 adapter | Binaries or guest download assets |

## Redis rule

- Add Redis to Compose and env when **rate limiting** is needed **or** when **Better Auth** is used.
- When Better Auth is on, configure Redis as **secondary storage**.
- Omit Redis entirely for Mode B apps with no auth and no rate limits.

## Skipped unless later unlocked

TipTap · product analytics · admin panel · CI · blog/MDX · i18n · realtime · job queues · search engines (use Postgres) · teams/orgs · Effect service layers · monorepo splits.

## Hugeicons note

shadcn CLI often pulls Lucide. For this stack, use the **free Hugeicons** set for product icons and strip/replace Lucide usage in generated UI components.
