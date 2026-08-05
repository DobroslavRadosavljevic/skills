# Extension: env ownership

Load when the Start app validates environment with a shared `createEnv` helper (or equivalent), including `VITE_` (or similar) client keys.

## Stance

The Start app owns `.env` / `.env.example` and `src/env.ts`. Workspace packages receive options — they do not read `process.env` in library code.

## MUST

1. **`src/env.ts`** uses `createEnv` with `clientPrefix` for browser-exposed keys.
2. Wire **`import.meta.env`** (and server `process.env` when needed) into `runtimeEnv`.
3. **Server-only keys must not leak** to the client bundle; client code only imports client/shared values.
4. Pass URLs/secrets into auth clients and generated API client config from `env`, not scattered `import.meta.env` reads.

## Tree

```text
apps/<web>/
  .env · .env.example
  src/env.ts
```

## MUST NOT

1. Reading raw `import.meta.env.VITE_*` all over modules when `env.ts` exists.
2. Putting server secrets in `client:` env schema.

## Checklist

```text
Env overlay:
- [ ] src/env.ts is the validated source
- [ ] clientPrefix + runtimeEnv wired
- [ ] Packages take options; no process.env in libs
- [ ] .env.example updated
```
