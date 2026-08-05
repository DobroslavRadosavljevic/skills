# Extension: database (Drizzle)

Load when Postgres (or SQL) schema and client live in a shared database package and feature services access DB through that client — not via ad-hoc connections in routes.

## Stance

**Schema ownership** = database package. **Query/transaction logic** = feature services (app modules or domain packages). Routes never import tables for business writes.

## Tree

```text
packages/<database>/
  src/schema/*.ts            # tables, relations
  src/…                      # DatabaseService / client factory (.make({ url }))

apps/<api>/src/
  runtime.ts                 # DatabaseService.make({ url: env.DATABASE_URL })
  modules/<feature>/services/*.service.ts
    # yield* DatabaseService (or inject client) — queries live here
```

## MUST

1. Add/change tables in the **database package**, then migrate/push with repo scripts.
2. Access DB from **services**, not from `routes/<action>.ts` handlers (beyond passing ids).
3. Construct the DB Layer once in app `runtime.ts` from validated env.
4. Keep auth-adapter / seed sync clients separate when the auth library needs its own drizzle instance — do not fork schema definitions.

## MUST NOT

1. `drizzle()` with `process.env.DATABASE_URL` inside a random feature package.
2. Copy-paste table definitions into API modules.
3. Run migrations from HTTP request handlers.

## Checklist

```text
Drizzle overlay:
- [ ] Schema change in packages/<database>
- [ ] Service uses DatabaseService / shared client
- [ ] Route stays free of table imports for writes
- [ ] runtime wires DB from env
```
