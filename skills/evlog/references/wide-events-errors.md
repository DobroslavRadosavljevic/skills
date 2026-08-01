# Wide Events And Errors

## Why Wide Events

Replace many per-request `logger.info` lines with **one** event that accumulates context:

```ts
const log = useLogger(event)
log.set({ user: { id: 1, plan: 'pro' } })
log.set({ cart: { id: 42, items: 3, total: 9999 } })
log.set({ payment: { method: 'card', status: 'success' } })
// framework emits on response end
```

Benefits: correlated context, less noise, complete picture on failure paths.

## Design Rules

1. **Meaningful nested keys** — `order: { id, status }` not `data: { id }`.
2. **Group related fields** — `user`, `cart`, `shipping` objects.
3. **Set incrementally** as facts become known.
4. **Keep distinct failures** via `log.error` / `createError`; drop redundant success chatter once the wide event covers it.
5. Trust middleware for `method`, `path`, `requestId`, `status`, `duration` when using a framework integration.

## Sealing And Background Work

After emit (auto or `emit()`), or when head sampling drops (`emit()` → `null`), the logger is **sealed**. Later `set`/`error`/`info`/`warn` are ignored (console warning with dropped keys).

Fire-and-forget work after the response can still resolve the same ALS logger—looks like silent data loss without warnings.

### `log.fork(label, fn)`

Where supported (Express, Fastify, NestJS, SvelteKit, React Router, Next `withEvlog`, Elysia):

- Runs `fn` with a **child** logger from `useLogger()`
- Child emits its own event with `operation: label` and `_parentRequestId`
- Parent may emit before child finishes

Not available yet on Hono / Nuxt-Nitro `useLogger(event)` the same way—watch for post-emit warnings; use alternate patterns if needed.

AI streaming: supported integrations defer emit until the response body finishes so `createAILogger(log)` fields land on the same request event.

## Errors That Help Agents And Humans

| Field | Audience | Notes |
| --- | --- | --- |
| `message` | User / API | Required |
| `status` | HTTP | Default 500 |
| `code` | Clients | Stable machine id |
| `why` | Debug / agents | Technical cause |
| `fix` | User / agents | Actionable next step |
| `link` | Docs | URL |
| `cause` | Chain | Original Error |
| `internal` | Logs only | Never in HTTP JSON or `parseError` |

Prefer `createError` over `throw new Error('…')` in handlers.

### Level Without Stock Error Shape

```ts
log.setLevel('error')
log.set({
  error: { code: 'PAYMENT_DECLINED', reason: 'insufficient_funds' },
})
```

## Catalogs

Scale repeated errors/audits with typed catalogs (`evlog/catalog` + docs under Learn → Catalogs). Use catalogs when the same `code`/`action` appears across packages; keep `why`/`fix` consistent for refactor-safe alerting.

## Typed Fields

Augment module types so `log.set` autocompletes shared schema (Learn → Typed Fields). Prevents key typos across the codebase.

## Redaction

Auto-scrub PII/secrets before console and drains (authorization, password, token, cards, emails, etc.). Do not log raw secrets expecting redaction as the only control—still avoid putting them in context when possible. See Learn → Redaction / Best Practices.

## Anti-Patterns

- Multiple info logs reconstructing a narrative that one wide event should hold
- Flat ungrouped keys and generic `data` blobs
- Bare throws without `why`/`fix` on user-facing failures
- Calling `set` after response/`emit` for “late” context without `fork`
- `initLogger` inside a published library
