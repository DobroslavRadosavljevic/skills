# Migrate Permix v3 → v4

Breaking changes and a practical checklist. Source: https://permix.letstri.dev/docs/migration-v3-to-v4 and [PR #35](https://github.com/letstri/permix/pull/35).

## Install

```sh
bun add permix@^4
```

v4 is developed against modern TypeScript; upgrade TS if inference breaks. Ignore stale npm `beta`/`rc` **2.x** tags.

## Quick reference

| v3 | v4 |
|---|---|
| `createPermix<{ post: { action: 'read'; dataType: Post } }>()` | `createPermix<{ post: ['read', { name: 'edit', type: Post }] }>()` |
| `dataRequired: true` on entity | `required: true` on action spec |
| `check('post', 'read')` | `check('post.read')` |
| `check('post', 'edit', post)` | `check('post.edit', post)` |
| `check('post', 'all')` / `'any'` | `check('post.~all')` / `'post.~any'` |
| `check('post', ['read', 'update'])` | `check(c => c('post.read') && c('post.update'))` |
| `<Check entity action>` | `<Check path="post.edit">` |
| `checkMiddleware('post', 'create')` | `checkMiddleware('post.create')` |
| `check` before setup → log + `false` | throws **`PermixNotReadyError`** |
| Invalid path → log + `false` | throws **`PermixRuleNotDefinedError`** |
| `checkAsync(...)` | `await isReadyAsync()` then `check(...)` |
| tRPC `forbiddenError` | `onForbidden` on `createPermix({ ... })` |
| tRPC `permix.setup(rules)` returning slim object | `setupContext(rules)` → full instance on ctx |
| `hook('hydrate')` | use `hook('setup')` |
| `permix/better-auth` | **removed** — map roles to `setup()` manually |

`setup`, `template`, `dehydrate`/`hydrate`, `hook`, `isReady` / `isReadyAsync` remain (types/semantics updated). Nested definition trees and flat tuples are **new** in v4.

## 1. Definitions

```ts
// v3
createPermix<{
  post: {
    dataType: Post
    action: 'read' | 'edit'
    dataRequired?: true
  }
}>()

// v4
createPermix<{
  post: [
    'read',
    { name: 'edit', type: Post },
    { name: 'delete', type: Post, required: true },
  ]
}>()

// v4 nested
createPermix<{
  workspace: {
    billing: ['view', 'update']
  }
}>()
```

Enums: put enum members in the action tuple. `setup` rule object keys stay action names.

## 2. check calls

```ts
-permix.check('post', 'read')
-permix.check('post', 'edit', post)
-permix.check('post', 'all')
-await permix.checkAsync('post', 'read')

+permix.check('post.read')
+permix.check('post.edit', post)
+permix.check('post.~all')
+await permix.isReadyAsync()
+permix.check('post.read')
```

Path type without duplicating schema: `type Path = typeof permix.$inferPath`.

## 3. UI

```tsx
-<Check entity="post" action="edit" data={post}>
+<Check path="post.edit" data={post}>
```

```ts
-const canEdit = check('post', 'edit', post)
+const canEdit = check('post.edit', post)
```

Gate on `isReady` before `check` when rules may be absent:

```tsx
const { check, isReady } = usePermix(permix)
if (!isReady) return <div>Loading permissions…</div>
```

## 4. Hydration / ready

Unchanged serialization: functions → `false` in JSON.

| | After hydrate only |
|---|---|
| `isReady()` | `false` until client `setup()` |
| `check` on dehydrated booleans | works |
| Function rules | need client `setup` |

## 5. Server / RPC

Express/Hono/Elysia/Fastify/Node: update definitions + dot-path middleware; patterns otherwise familiar.

tRPC / oRPC:

```ts
- return next({ ctx: { permix: permix.setup({ ... }) } })
+ return next({ ctx: permix.setupContext({ ... }) })

- createPost.use(permix.checkMiddleware('post', 'create'))
+ createPost.use(permix.checkMiddleware('post.create'))
```

Optional `.contextKey('permissions')` (default `permix`).

## 6. Better Auth

Remove `permix/better-auth`, `permixPlugin`, `permixClient`, and `createPermix<Definition, Session>`. Map each role to a `Rules` object and call `setup` yourself.

## 7. New optional subpaths

`permix/next`, `permix/tanstack-start`, `permix/server`, `permix/svelte`, `permix/drizzle`, `permix/drizzle/legacy`, `permix/effect`.

## Checklist

1. Bump to `permix@^4`.
2. Convert generics to action tuples / specs.
3. Replace every two-arg `check` and middleware path.
4. Update `Check` / composables to `path=`.
5. After hydrate, client `setup`; replace `hook('hydrate')`.
6. tRPC/oRPC: `setupContext`, `onForbidden`, dot paths.
7. Remove Better Auth plugin wiring.
8. Run typecheck + tests; fix `PermixNotReadyError` / `PermixRuleNotDefinedError` call sites that previously relied on `false`.

## What stayed the same

- Rules shape in `setup` (nested booleans / functions).
- `template` for reusable sets.
- Dehydrate/hydrate for SSR (with ready caveats).
- Events `setup` / `ready` / `check`.
- Philosophy: type-safe, framework-agnostic, ReBAC via closures.
