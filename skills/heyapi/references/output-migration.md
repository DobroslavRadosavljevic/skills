# Output Layout and Migration

## Default output shape

With defaults, an app often looks like:

```text
src/client/
  client/          # client bundle scaffolding
  core/            # shared runtime helpers
  client.gen.ts    # exported client instance
  index.ts         # re-exports (optional)
  sdk.gen.ts
  types.gen.ts
```

Plugins add files such as `zod.gen.ts`, `valibot.gen.ts`, or `react-query.gen.ts`. Exact layout depends on config.

### Rules

- Treat the folder as generated output / a dependency.
- Never commit hand-fixes inside `*.gen.ts`, `client/`, or `core/` — change the spec, parser, or plugins instead.
- Prefer importing from specific generated modules when entry re-exports cause ambiguity.
- Disable the entry file when unused:

```ts
output: {
  path: 'src/client',
  entryFile: false,
}
```

- Control entry re-exports per plugin with `includeInEntry: true` or a predicate.

## What to regenerate after

Regenerate when any of these change:

- OpenAPI paths, schemas, `operationId`s, or security schemes
- Client plugin or `throwOnError` / `runtimeConfigPath`
- SDK strategy, nesting, validator, or transformer settings
- Zod/Valibot options or TanStack Query option flags
- Input registry branch / version

Wire codegen into CI or a prebuild script so consumers never rely on stale clients.

## Versioning posture

- Package is in initial development (0.x). Pin exact versions.
- Read https://heyapi.dev/docs/openapi/typescript/migrating before upgrading across minors.
- Node 20 support was removed in v0.96 (minimum Node 22.13).
- CJS `require()` entry points were removed in v0.91 (ESM-only; dynamic `import()` if needed from CJS).

## Recent migration highlights (verify against current Migrating page)

These are orientation notes from the v0.91–v0.99 window — always confirm against the installed version's notes:

| Area | Change |
| --- | --- |
| Client `throwOnError` | Belongs on client plugins, not `@hey-api/sdk` |
| `runtimeConfigPath` | Resolves relative to output folder (v0.97) |
| Error interceptors | Receive previous interceptor result when chained (v0.97) |
| Request/response fields | Typed optional to match runtime (v0.97) |
| Validator request schemas | Separate layer exports; `requests.shouldExtract` for composites (v0.95) |
| Duplicate plugins | Configs merge instead of last-wins (v0.99) |
| Custom plugins | `plugin.symbols` → `plugin.imports`; Imports API (v0.99) |

## Fit / anti-fit

Hey API is a strong fit when:

- You maintain an OpenAPI contract long-term
- You want typed SDKs plus optional Zod/Valibot and TanStack Query from one pipeline
- Regenerating on spec change is acceptable

Poor fit when:

- The spec is broken or stale
- The integration is a one-off without a living contract
- An existing codegen workflow already works
- Zero build steps are required
- The target language is not yet supported (Python is upcoming, not the TypeScript path)

## Upgrade checklist

1. Read Migrating for every version between current and target.
2. Bump pinned `@hey-api/openapi-ts` (and client/vite plugins as needed).
3. Adjust config for renamed options (`throwOnError` location, Query option names, Zod request exports).
4. Regenerate and typecheck.
5. Smoke auth, error handling, and one query + one mutation path if those plugins are enabled.
6. Update CI Node version if still on Node 20.
