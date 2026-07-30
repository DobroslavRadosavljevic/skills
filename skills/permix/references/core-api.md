# Core API

Permix v4 core: definitions, setup, check, template, ReBAC, hydration primitives, hooks, errors.

## createPermix

```ts
import { createPermix } from 'permix'

function createPermix<D extends Definition>(initialRules?: Rules<D>): Permix<D>
```

### Definition shapes

```ts
// Entity → actions
createPermix<{
  post: ['create', 'read']
}>()

// Typed entity data + required
createPermix<{
  post: [
    'read',
    { name: 'edit', type: Post },
    { name: 'delete', type: Post, required: true },
  ]
}>()

// Nested trees
createPermix<{
  workspace: {
    billing: ['view', 'update']
    member: ['invite', 'remove']
  }
}>()

// Flat
createPermix<['read', 'write']>()
```

`ActionSpec`: `{ name: string; type?: unknown; required?: boolean }`.

### Helpers / types

| Export | Role |
|---|---|
| `ValidateDefinition<T>` | Keep shared schema consistent |
| `Rules<D>` | Type of `setup` payload |
| `createRules<D>(rules)` | Typed rules factory |
| `MergePermix<A, B>` | Merge definition trees |
| `DehydratedState<D>` | SSR JSON payload |
| `permix.$inferPath` | `'post.create' \| …` (type-only) |
| `permix.$inferDefinition` | Definition type (type-only) |

## setup

```ts
permix.setup({
  post: {
    create: true,
    edit: post => post?.authorId === user.id,
  },
})
```

- Replaces previous rules entirely.
- Cover all actions from the definition.
- Boolean or `(data?) => boolean`.
- With `type` + `required: true`: callback param non-optional; `check` requires data.
- With `type` only: data optional — omit data → typically `false` for `post?.…` rules.
- Initial rules at create time mark the instance ready immediately.

`getRules()` returns the current rules object (including functions) or `null`.

## check

Always returns **`boolean`**.

```ts
permix.check('post.create')
permix.check('post.edit', post)
permix.check(c => c('post.read') && c('post.update'))
permix.check(c => c('post.delete') || c('admin.override'))
permix.check('post.~all')
permix.check('post.~any')
permix.check('~all')
permix.check('~any')
```

| Form | Use |
|---|---|
| Dot path | Single action |
| Path + data | Entity-scoped rule |
| Callback | Compose AND/OR/`!` |
| `~all` / `~any` | Subtree or whole-tree aggregation |

**Removed:** `checkAsync`. Use:

```ts
await permix.isReadyAsync()
permix.check('post.read')
```

Checking without data when the rule needs entity data → **`false`** (docs). Throws inside a rule during dehydrate/`~all` without data are treated as **`false`**.

## template

Reusable rule factories on the instance:

```ts
const admin = permix.template({
  post: { create: true, read: true, edit: true, delete: true },
})

const member = permix.template(p => ({
  post: {
    create: true,
    read: true,
    edit: post => post?.authorId === p.userId,
    delete: false,
  },
}))

permix.setup(admin)
// or
permix.setup(member({ userId: user.id }))
```

Confirm exact `template` overloads against current docs when parameterizing.

## ReBAC (relationship-based)

No separate ReBAC API — model with closures over actor + entity:

```ts
permix.setup({
  post: {
    edit: post =>
      post != null &&
      (post.authorId === user.id || post.teamIds?.some(id => user.teamIds.includes(id))),
    share: post => post?.ownerId === user.id,
  },
})
```

Avoid async DB lookups inside every `check` — resolve relationships before `setup` or pass rich entity data into `check`. First-class async ReBAC is not shipped (tracked upstream).

Docs: https://permix.letstri.dev/docs/guide/rebac

## Ready state

| Method | Behavior |
|---|---|
| `isReady(): boolean` | `true` after first `setup` or initial rules |
| `isReadyAsync(): Promise<void>` | Resolves when ready |

**`hydrate` alone does not set ready.** Boolean rules from hydrate are still `check()`-able.

## dehydrate / hydrate

```ts
const state = permix.dehydrate() // throws PermixNotReadyError if no rules
permix.hydrate(state)
```

- Output is JSON-safe booleans.
- Function rules are evaluated **once without data** → often `false` in the snapshot.
- After hydrate: call **`setup` again** on the client to restore functions and mark ready.
- `hydrate` fires the **`setup` hook** (there is no separate `hydrate` hook in v4).

## Hooks

```ts
permix.hook('setup', () => {})
permix.hook('ready', () => {}) // once, first readiness
permix.hook('check', ({ path, data }) => {})
permix.hookOnce('ready', () => {})
```

Callback-form `check` reports `path: null` in the check hook context.

## Errors

| Error | When |
|---|---|
| `PermixNotReadyError` | `check` / `dehydrate` with no rules (no setup, no initial rules) |
| `PermixRuleNotDefinedError` | Path missing / deeper than rules (`error.path`) |
| `PermixNotFoundError` | Server integration: instance missing from request context |

v3 logged and returned `false` in several of these cases — v4 **throws**.

## No reset API

There is no `reset()`. Call `setup` with a new full rules object, or create a new instance.

## Security model

1. **Server** runs `setup` from trusted session/user and `check` (or middleware) before mutations.
2. **Client** mirrors rules for UX (buttons, routes, `Check` components).
3. Dehydrated state is visible/editable in the browser — never the authority.

## Mental model

**Typed permission tree → actor `setup` (bool or closure) → `check` path[/data] or compose → SSR: dehydrate booleans, client hydrate + re-setup functions → enforce for real on the server.**
