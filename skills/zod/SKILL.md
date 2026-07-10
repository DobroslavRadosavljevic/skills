---
name: zod
description: "Build, review, debug, migrate, or plan Zod v4 validation and TypeScript schema code with current docs. Use for zod, zod/v4, zod/mini, zod/v4/core, parse, safeParse, parseAsync, safeParseAsync, z.infer, z.input, z.output, object schemas, records, enums, unions, refinements, check, transforms, codecs, preprocess, defaults, prefaults, catch, brands, readonly, error customization, error formatting, metadata, registries, JSON Schema, Zod Mini, library-author APIs, and Zod 3 to Zod 4 migrations."
---

# Zod

Use this skill when work touches Zod validation, schema design, type inference, error handling, JSON Schema output, Zod Mini, Zod Core, or Zod 3 to Zod 4 migration.

## Workflow

1. Inspect the local Zod surface before changing code:
   - Package versions for `zod`, validation adapters, form libraries, API layers, code generators, and TypeScript.
   - Imports: `zod`, `zod/v4`, `zod/mini`, `zod/v4/core`, or `zod/v3`.
   - Schema role: untrusted boundary validation, API contract, form values, environment parsing, persistence, JSON Schema/OpenAPI generation, library integration, or migration.
   - Type flow: where `z.input<>`, `z.output<>`, and `z.infer<>` are consumed, especially around transforms, codecs, coercion, defaults, and preprocessors.
2. Refresh docs when the user asks for latest/current behavior, the installed version is unclear, or the work touches migration-sensitive APIs. Start from [source-map.md](references/source-map.md).
3. For installation, imports, parse methods, inference, package variants, and boundary design, use [setup-core.md](references/setup-core.md).
4. For schema primitives, strings, numbers, objects, records, arrays, unions, recursive schemas, functions, brands, and readonly schemas, use [schema-api.md](references/schema-api.md).
5. For refinements, `.check()`, transforms, pipes, preprocess, codecs, defaults, prefaults, catch values, and errors, use [effects-errors.md](references/effects-errors.md).
6. For metadata, registries, JSON Schema conversion, Zod Mini, Zod Core, library-author support, and Zod 4 migration checks, use [metadata-jsonschema-migration.md](references/metadata-jsonschema-migration.md).
7. Implement in the existing project style:
   - Match local import conventions unless a version boundary requires a different subpath.
   - Prefer explicit boundary schemas over broad `z.any()` or unchecked casts.
   - Keep parsing and transformation behavior visible at API, form, environment, and storage boundaries.
   - Do not introduce canary-only behavior unless the project explicitly uses canary Zod.

## Zod Judgment

- Treat schemas as runtime contracts, not just TypeScript type factories.
- Use `safeParse` for recoverable user/input failures and `parse` when invalid data is exceptional.
- Use `parseAsync` or `safeParseAsync` whenever any refinement, transform, or codec path is async.
- Distinguish `z.input<>` from `z.output<>` when using `coerce`, `preprocess`, `transform`, `pipe`, `codec`, `default`, `prefault`, or `catch`.
- Prefer top-level Zod 4 string format APIs such as `z.email()`, `z.uuid()`, and `z.iso.datetime()` over deprecated method forms when writing new code.
- Remember that `z.object()` strips unknown keys by default; use `z.strictObject()`, `z.looseObject()`, or `.catchall()` deliberately.
- For enum-keyed records, Zod 4 checks exhaustiveness. Use `z.partialRecord()` for optional enum-keyed maps.
- Prefer object spread or `.extend()` for object composition; use `.safeExtend()` when extending schemas with refinements.
- Use codecs for bidirectional serialization and transforms for one-way parsing.
- For library authors, use `zod/v4/core` and top-level parse helpers when supporting both Zod and Zod Mini.

## Verification

Prefer the repo's existing checks. For meaningful Zod work, include the relevant subset:

- Typecheck for inferred input/output types, schema composition, brands, and library generic constraints.
- Focused tests for valid input, invalid input, unknown keys, defaults/prefaults, transforms, async paths, and error paths.
- Runtime smoke for boundary parsers such as API handlers, env loaders, forms, server actions, CLIs, and persistence adapters.
- Snapshot or contract tests for JSON Schema/OpenAPI output when schema metadata or conversion behavior changes.
- Migration checks for deprecated Zod 3 APIs, changed error customization, object defaults, enum records, functions, and removed internals.
