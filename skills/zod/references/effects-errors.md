# Effects And Errors

Use this reference for refinements, checks, transforms, codecs, defaults, and error handling.

## Refinements

- `.refine(predicate, params)` adds custom validation.
- Refinement functions should not throw. Return falsy for validation failure.
- Zod 4 refinements no longer narrow inferred types when written as TypeScript type predicates.
- Use `error` for messages, not the old Zod 3 `message` convention when writing new code.
- Use `abort: true` to stop later checks after a failed refinement.
- Use `path` to attach a refinement issue to a specific object field.
- Async refinements require `parseAsync` or `safeParseAsync`.
- The `when` parameter can force a refinement to run only when a relevant subset has parsed successfully. Use it sparingly.

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

- `.superRefine((value, ctx) => ...)` can add multiple issues and use internal issue codes.
- In Zod 4, `ctx.path` is no longer available in `superRefine`.
- `.check()` is a lower-level API that can be faster in performance-sensitive paths but is more verbose.
- Zod Mini uses `.check()` plus top-level checks for most refinements.

Prefer `.refine()` for simple predicates, `.superRefine()` for multiple structured issues, and `.check()` only when the lower-level control is worth the complexity.

## Transforms, Pipes, And Preprocess

- `z.transform(fn)` creates a unidirectional transform that accepts arbitrary input.
- `schema.transform(fn)` is a regular Zod convenience for piping a schema into a transform.
- Transform functions should not throw. Add issues through `ctx.issues` and return `z.NEVER` when a transform must fail without changing the inferred output type.
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
- `z.invertCodec(codec)` swaps input and output schemas plus decode and encode transforms.
- `z.encode()` cannot pass through unidirectional `.transform()` schemas. It throws a runtime error if a transform exists in the encode path.
- Defaults, prefaults, and catch values apply only in the forward direction.

Use codecs for network and persistence boundaries where a value must round-trip between JSON-friendly and richer JavaScript forms.

## Defaults, Prefaults, And Catch

- `.default(valueOrFactory)` short-circuits when input is `undefined`; the default must match the output type.
- `.prefault(value)` supplies a pre-parse fallback when input is `undefined`; the prefault must match the input type and still runs through parsing and transforms.
- `.catch(valueOrFactory)` returns a fallback when validation fails.
- In catch factories, regular Zod receives the caught `ZodError`; Zod Mini exposes input value and issues.

Choose `.default()` for already-parsed fallback output. Choose `.prefault()` when the fallback must still be trimmed, transformed, validated, or refined.

## Error Customization

- Zod 4 standardizes error customization under the `error` parameter.
- Schema-level `error` has the highest precedence.
- Per-parse `error` has lower precedence than schema-level customization.
- Global `z.config({ customError })` has lower precedence than per-parse customization.
- Locale error maps are lowest priority.
- Error map functions can return a string, an object with `message`, or `undefined` to yield to the next error map.
- The issue object includes fields such as `code`, `input`, `inst`, and `path`, with additional fields depending on the issue type.
- `reportInput: true` includes raw input in issues. Avoid it when errors may be logged with sensitive data.

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
- Configure a locale with `z.config(z.locales.en())` or import a specific locale.
- Dynamic locale imports can keep bundles smaller.
