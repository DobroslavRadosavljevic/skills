# Naming

Rules for files, folders, symbols, routes, flags, and product terms. Goal: a stranger can guess the job from the name.

## Principles

1. **Full words over clever short forms.** `invoice` not `invc`, unless the whole codebase already says `inv`.
2. **Say the role.** `parseEnv` not `helpers2`.
3. **One word per idea.** Pick one word per concept (`signIn` vs `logIn` — one only) and stick to it. Same rule as STE in prose.
4. **No comedy names in production paths.** Fine in throwaway scratch; not in shared folders.
5. **Match local convention** for case (`camelCase`, `kebab-case`, `PascalCase`) — clarity first, style second.

## Files and folders

| Prefer | Avoid |
| --- | --- |
| `user-settings-page.tsx` | `UsrSet.tsx`, `page2.tsx` |
| `billing/invoices/` | `bill/inv/`, `stuff/` |
| `get-session.ts` | `gs.ts`, `utils.ts` (when it only gets a session) |
| `README.md` section “Setup” | “Instantiation & Hydration Pipeline” |

- Folders = durable domains (`auth`, `billing`, `orders`), not temporary chores (`new`, `fixed`, `wip`).
- Avoid `final`, `new`, `v2`, `copy`, `temp` in names that will live more than a day.
- Test files mirror the unit: `get-session.test.ts` next to `get-session.ts` (or the repo’s existing pattern).

## Functions and methods

| Prefer | Avoid |
| --- | --- |
| `createOrder`, `cancelOrder` | `orderOp`, `handle`, `run`, `exec` |
| `isExpired`, `hasPermission` | `check`, `flag`, `status` (as boolean) |
| `toDto`, `fromRow` when that is the real job | `map1`, `transformData` |

- Start with a **verb** for actions; **noun/adjective** for pure data getters is fine (`userName`).
- Don’t hide side effects behind cute names (`tickleCache` → `refreshCache`).

## Types and interfaces

| Prefer | Avoid |
| --- | --- |
| `User`, `OrderLine` | `IUser`, `UserInterface`, `Data`, `Model` |
| `PaymentStatus` | `PS`, `Enum1` |
| `Result`, `Error` only when scoped (e.g. `LoginResult`) | Global `Thing`, `Object`, `Item` |

## Variables

- Locals can be short **in tiny scopes** (`i`, `err`, `row`) when the type is obvious.
- Module-level and public names stay descriptive.
- No `data`, `info`, `obj`, `tmp` unless the lifetime is truly temporary and immediate.

## APIs, routes, flags

| Prefer | Avoid |
| --- | --- |
| `POST /orders` | `POST /ordCreateV2` |
| `--dry-run` | `--dr` |
| Env `DATABASE_URL` | `DB_U` (unless established) |

Document flags in the same plain words the flag uses.

## Rename policy

When plain-language is active and a name fails the aloud/search/teammate tests:

1. Propose the clearer name.
2. Rename if the change is in scope and safe (or ask when it would churn a public API).
3. Don’t “fix” names by making them longer with empty words (`AbstractBaseUserEntityManager`).

## Domain exceptions

Keep industry-standard short forms when they **are** the common word for that team: `id`, `url`, `http`, `sql`, `css`, `jwt` (define JWT once if the user may not know it), `db` if every file already says `db`.

If a library forces a name (`useEffect`, `drizzle`), keep the library name and explain it plainly around it.
