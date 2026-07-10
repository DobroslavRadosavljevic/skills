# Setup And Core Use

Use this reference for package setup, imports, parsing, type inference, and package variants.

## Package And Imports

- For application code on Zod 4, install `zod@^4.0.0` and usually import from the package root:

  ```ts
  import * as z from "zod";
  ```

- `zod@4.4.3` was the npm `latest` package on 2026-07-08.
- `zod/v4` remains a stable subpath, but the package root now exports Zod 4 in `zod@4`.
- Use `zod/mini` only when strict bundle-size pressure justifies the functional, tree-shakable API.
- Library authors that need to support both Zod and Zod Mini should import shared base classes and helpers from `zod/v4/core`.
- Libraries supporting both Zod 3 and Zod 4 commonly use a peer range like `^3.25.0 || ^4.0.0` and versioned subpaths: `zod/v3` and `zod/v4/core`.

## Parsing

- `schema.parse(input)` returns parsed output or throws `ZodError`.
- `schema.safeParse(input)` returns a discriminated result: `{ success: true, data }` or `{ success: false, error }`.
- `schema.parseAsync(input)` and `schema.safeParseAsync(input)` are required when any relevant refinement, transform, or codec path is async.
- Regular Zod and Zod Mini both expose parse methods on schema instances. Zod Core schemas do not; use top-level core helpers such as `z4.parse(schema, input)`.
- Zod parsing returns a strongly typed deep clone of the input.

Use `safeParse` at user-facing and recoverable boundaries. Use `parse` when invalid data means the caller or system contract is broken.

## Type Inference

- `z.infer<typeof Schema>` is equivalent to the schema output type.
- `z.output<typeof Schema>` names the parsed output type explicitly.
- `z.input<typeof Schema>` names the accepted input type.
- With plain validation schemas, input and output usually match.
- With `coerce`, `preprocess`, `transform`, `pipe`, `codec`, `default`, `prefault`, and `catch`, input and output can differ. Model the correct side at form, API, and storage boundaries.

Example:

```ts
const TrimmedLength = z.string().trim().transform((value) => value.length);

type TrimmedLengthInput = z.input<typeof TrimmedLength>;   // string
type TrimmedLengthOutput = z.output<typeof TrimmedLength>; // number
```

## Coercion

- `z.coerce.string()`, `z.coerce.number()`, `z.coerce.boolean()`, and `z.coerce.bigint()` use the corresponding JavaScript constructor.
- In Zod 4, `z.coerce.*` schemas default to `unknown` input type.
- Pass a generic only when the project has a real narrower input contract.
- Be careful with `z.coerce.boolean()`: JavaScript `Boolean("false")` is `true`.
- For string booleans from env/query params, prefer `z.stringbool()` or an explicit codec/refinement strategy rather than boolean coercion.

## Boundary Pattern

1. Define the narrowest schema that matches external input.
2. Parse at the boundary where trust changes: request body, route params, env vars, file contents, CLI flags, webhook payloads, persisted JSON, or form submission.
3. Export inferred output types for internal use only after parsing.
4. Preserve original input types where a form or adapter expects pre-parse values.
5. Test both valid and invalid inputs, especially when defaults, transformations, and unknown keys are involved.

## Zod Mini

- Import from `zod/mini`.
- Zod Mini uses top-level functions for most composition:

  ```ts
  import * as z from "zod/mini";

  const Schema = z.nullable(z.optional(z.string()));
  const Checked = z.string().check(z.minLength(3), z.trim());
  ```

- Zod Mini parse methods are available on schemas, but most refinement and wrapper APIs are functional.
- Zod Mini does not load the default English locale automatically. Configure it when human-readable errors matter:

  ```ts
  z.config(z.locales.en());
  ```

Use regular Zod unless bundle size is the dominant requirement.

## Zod Core

- `zod/v4/core` is for library authors and tooling.
- Core exports `$`-prefixed base classes such as `$ZodType`, `$ZodObject`, `$ZodString`, `$ZodError`, and check classes.
- Core schemas do not have instance methods like `.parse()` or `.min()`.
- Parse with top-level helpers from the core import.
- Introspect through `schema._zod.def`, understanding that internals are for tooling and can require defensive fallbacks.
