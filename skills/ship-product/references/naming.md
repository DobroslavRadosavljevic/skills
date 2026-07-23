# Naming

Keep file trees **short-named** and **well-grouped**.

## Rules

1. **Path context replaces filename prefixes** — do not repeat the parent folder in the leaf name.
2. **Folder = noun / domain; file = aspect / operation.**
3. **Group related modules** under one parent so siblings that change together sit together.
4. **Multi-word leaves only when needed** (`password-reset.ts`).
5. **Tests** beside sources (`map.test.ts`) or local `tests/` only when already conventional.

## Prefer / avoid

| Avoid | Prefer |
| --- | --- |
| `queries/user-profile-query.ts` | `queries/users/profile.ts` |
| `auth/auth-token-helper.ts` | `auth/token.ts` |
| `components/billing-invoice-card.tsx` | `components/billing/invoice-card.tsx` or `billing/invoice/card.tsx` |
| `utils/helpers.ts` dumping ground | Domain folders with aspect files |

## Shape

```text
src/auth/
  token.ts
  session.ts
  password-reset.ts

src/queries/
  users/profile.ts
  users/list.ts
  orders/detail.ts

src/features/orders/
  create.ts
  access.ts
  receipt.ts
```

Role buckets stay short when used: `components/`, `queries/`, `hooks/`, `server/`, `routes/`.

## Anti-patterns

- Restating the package or feature name in every file
- Deep trees of single-file folders with no grouping benefit
- Opaque abbreviations for durable domain folders users must search for
- Mixing unrelated domains in one flat `lib/` with long prefixed filenames
