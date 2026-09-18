# Effects And Errors

Use this reference for refinements, checks, transforms, codecs, defaults, and error handling.

## Refinements

- `.refine(predicate, params)` adds custom validation.
- Refinement functions should not throw. Return falsy for validation failure.
- Zod 4 refinements no longer narrow inferred types when written as TypeScript type predicates.
- Use `error` for messages, not the old Zod 3 `message` convention when writing new code.
- Use `abort: true` to stop later checks after a failed refinement.
- Use `path` to attach a refinement issue to a specific object field.
- Async refinements require `parseAsync`, `safeParseAsync`, or `validateAsync`.
- The `when` parameter can force a refinement to run only when a relevant subset has parsed successfully. Use it sparingly. Checks with custom `when` cannot be compiled.

```ts
const PasswordForm = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });
```

## `.superRefine()` And `.check()`

- `.superRefine((value, ctx) => ...)` can add multiple issues and use internal issue codes. Still works; Classic docs mark it deprecated in favor of `.check()`.
- In Zod 4, `ctx.path` is no longer available in `superRefine`.
- `.check()` is the lower-level API (also used by Zod Mini). Prefer it for structured multi-issue validation and performance-sensitive paths.
- Transforms support `ctx.addIssue()` in addition to pushing onto `ctx.issues`.
- Zod Mini uses `.check()` plus top-level checks for most refinements.

Prefer `.refine()` for simple predicates, `.check()` (or `.superRefine()` in existing code) for multiple structured issues.

## Transforms, Pipes, And Preprocess

- `z.transform(fn)` creates a unidirectional transform that accepts arbitrary input.
- `schema.transform(fn)` is a regular Zod convenience for piping a schema into a transform.
- Transform functions should not throw. Add issues through `ctx.issues` / `ctx.addIssue()` and return `z.NEVER` when a transform must fail without changing the inferred output type.
- Async transforms require `parseAsync` or `safeParseAsync`.
- `.pipe()` chains schemas and is useful after initial validation.
- `z.preprocess(fn, schema)` transforms before validating with the target schema.
- `z.preprocess()` defaults to `unknown` input. Annotate the preprocessor parameter when a form library or adapter needs a narrower `z.input<>`.

## Codecs

- Codecs were introduced in `zod@4.1`.
- Use `z.codec(inputSchema, outputSchema, { decode, encode })` for bidirectional transformations.
- `.parse()` and `.decode()` perform the forward input-to-output direction.
- `.encode()` performs the reverse output-to-input direction.
- `z.decode()` and `z.encode()` have strongly typed inputs, unlike `.parse()` which accepts `unknown`.
- Async, safe, and async-safe codec variants are available.
- `z.invertCodec(codec)` swaps input and output schemas plus decode and encode transforms. It does not recursively invert nested codecs.
- `z.encode()` cannot pass through unidirectional `.transform()` schemas. It throws a runtime error if a transform exists in the encode path.
- Encoding always uses the standard parser, even on compiled schemas.
- Defaults, prefaults, and catch values apply only in the forward direction.
- Checks still run in both directions. Mutating string checks such as `.trim()` apply in both directions.
- `z.stringbool()` is implemented as a codec. Encode uses the first `truthy` / `falsy` string when those arrays are customized.

Use codecs for network and persistence boundaries where a value must round-trip between JSON-friendly and richer JavaScript forms. Copy/paste recipes (not first-class APIs) live in the official codecs page: `stringToNumber`, `stringToInt`, `stringToBigInt`, `numberToBigInt`, `isoDatetimeToDate`, `epochSecondsToDate`, `epochMillisToDate`, `json(schema)`, `utf8ToBytes` / `bytesToUtf8`, `base64ToBytes`, `base64urlToBytes`, `hexToBytes`, `stringToURL`, `stringToHttpURL`, `uriComponent`.

### Runtime `z.input()` / `z.output()`

Since 4.5 these are runtime schema projectors, not only type helpers. They replace every pipe/codec with its input or output side — useful for nested codecs where `.in` / `.out` cannot reach.

```ts
z.input(Event).parse({ name: "launch", at: "2024-01-01T00:00:00Z" });
z.output(Event).parse({ name: "launch", at: new Date() });
```

No-op on schemas without codecs/pipes. `z.output()` on a one-way transform returns the transform (validates nothing). `z.input()` on preprocess returns the schema the preprocessor feeds. With a codec underneath, `z.input()` drops `.default()` / `.catch()` and `z.output()` drops `.prefault()`.

## Defaults, Prefaults, And Catch

- `.default(valueOrFactory)` short-circuits when input is `undefined`; the default must match the output type.
- `.prefault(value)` supplies a pre-parse fallback when input is `undefined`; the prefault must match the input type and still runs through parsing and transforms. Since 4.6.2, `undefined` prefault outputs and object keys are preserved.
- `.catch(valueOrFactory)` returns a fallback when validation fails. Constant `.catch(value)` can compile; a callback cannot.
- In catch factories, regular Zod receives the caught `ZodError`; Zod Mini exposes input value and issues.

Choose `.default()` for already-parsed fallback output. Choose `.prefault()` when the fallback must still be trimmed, transformed, validated, or refined.

## Error Customization

- Zod 4 standardizes error customization under the `error` parameter. A string argument to factories (`z.string("Bad!")`) is the same as `{ error: "Bad!" }`.
- Precedence, highest first: check-level `error` → schema-level `error` (covers that schema's own checks) → per-parse `error` → `z.config({ customError })` → locale map.
- Error map functions can return a string, an object with `message`, or `undefined` to yield to the next error map.
- The issue object includes `code`, `input`, `inst`, `path`, and `schema`. `iss.schema` is always the owning schema even when a check originated the issue — use it to read registry metadata. Additional fields depend on the issue type.
- `reportInput: true` includes raw input in issues. Avoid it when errors may be logged with sensitive data.

Since **4.6**, `safeParse()` constructs `error` lazily. Locale, global, and schema error maps run when `result.error` is first read, not at parse time. Swapping `z.config()` between parse and read uses the newer config. An error map with a side effect never runs if nothing reads the error. Throwing `.parse()` is unchanged.

```ts
const result = schema.safeParse(12);
z.config(z.locales.fr());
result.error.issues[0].message; // French in 4.6, English in 4.5
```

Deprecated or removed Zod 3 patterns:

- `message` params are deprecated in favor of `error`.
- `invalid_type_error` and `required_error` are dropped.
- `errorMap` is renamed to `error`.
- `ZodError.errors` is removed; use `.issues`.
- `ZodError.format()` and `.flatten()` are deprecated; use top-level formatting helpers.

## Error Formatting

- `z.treeifyError(error)` returns a nested tree that mirrors the schema and is useful for nested forms and arrays.
- `z.prettifyError(error)` returns a human-readable string.
- `z.flattenError(error)` returns top-level `formErrors` and field-level `fieldErrors`, useful for flat forms.
- `z.formatError(error)` is deprecated; use `z.treeifyError()`.

## Locales

- Regular `zod` loads the English locale automatically.
- Zod Mini defaults to generic messages until a locale is configured.
- Configure a locale with `z.config(z.locales.en())` or `import { en } from "zod/locales"`.
- Dynamic locale imports can keep bundles smaller (`zod/v4/locales/${locale}.js`).
- `import * as z from "zod"` tree-shakes unused `z.locales.*` in Rollup/Webpack. esbuild cannot — avoid `import { z } from "zod"` there.
- Locales added since 4.4.3 include `bn`, `ckb`, `hi`, `kn`, `nn`, `ptBR`, `sk`, `tk` (4.5) and `tg` (4.6.1). Full list: `ar`, `az`, `be`, `bg`, `bn`, `ca`, `ckb`, `cs`, `da`, `de`, `el`, `en`, `eo`, `es`, `fa`, `fi`, `fr`, `frCA`, `gu`, `he`, `hi`, `hr`, `hu`, `hy`, `id`, `is`, `it`, `ja`, `ka`, `km`, `kn`, `ko`, `lt`, `mk`, `ms`, `ne`, `nl`, `nn`, `no`, `ota`, `ps`, `pl`, `pt`, `ptBR`, `ro`, `ru`, `sk`, `sl`, `sv`, `ta`, `tg`, `th`, `tk`, `tr`, `uk`, `ur`, `uz`, `vi`, `zhCN`, `zhTW`, `yo`.
