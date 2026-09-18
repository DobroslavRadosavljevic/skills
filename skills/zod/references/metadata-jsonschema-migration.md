# Metadata, JSON Schema, Mini, Core, And Migration

Use this reference for schema metadata, JSON Schema conversion, Zod Mini/Core, library authoring, and migration from Zod 3 and from Zod 4.4.

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

Since 4.6, Classic schema members `.format`, `.minLength`, `.maxLength`, `.minValue`, `.maxValue`, `.isInt`, `.minDate`, and `.maxDate` are prototype getters that become own properties on first read. `Object.keys(schema)` / `Object.assign({}, schema)` only include members that have been read. Values use the same bound-fold as JSON Schema (tighter bound wins, not last writer).

## JSON Schema

- `z.toJSONSchema(schema)` converts Zod schemas to JSON Schema.
- `z.fromJSONSchema()` converts JSON Schema to Zod. It is **experimental** and not a stable API.
- By default, `z.toJSONSchema()` represents output types.
- Use `{ io: "input" }` when the JSON Schema must describe accepted input, especially with pipes, defaults, coercion, or transforms.
- Default target is JSON Schema Draft 2020-12. Supported targets include Draft 4, Draft 7, Draft 2020-12, and OpenAPI 3.0.
- Metadata from registries, especially `z.globalRegistry`, is copied into JSON Schema output and **wins over generated keywords**.
- For multiple interlinked schemas, pass a registry to `z.toJSONSchema()`. Schemas need registered `id` values to be emitted.
- Use `uri` to convert registry ids into external `$ref` URIs.
- Use `cycles: "ref"` or `cycles: "throw"` depending on whether cyclic schemas should become refs or fail conversion.
- Use `reused: "ref"` to extract reused schemas into `$defs`; default behavior inlines reused schemas.
- Use `override(ctx)` to mutate `ctx.jsonSchema` in place. `override` runs before the unrepresentable error.
- `unrepresentable` may be `"throw"` (default), `"any"` (`{}`), or a function `({ zodSchema, path, message }) => JSONSchema | "throw" | "any"`. Unrepresentable default values go through the same handler.

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
- `z.number().multipleOf(0)`

String format mapping (via `format` unless noted): `email`, `date-time`, `date`, `duration`, `ipv4`, `ipv6`, `uuid` (also `guid`), `uri` (`z.url()`). `z.base64()` uses `contentEncoding: "base64"`. `local: true` and `precision: -1` datetimes fall back to `pattern`. Other formats (`time`, `base64url`, `cuid`, `emoji`, `nanoid`, `cuid2`, `ulid`, CIDR, `mac`, `currencyCode`, hashes, IBAN, credit cards) use `pattern`.

Object conversion notes:

- `z.object()` emits `additionalProperties: false` in output mode because Zod strips unknown keys.
- In input mode, plain `z.object()` does not set `additionalProperties`.
- `z.looseObject()` never sets `additionalProperties: false`.
- `z.strictObject()` always sets `additionalProperties: false`.

`fromJSONSchema()` since 4.6 enforces `minProperties` / `maxProperties` (own keys), `uniqueItems` (structural), `contains`, and `minContains` / `maxContains`. Also accepts `format: "hostname"`. Still experimental.

Since 4.6, chained checks are folded as a conjunction in `toJSONSchema()` (and the Classic bound getters). Order no longer overwrites tighter `.min()` / `.max()` with a later format range; repeated `multipleOf` keeps every divisor; `z.string().min(8).length(5)` no longer emits a widened `minLength`.

## Zod Mini

- Zod Mini is a functional, tree-shakable variant available from `zod/mini` (and as `@zod/mini` since 4.5, lockstep with `zod`).
- Prefer regular Zod unless strict bundle size is a requirement.
- Mini generally replaces chain methods with top-level wrapper functions and checks.
- Mini still provides parse methods on schema instances.
- Mini uses `.check()` and top-level checks such as `z.minLength()`, `z.maxLength()`, `z.trim()`, `z.toLowerCase()`, `z.refine()`, `z.meta()`, and `z.describe()`.
- Mini does not load the default locale automatically.
- Mini cyclical input requires `z.config({ memoizer: z.memoizer() })` before schema construction.

When writing examples for app developers, default to regular Zod. When reviewing Mini code, preserve Mini's functional style instead of rewriting to regular Zod unless bundle policy allows it.

## Zod Core And Library Authors

- If a library only accepts user-defined validation schemas as black boxes, consider Standard Schema compatibility before depending directly on Zod.
- New libraries (and new majors of existing libraries) should peer `"zod": "^4.0.0"`. Zod 3 is functionally end-of-life.
- If an existing library must keep Zod 3 users, use peer `"zod": "^3.25.0 || ^4.0.0"` and import `zod/v3` plus `zod/v4/core`.
- For simultaneous regular Zod and Zod Mini support, build against `zod/v4/core`.
- Do not import root `zod` inside a library that must support both Zod 3 and Zod 4; root exports depend on installed major version.
- Do not import `zod/v4` or `zod/mini` from a library that must support both Classic and Mini.
- Use generics like `T extends z4.$ZodType` to preserve subclass information.
- Do not type helpers as `z4.$ZodType<Output>` unless losing subclass detail is intentional.
- Use top-level core parse helpers (`parse`, `safeParse`, `validate`, `encode`, `decode`) because core schemas have no instance methods.
- Runtime detection between Zod 3 and Zod 4 can check for the `_zod` property.
- Zod 4 internals moved from `._def` to `._zod.def`; library code should handle unknown future schema and check types defensively. New first-party types (MAC, credit card, IBAN, hash, currency, …) are not a breaking change — `default` should warn and fall back, not throw.
- Compile internals are not part of the `zod/v4/core` public export. Do not depend on them.

## Zod 4 Migration Checks

High-impact changes to check during a Zod 3 → 4 migration:

- Error customization uses unified `error`.
- Per-parse error maps no longer override schema-level errors.
- `ZodError.errors` is removed; use `.issues`.
- `z.treeifyError()`, `z.prettifyError()`, and `z.flattenError()` replace older error instance formatting methods.
- Top-level string format APIs replace deprecated method forms.
- `z.coerce.*` input type defaults to `unknown`. Missing coerced object keys error unless `.default()` is set.
- `.default()` short-circuits and expects output-type defaults.
- `.prefault()` recreates the old parse-the-default behavior.
- Defaults inside optional object fields are applied.
- `z.object().strict()` and `.passthrough()` are legacy; prefer `z.strictObject()` and `z.looseObject()`.
- `.deepPartial()` as a **method** is removed. Use `z.deepPartial(schema)` (restored in 4.5 as a function).
- `.merge()` is deprecated; prefer `.extend()` or object spread. `.merge()` throws if the receiver has refinements.
- `z.nativeEnum()` is deprecated; use `z.enum()`.
- Array `.nonempty()` no longer infers a tuple type.
- `z.promise()` is deprecated.
- `z.function()` now uses `z.function({ input, output }).implement()` or `.implementAsync()`.
- `.refine()` no longer narrows from type predicates.
- `ctx.path` is no longer available in `superRefine`.
- `z.record()` requires key and value schemas (the v3 single-argument form works again since 4.4).
- Enum-keyed records are exhaustive; use `z.partialRecord()` for partial maps.
- Intersections with unmergeable parsed results throw a regular `Error`.
- Internal `ZodEffects`, `ZodPreprocess`, and `ZodBranded` classes changed or disappeared; avoid relying on them in app code.
- `z.cuid()` (CUID v1) is deprecated; prefer `z.cuid2()`.

## 4.4 → 4.5 / 4.6 Soundness

Upgrading from `zod@4.4.3` to `4.6.5` can reject previously accepted input. Recheck:

- `z.iso.datetime()` / `{ offset: true }` require seconds when `Z` or an offset is present.
- String length counts code points (emoji `.min()` / `.max()` / `.length()`).
- `z.ipv6()`, `z.ulid()`, `z.httpUrl()` host length, `z.emoji()` (no component-only strings as of 4.6).
- Record keys vs object intersections (pattern records no longer invalidate declared object keys).
- `__proto__` always stripped.
- Numeric `z.enum(TSEnum).options` no longer includes reverse mappings (4.6).
- `fromJSONSchema()` now enforces property-count / uniqueItems / contains keywords it used to ignore.
- JSON Schema bound folding: chained `.min().max().int()` keeps the tighter bounds.
- `z.email()` pattern string changed (no lookaheads); `issue.pattern` and emitted JSON Schema `pattern` differ. Runtime accept/reject for emails is the same.
- `safeParse` error maps run on first `error` read (4.6).
- Method plucking (`const { parse } = schema`) still works, but methods are lazy-bound (4.5 memory work). Prefer calling on the instance.

## Migration Verification

Run focused tests around:

- Error message precedence, lazy `safeParse` error maps, and issue formatting.
- Optional fields with defaults; `undefined` prefaults.
- Records with enum keys; object ∩ pattern-record intersections.
- Datetime second precision, string code-point lengths, emoji, ULID, IPv6.
- Any use of `.merge()`, `.deepPartial()` as a method, `.nativeEnum()`, `.function().args()`, `.returns()`, `.promise()`, and method string formats.
- Transform input/output types, codecs, and JSON Schema output (including chained min/max).
- Compiled vs uncompiled parse/validate on hot schemas.
- Library support across `zod/v3`, `zod/v4/core`, regular Zod, and Zod Mini when relevant.
