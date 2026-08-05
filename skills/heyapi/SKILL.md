---
name: heyapi
description: "Build, configure, review, debug, migrate, or plan Hey API (@hey-api/openapi-ts) OpenAPI-to-TypeScript codegen with current docs. Use for openapi-ts, defineConfig, generated SDKs, types, Fetch/Axios/Next/Nuxt/Ky clients, Zod/Valibot validators, TanStack Query plugins, vite-plugin, client.setConfig, auth, interceptors, throwOnError, registry inputs, and regenerating clients from OpenAPI specs."
---

# Hey API

Use this skill when work touches Hey API / `@hey-api/openapi-ts`: generating TypeScript clients from OpenAPI, configuring plugins, wiring HTTP clients, validators, TanStack Query artifacts, or regenerating API layers.

## Workflow

1. Inspect the local Hey API surface before changing code:
   - Package versions for `@hey-api/openapi-ts`, `@hey-api/vite-plugin`, client packages, validators (`zod` / `valibot`), and TanStack Query.
   - Config file: `openapi-ts.config.ts` (or `.js` / `.mjs` / `.cjs`) and any Vite plugin integration.
   - Spec input: local path, remote URL, registry shorthand (`hey-api/...`, `scalar:...`, `readme:...`), or inline object.
   - Output folder contents (`*.gen.ts`, `client/`, `core/`) and whether consumers import from `index.ts` or specific generated files.
   - Runtime wiring: `client.setConfig`, `runtimeConfigPath` / `createClientConfig`, auth, interceptors, per-call `client` overrides.
2. Refresh docs when the user asks for latest behavior, the installed version is unclear, or the work touches migrations, plugin APIs, or Node/runtime requirements. Start from [source-map.md](references/source-map.md).
3. For install, CLI, `defineConfig`, input/output, multi-job configs, and Vite, use [setup-config.md](references/setup-config.md).
4. For HTTP clients, SDK shapes, auth, interceptors, `throwOnError`, and consuming generated functions, use [clients-sdk.md](references/clients-sdk.md).
5. For Zod/Valibot, TanStack Query, transformers/validators, and web-framework plugins, use [plugins-validators.md](references/plugins-validators.md).
6. For output layout, entry exports, and breaking-change checks, use [output-migration.md](references/output-migration.md).
7. Implement in the existing project style:
   - Prefer regenerating over hand-editing `*.gen.ts` or bundled `client/` / `core/` scaffolding.
   - Compose only the plugins the app needs; defaults already emit TypeScript + SDK (Fetch).
   - Pin `@hey-api/openapi-ts` to an exact version unless the project deliberately tracks a range.
   - Prefer `bun` / `bunx` in command examples when adding scripts.

## Judgment

- Treat the OpenAPI spec as the contract. Fix or regenerate from the spec; do not paper over drift with local edits to generated files.
- Treat the output folder as a dependency. Changes there are erased on the next codegen run.
- Default client is Fetch (`@hey-api/client-fetch`). Pick Axios, Ky, Next.js, Nuxt, OFetch, or Angular only when the runtime needs them.
- SDK responses are typically `{ data, error }` unless `throwOnError` is enabled on the **client** plugin (not the SDK plugin).
- Enable SDK `validator` / `transformer` only when runtime validation or transformation is intentional; it has a cost and pulls in the validator plugin.
- For React Query, prefer spreading generated `*Options()` / `*Mutation()` helpers into `useQuery` / `useMutation` rather than re-wrapping SDK calls by hand.
- Watch mode supports remote URL inputs; do not assume local-file watch works.
- Requires Node.js 22+ (22.13+ for recent releases). Package is ESM-only since v0.91.
- Python codegen is not production-ready yet; keep this skill focused on TypeScript `@hey-api/openapi-ts`.

## Verification

Prefer the repo's existing checks. For meaningful Hey API work, include the relevant subset:

- Regenerate with the project's `openapi-ts` script and confirm a clean diff policy for generated output.
- Typecheck consumers of SDK functions, query options, and Zod/Valibot schemas.
- Smoke one success path and one error path (`data` vs `error`, or thrown errors if `throwOnError`).
- Confirm `baseUrl` / `baseURL` (client-specific), auth, and interceptors against a real or mocked endpoint.
- After upgrades, read [Migrating](https://heyapi.dev/docs/openapi/typescript/migrating) for the crossed versions before merging.
