# Plugins, Scope, and Context

Use this reference for application composition, cross-cutting behavior, dependency injection, guards, macros, and request context.

## Plugin Model

Every Elysia instance can run independently or be composed with `.use(...)`. Treat feature instances as explicit dependency boundaries.

- A feature that needs a database, auth service, model set, or macro should `.use(...)` that plugin itself.
- Prefer a new named Elysia instance over a callback that mutates the parent; instance boundaries are easier to reason about and infer.
- Add `name` to a reusable plugin when lifecycle deduplication matters. Add `seed` when two configurations should be considered distinct.
- Use global dependencies sparingly for concerns that truly apply everywhere, such as CORS, telemetry, or logging. Keep typed business dependencies explicit.

## Scope Is a Security Boundary

Plugin lifecycle hooks and schemas are isolated by default.

| Scope | Current | Descendants | Direct parent | Higher ancestors |
| --- | --- | --- | --- | --- |
| `local` | yes | yes | no | no |
| `scoped` | yes | yes | yes | no |
| `global` | yes | yes | yes | yes |

Choose scope at the narrowest level that satisfies the contract:

- Inline `{ as: 'scoped' }` or `{ as: 'global' }` changes one hook.
- `guard({ as: ... })` applies scope to the guard's schemas and hooks, but not `derive`/`resolve`.
- `.as('scoped')` or `.as('global')` casts the current instance's hooks and schemas.

Never infer that a root route is authenticated because a used child plugin contains an auth hook. Prove the exact protected route set with tests.

## Guard and Group

- `guard` applies schemas and hooks to a route block or to later routes on the current instance.
- `group` adds a common prefix and may accept a guard object.
- Prefer a feature plugin with `prefix` when the group has independent dependencies, context, models, or tests.
- Watch for schema collision rules. The default guard mode overrides colliding schema slots; standalone mode validates colliding schemas independently.

## Extending Context

Use the smallest matching primitive:

| API | Timing | Use for | Avoid |
| --- | --- | --- | --- |
| `state` | app setup | shared mutable primitive state in `store` | request-local or durable distributed state |
| `decorate` | app setup | immutable/singleton helpers and non-primitive services | values derived from a request |
| `derive` | transform, before validation | request values that intentionally do not depend on validated input | auth identity from unvalidated data |
| `resolve` | before handle, after validation | typed request-derived identity or resources | global singleton setup |

Additional rules:

- Register a context extension before routes that consume it.
- Mutate primitive state through `store.property`; destructuring a primitive loses the reference.
- Decorated values should normally be treated as immutable even though JavaScript permits mutation.
- Do not put ordinary pure helpers on context merely for convenience. Import them normally.
- Prefix or suffix plugin-owned decorators, stores, models, errors, and macros when names can collide.

## Macros

Use a macro when route metadata should install a reusable combination of lifecycle hooks, schemas, and resolved context.

Good uses include:

- `auth: true` that validates credentials, rejects unauthorized requests, and resolves a typed user.
- Role or permission checks configured per route.
- Repeated audit, cache, rate-limit, or response metadata behavior tied to a route option.

Prefer the object shorthand for boolean macros. Use a named single macro when the macro's own lifecycle needs to infer from a schema or resolved value in that same macro; TypeScript cannot always infer those relationships across a multi-macro object.

Return `status(...)` for expected macro failures. Macro lifecycle is deduplicated automatically by property value unless a custom seed is provided.

## Lazy and Deferred Plugins

Async callbacks and dynamic imports can register after startup. Use them only when startup cost justifies deferred availability.

- `await` the plugin if routes must exist before the server accepts traffic.
- In tests, `await app.modules` before calling deferred routes.
- Make readiness behavior explicit; a route that appears later can create intermittent 404s if startup is not coordinated.

## Composition Review

- Draw the instance tree and mark where every cross-cutting hook is registered.
- Verify each dependency is explicitly used by the instance that consumes it.
- Check name/seed identity for reusable configured plugins.
- Check scope, registration order, and route order together.
- Test one included route and one adjacent excluded route for every auth or policy boundary.
- Ensure stateful resources have startup, cleanup, and failure behavior appropriate to the deployment model.
