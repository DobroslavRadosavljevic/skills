# Layout Model

Gold-standard reference for `simplify-layout`. Reuse the **rules**, not any one
project's folder names.

## Why this shape works

- Short domain folders (`auth/`, `billing/`, `users/`, `orders/`)
- Leaf files named by aspect (`create.ts`, `card.ts`, `map.ts`), not by
  restating the package or parent folder
- Related modules grouped by product domain under a stable role bucket
- Longer names reserved for durable public identities
  (`services/analytics-traffic-read/`), with short files inside

## Role → domain → aspect

1. Pick the **role** bucket that matches ownership (`queries`, `services`,
   `components`, `hooks`, `lib`, … — only what the archetype already uses).
2. Add a **domain** folder when siblings would otherwise need prefixes
   (`users`, `orders`, `billing`).
3. Name the **file** after the one aspect it owns.
4. Keep tests beside sources (`map.test.ts`, `token.test.ts`) or in a local
   `tests/` only when the package already does that.

Path should read as English without repetition: `queries/users/profile`,
`components/orders/detail`, `auth/token`.

## Short leaf names (copy this shape)

```text
src/auth/
  token.ts
  session.ts
  refresh.ts
  password-reset.ts   # multi-word only when needed

src/queries/
  users/profile.ts
  users/list.ts
  orders/detail.ts
  orders/overview.ts
  billing/invoice.ts
  billing/shared.ts

src/rows/events/
  map.ts
  types.ts
  fields.ts
  kinds.ts
  constants.ts
```

## Top-level role buckets (adapt, do not copy blindly)

| Folder | Role |
| --- | --- |
| `queries/`, `repos/`, `data/` | Data access grouped by domain |
| `services/`, `use-cases/` | Domain services (folder = service id) |
| `components/`, `hooks/`, `screens/` | UI surfaces |
| `errors/`, `types/`, `contracts/` | Shared contracts / errors |
| `seed/`, `fixtures/`, `benchmark/` | Focused operational concerns |

Package or module root files stay short too: `client.ts`, `config.ts`,
`health.ts`, `index` only when barrels are already the local convention.

## What stays longer on purpose

Service or package folders encode a durable domain identity used across apps:

```text
services/analytics-traffic-read/
  service.ts          # short role file inside
  errors/…
```

Do not "simplify" those folder ids into opaque abbreviations. Simplify the
**files inside** and the **domain** trees instead.

## Anti-patterns this model rejects

```text
# Restating parents
src/queries/query-user-profile.ts
src/rows/events/event-row-map.ts
src/auth/auth-token-helper.ts

# Flat prefix soup
src/queries/
  users-profile-query.ts
  users-list-query.ts
  orders-detail-query.ts
  billing-invoice-query.ts

# Vague dumping
src/helpers/
src/utils/misc/
src/common/shared.ts
```

## Adapting by archetype

| Archetype | Keep | Apply |
| --- | --- | --- |
| Workspace package | Role buckets that match ownership | Short domain + aspect leaves |
| API / ingest feature | `public/` / `private/` / `internal/` | Short names inside; group by subdomain |
| UI subtree | Existing primitive/component conventions | One concern per file; no mega `form.tsx` |
| Utils domain | Category folders (`url/`, `text/`) | Short operation files; `lib/` only for private helpers |

Never copy data-layer folders (`queries/`, `rows/`) into a React feature just
because another package uses them.
