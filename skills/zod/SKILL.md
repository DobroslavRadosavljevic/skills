---
name: zod
description: "Build, review, debug, migrate, or plan Zod v4 validation and TypeScript schema code with current docs. Use for zod@4.6, zod/mini, @zod/mini, zod/v4/core, z.compile, z.withParser, z.validate, parse, safeParse, parseAsync, z.infer, z.input, z.output, z.toZod, codecs, objects, records, enums, unions, refinements, check, transforms, preprocess, defaults, prefaults, catch, brands, error customization, metadata, registries, z.toJSONSchema, z.fromJSONSchema, string formats (email, uuid, hash, mac, creditCard, iban, currencyCode), Zod Mini, library-author APIs, and Zod 3 to Zod 4 migrations."
---

# Zod

Use this skill when work touches Zod validation, schema design, type inference, error handling, JSON Schema, AOT compilation, Zod Mini, Zod Core, or Zod 3 to Zod 4 migration.

Snapshot: `zod@4.6.5` / `@zod/mini@4.6.5` (2026-09-18). Stay on Zod 4 `latest`. Do not use canary. Refresh from [source-map.md](references/source-map.md) if versions differ.

## Workflow

1. Inspect the local Zod surface before changing code:
   - Package versions for `zod`, optional `@zod/mini`, validation adapters, form libraries, API layers, code generators, and TypeScript.
   - Imports: `zod`, `zod/v4`, `zod/mini`, `@zod/mini`, `zod/v4/core`, `zod/compile`, or `zod/v3`.
   - Schema role: untrusted boundary validation, API contract, form values, environment parsing, persistence, JSON Schema/OpenAPI, hot-path compile, library integration, or migration.
   - Type flow: where `z.input<>`, `z.output<>`, and `z.infer<>` are consumed, especially around transforms, codecs, coercion, defaults, and preprocessors.
2. Refresh docs when the user asks for latest/current behavior, the installed version is unclear, or the work touches migration-sensitive APIs. Start from [source-map.md](references/source-map.md).
3. For installation, imports, parse/`validate`/`compile`, inference, package variants, and boundary design, use [setup-core.md](references/setup-core.md).
4. For schema primitives, string formats, objects, records, arrays, unions, recursive schemas, functions, brands, `z.toZod`, and instance property checks, use [schema-api.md](references/schema-api.md).
5. For refinements, `.check()`, transforms, pipes, preprocess, codecs, defaults, prefaults, catch values, and errors, use [effects-errors.md](references/effects-errors.md).
6. For metadata, registries, JSON Schema conversion, Zod Mini, Zod Core, library-author support, and Zod 4 / 4.5 / 4.6 migration checks, use [metadata-jsonschema-migration.md](references/metadata-jsonschema-migration.md).
7. Implement in the existing project style:
   - Match local import conventions unless a version boundary requires a different subpath.
   - Prefer explicit boundary schemas over broad `z.any()` or unchecked casts.
   - Keep parsing and transformation behavior visible at API, form, environment, and storage boundaries.
   - Do not introduce canary-only behavior. npm `canary` is stale relative to `latest`.

## Zod Judgment

- Treat schemas as runtime contracts, not just TypeScript type factories.
- Use `safeParse` for recoverable user/input failures and `parse` when invalid data is exceptional.
- Use `.validate()` / `z.validate()` when you only need a boolean type guard and do not want a `ZodError`.
- Use `parseAsync`, `safeParseAsync`, or `validateAsync` whenever any refinement, transform, or codec path is async.
- Distinguish `z.input<>` from `z.output<>` when using `coerce`, `preprocess`, `transform`, `pipe`, `codec`, `default`, `prefault`, or `catch`. Runtime `z.input(schema)` / `z.output(schema)` project codec/pipe halves.
- Prefer top-level Zod 4 string format APIs (`z.email()`, `z.uuid()`, `z.hash("sha256")`, `z.creditCard()`, `z.iban()`, `z.iso.datetime()`) over deprecated method forms when writing new code.
- Remember that `z.object()` strips unknown keys by default; use `z.strictObject()`, `z.looseObject()`, or `.catchall()` deliberately. `__proto__` is always stripped.
- For enum-keyed records, Zod 4 checks exhaustiveness. Use `z.partialRecord()` for optional enum-keyed maps.
- Prefer object spread or `.extend()` for object composition; use `.safeExtend()` when extending schemas with refinements.
- Use codecs for bidirectional serialization and transforms for one-way parsing.
- Compile hot object/array/union paths with `z.compile()` (or `import "zod/compile"` in apps). Compile the final schema. Do not compile in libraries.
- Validate class instances in place with `z.instanceof(C).properties({ ... })`, not `z.object()`.
- For library authors, use `zod/v4/core` and top-level parse helpers when supporting both Zod and Zod Mini. New libraries should peer on `zod@^4.0.0` only.

## Verification

Prefer the repo's existing checks. For meaningful Zod work, include the relevant subset:

- Typecheck for inferred input/output types, schema composition, brands, `z.toZod<T>()`, and library generic constraints.
- Focused tests for valid input, invalid input, unknown keys, defaults/prefaults, transforms, codecs, async paths, and error paths.
- Runtime smoke for boundary parsers such as API handlers, env loaders, forms, server actions, CLIs, and persistence adapters.
- Compile checks on hot schemas: valid inputs stay fast; invalid inputs still produce the same issues; derived schemas (`.extend()`, `.refine()`) are recompiled if they need the fast path.
- Snapshot or contract tests for JSON Schema/OpenAPI output when schema metadata or conversion behavior changes.
- Migration checks for deprecated Zod 3 APIs, 4.5/4.6 soundness fixes (datetime seconds, string code points, `z.emoji()`, JSON Schema bounds), object defaults, enum records, functions, and removed internals.
