# Setup And Core Use

Use this reference for package setup, imports, parsing, `validate`, `compile`, type inference, and package variants.

## Package And Imports

- Target **Zod 4 `latest`**: `zod@4.6.5` on 2026-09-18. Stay on Zod 4. Do not use canary (`canary` was `4.5.0-canary.20260828T171753`, behind `latest`).
- For application code, install and import from the package root:

  ```sh
  bun add zod
  ```

  ```ts
  import * as z from "zod";
  ```

  Prefer `import * as z from "zod"` over `import { z } from "zod"` so bundlers that cannot tree-shake the locale barrel (esbuild) do not pull every locale.
- `zod/v4` remains a stable subpath. The package root exports Zod 4 in `zod@4`.
- Use `zod/mini` when strict bundle-size pressure justifies the functional, tree-shakable API. Since 4.5 the same API is also published as `@zod/mini@4.6.5` (peer `zod@^4.6.0`), versioned in lockstep. Prefer the `zod/mini` subpath unless the project already depends on `@zod/mini`.
- Library authors that need to support both Zod and Zod Mini should import shared base classes and helpers from `zod/v4/core`.
- Libraries supporting both Zod 3 and Zod 4 commonly use a peer range like `^3.25.0 || ^4.0.0` and versioned subpaths: `zod/v3` and `zod/v4/core`. New libraries should peer on `zod@^4.0.0` only. Zod 3 is functionally end-of-life (security and unambiguous bug fixes only).
- Other subpaths: `zod/compile` (global AOT), `zod/locales`, `zod/v4/mini`, `zod/v4-mini`.

## Parsing

- `schema.parse(input)` returns parsed output or throws `ZodError`.
- `schema.safeParse(input)` returns a discriminated result: `{ success: true, data }` or `{ success: false, error }`.
- `schema.parseAsync(input)` and `schema.safeParseAsync(input)` are required when any relevant refinement, transform, or codec path is async.
- Regular Zod and Zod Mini both expose parse methods on schema instances. Zod Core schemas do not; use top-level core helpers such as `z4.parse(schema, input)`.
- Zod parsing returns a strongly typed deep clone of the input, except `z.instanceof()` which returns the same object.

Use `safeParse` at user-facing and recoverable boundaries. Use `parse` when invalid data means the caller or system contract is broken.

### `.validate()` / `z.validate()`

Standalone boolean validation (Zod, Mini, and Core). It answers "is this input valid?" without constructing a `ZodError`, short-circuits on the first issue, and is a type guard on the schema's **input** type.

```ts
z.validate(z.string(), "hi"); // true
z.validate(z.string(), 42);   // false

if (Player.validate(data)) {
  data.username; // narrowed
}
```

- Classic also has `schema.validate(data)` / `schema.validateAsync(data)`. Mini/Core use the top-level functions.
- On invalid input, uncompiled `.validate()` is up to ~6x faster than `.safeParse().success`; compiled schemas can be ~35x faster.
- Async refinements need `validateAsync`.
- Use this when you do not need issues. Use `safeParse` when you must report errors.

Since 4.6, `safeParse()` builds `error` lazily on first read of `result.error`. Error maps run at that read, not at parse time. `.parse()` still throws immediately. Details: [effects-errors.md](effects-errors.md).

## AOT compilation

Introduced in **4.5**. `z.compile(schema)` returns a schema clone with a `new Function` fast path. Valid inputs take the compiled path; invalid inputs fall back to the regular parser so issues match.

```ts
const CompiledPlayer = z.compile(Player);
CompiledPlayer.parse({ username: "billie", xp: 100 });
```

- Compiled schemas are ordinary Zod schemas: same methods, same inferred types, same issues.
- Compile the **final** schema. `.refine()`, `.extend()`, `.optional()`, `.meta()`, and similar return uncompiled schemas.
- Containers (objects, arrays, tuples, unions) benefit most. A bare `z.string()` gains almost nothing.
- Encoding (`z.encode()`) and async parsing always use the standard parser.
- On invalid input, refinements and transforms may run twice (fast path, then fallback).
- Unsupported constructs return the original schema unchanged: async refinements/transforms/checks, `z.xor()`, recursive schemas, `z.coerce.*`, checks with a custom `when`, and `.catch(callback)` (constant `.catch(value)` compiles). Pass `{ strict: true }` to throw `ZodCompileAsyncError` or `ZodCompileUnsupportedError` instead.
- Inside an object/array/tuple/record/intersection, an unsupported child uses the standard parser while the surrounding structure can stay compiled. A union with an unsupported member, a `.catch()` callback, or anything async in the subtree falls back entirely.

Global mode (applications only, not libraries):

```ts
import "zod/compile"; // before modules that define schemas
```

Also `node --import zod/compile app.js` (ESM), `node --require zod/compile app.cjs`, or Bun `preload: ["zod/compile"]`. Compilation is lazy: only schemas that actually parse get compiled.

CSP / no-eval: `z.config({ jitless: true })` disables global mode. Direct `z.compile()` still tries `new Function` and returns the uncompiled schema if generation is refused. `z.withParser(schema, fn)` (4.6) installs a parser generated elsewhere under the same contract. Return `z.INVALID` to fall back to the runtime (the only source of `ZodError`s). The supplied parser must return what the schema would have returned (`z.object()` strips unknown keys).

The compiler is tree-shaken if unused (~7 KB gzipped when included). Do not import `zod/compile` from published libraries.

## Type Inference

- `z.infer<typeof Schema>` is equivalent to the schema output type.
- `z.output<typeof Schema>` names the parsed output type explicitly.
- `z.input<typeof Schema>` names the accepted input type.
- With plain validation schemas, input and output usually match.
- With `coerce`, `preprocess`, `transform`, `pipe`, `codec`, `default`, `prefault`, and `catch`, input and output can differ. Model the correct side at form, API, and storage boundaries.
- Runtime `z.input(schema)` / `z.output(schema)` (4.5) replace every pipe/codec with its input or output side. Details: [effects-errors.md](effects-errors.md).

Example:

```ts
const TrimmedLength = z.string().trim().transform((value) => value.length);

type TrimmedLengthInput = z.input<typeof TrimmedLength>;   // string
type TrimmedLengthOutput = z.output<typeof TrimmedLength>; // number
```

## Coercion

- `z.coerce.string()`, `z.coerce.number()`, `z.coerce.boolean()`, `z.coerce.bigint()`, and `z.coerce.date()` use the corresponding JavaScript constructor.
- In Zod 4, `z.coerce.*` schemas default to `unknown` input type.
- Pass a generic only when the project has a real narrower input contract.
- A missing object key with a `z.coerce.*` field errors. Use `.default()` for the fallback.
- Be careful with `z.coerce.boolean()`: JavaScript `Boolean("false")` is `true`.
- For string booleans from env/query params, prefer `z.stringbool()` or an explicit codec/refinement strategy rather than boolean coercion.
- Compiled schemas cannot include `z.coerce.*`.

## Boundary Pattern

1. Define the narrowest schema that matches external input.
2. Parse at the boundary where trust changes: request body, route params, env vars, file contents, CLI flags, webhook payloads, persisted JSON, or form submission.
3. Export inferred output types for internal use only after parsing.
4. Preserve original input types where a form or adapter expects pre-parse values.
5. Test both valid and invalid inputs, especially when defaults, transformations, and unknown keys are involved.
6. Compile the finished boundary schema if the path is hot and the schema is compile-supported.

## Zod Mini

- Import from `zod/mini` (or `@zod/mini`).
- Zod Mini uses top-level functions for most composition:

  ```ts
  import * as z from "zod/mini";

  const Schema = z.nullable(z.optional(z.string()));
  const Checked = z.string().check(z.minLength(3), z.trim());
  ```

- Parse methods remain on schema instances. Most refinement and wrapper APIs are functional.
- Zod Mini does not load the English locale automatically. Configure it when human-readable errors matter:

  ```ts
  z.config(z.locales.en());
  ```

- Cyclical inputs need an explicit memoizer, registered **before** schemas are defined:

  ```ts
  z.config({ memoizer: z.memoizer() });
  ```

Use regular Zod unless bundle size is the dominant requirement.

## Zod Core

- `zod/v4/core` is for library authors and tooling.
- Core exports `$`-prefixed base classes such as `$ZodType`, `$ZodObject`, `$ZodString`, `$ZodError`, and check classes.
- Core schemas do not have instance methods like `.parse()` or `.min()`.
- Parse with top-level helpers from the core import (`parse`, `safeParse`, `validate`, `encode`, `decode`, …).
- Introspect through `schema._zod.def`, understanding that internals are for tooling and can require defensive fallbacks.
- Compile internals are **not** re-exported from `zod/v4/core` (stopped in 4.6). Use `z.compile` from `zod` / `zod/mini`.
