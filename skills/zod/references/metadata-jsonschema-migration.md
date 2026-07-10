# Metadata, JSON Schema, Mini, Core, And Migration

Use this reference for schema metadata, JSON Schema conversion, Zod Mini/Core, library authoring, and migration from Zod 3 to Zod 4.

## Metadata And Registries

- Zod metadata lives in registries.
- Create typed registries with `z.registry<Meta>()`.
- Registries support `.add(schema, metadata)`, `.get(schema)`, `.has(schema)`, `.remove(schema)`, and `.clear()`.
- `id` is special: duplicate `id` values in a registry throw.
- `.register(registry, metadata)` registers a schema and returns the original schema instance.
- `.meta(metadata)` registers in `z.globalRegistry` and returns a new schema instance.
- Calling `.meta()` without arguments retrieves global metadata for that exact schema instance.
- `.describe(text)` remains available but `.meta({ description })` is preferred.
- Zod methods are immutable. Metadata attached to one schema instance is not automatically attached to a later refined/transformed instance.

`z.globalRegistry` supports common fields such as `id`, `title`, `description`, `deprecated`, and custom fields. Use TypeScript declaration merging to add project-specific metadata fields.

## JSON Schema

- `z.toJSONSchema(schema)` converts Zod schemas to JSON Schema.
- Zod 4 added native JSON Schema conversion.
- `z.fromJSONSchema()` exists but is experimental and should not be treated as stable API.
- By default, `z.toJSONSchema()` represents output types.
- Use `{ io: "input" }` when the JSON Schema must describe accepted input, especially with pipes, defaults, coercion, or transforms.
- Default target is JSON Schema Draft 2020-12. Supported targets include Draft 4, Draft 7, Draft 2020-12, and OpenAPI 3.0.
- Metadata from registries, especially `z.globalRegistry`, is copied into JSON Schema output.
- For multiple interlinked schemas, pass a registry to `z.toJSONSchema()`. Schemas need registered `id` values to be emitted.
- Use `uri` to convert registry ids into external `$ref` URIs.
- Use `cycles: "ref"` or `cycles: "throw"` depending on whether cyclic schemas should become refs or fail conversion.
- Use `reused: "ref"` to extract reused schemas into `$defs`; default behavior inlines reused schemas.
- Use `override(ctx)` for custom emitted schema changes. Set `unrepresentable: "any"` if overriding unrepresentable Zod types.

Unrepresentable by default:

- `z.bigint()`
- `z.int64()`
- `z.symbol()`
- `z.undefined()`
- `z.void()`
- `z.date()`
- `z.map()`
- `z.set()`
- `z.transform()`
- `z.nan()`
- `z.custom()`

Object conversion notes:

- `z.object()` emits `additionalProperties: false` in output mode because Zod strips unknown keys.
- In input mode, plain `z.object()` does not set `additionalProperties`.
- `z.looseObject()` never sets `additionalProperties: false`.
- `z.strictObject()` always sets `additionalProperties: false`.

## Zod Mini

- Zod Mini is a functional, tree-shakable variant available from `zod/mini`.
- Prefer regular Zod unless strict bundle size is a requirement.
- Mini generally replaces chain methods with top-level wrapper functions and checks.
- Mini still provides parse methods on schema instances.
- Mini uses `.check()` and top-level checks such as `z.minLength()`, `z.maxLength()`, `z.trim()`, `z.toLowerCase()`, `z.refine()`, `z.meta()`, and `z.describe()`.
- Mini does not load the default locale automatically.

When writing examples for app developers, default to regular Zod. When reviewing Mini code, preserve Mini's functional style instead of rewriting to regular Zod unless bundle policy allows it.

## Zod Core And Library Authors

- If a library only accepts user-defined validation schemas as black boxes, consider Standard Schema compatibility before depending directly on Zod.
- If the library needs Zod-specific runtime internals, use peer dependency `"zod": "^3.25.0 || ^4.0.0"` when supporting both major versions.
- For simultaneous Zod 3 and Zod 4 support, import `zod/v3` and `zod/v4/core` subpaths.
- For simultaneous regular Zod and Zod Mini support, build against `zod/v4/core`.
- Do not import root `zod` inside a library that must support both Zod 3 and Zod 4; root exports depend on installed major version.
- Use generics like `T extends z4.$ZodType` to preserve subclass information.
- Do not type helpers as `z4.$ZodType<Output>` unless losing subclass detail is intentional.
- Use top-level core parse helpers because core schemas have no instance methods.
- Runtime detection between Zod 3 and Zod 4 can check for the `_zod` property.
- Zod 4 internals moved from `._def` to `._zod.def`; library code should handle unknown future schema and check types defensively.

## Zod 4 Migration Checks

High-impact changes to check during migration:

- Error customization uses unified `error`.
- Per-parse error maps no longer override schema-level errors.
- `ZodError.errors` is removed; use `.issues`.
- `z.treeifyError()`, `z.prettifyError()`, and `z.flattenError()` replace older error instance formatting methods.
- Top-level string format APIs replace deprecated method forms.
- `z.coerce.*` input type defaults to `unknown`.
- `.default()` short-circuits and expects output-type defaults.
- `.prefault()` recreates the old parse-the-default behavior.
- Defaults inside optional object fields are applied.
- `z.object().strict()` and `.passthrough()` are legacy; prefer `z.strictObject()` and `z.looseObject()`.
- `.deepPartial()` is removed.
- `.merge()` is deprecated; prefer `.extend()` or object spread.
- `z.nativeEnum()` is deprecated; use `z.enum()`.
- Array `.nonempty()` no longer infers a tuple type.
- `z.promise()` is deprecated.
- `z.function()` now uses `z.function({ input, output }).implement()` or `.implementAsync()`.
- `.refine()` no longer narrows from type predicates.
- `ctx.path` is no longer available in `superRefine`.
- `z.record()` requires key and value schemas.
- Enum-keyed records are exhaustive; use `z.partialRecord()` for partial maps.
- Intersections with unmergeable parsed results throw a regular `Error`.
- Internal `ZodEffects`, `ZodPreprocess`, and `ZodBranded` classes changed or disappeared; avoid relying on them in app code.

## Migration Verification

Run focused tests around:

- Error message precedence and issue formatting.
- Optional fields with defaults.
- Records with enum keys.
- Any use of `.merge()`, `.deepPartial()`, `.nativeEnum()`, `.function().args()`, `.returns()`, `.promise()`, and method string formats.
- Transform input/output types and JSON Schema output.
- Library support across `zod/v3`, `zod/v4/core`, regular Zod, and Zod Mini when relevant.
