# Schema API

Use this reference for Zod 4 schema construction and composition.

## Primitives And Formats

- Primitive schemas include `z.string()`, `z.number()`, `z.bigint()`, `z.boolean()`, `z.symbol()`, `z.undefined()`, `z.null()`, `z.any()`, `z.unknown()`, `z.never()`, and `z.void()`.
- Prefer `z.unknown()` over `z.any()` when code must prove or narrow a value before use.
- `z.literal()` accepts a literal value, and Zod 4 can accept an array of literal values.
- `z.enum()` accepts string arrays and enum-like inputs. `z.nativeEnum()` is deprecated.
- Top-level string format validators are preferred for new Zod 4 code:

  ```ts
  z.email();
  z.uuid();
  z.guid();
  z.url();
  z.httpUrl();
  z.hostname();
  z.e164();
  z.base64();
  z.base64url();
  z.jwt();
  z.ipv4();
  z.ipv6();
  z.cidrv4();
  z.cidrv6();
  z.iso.date();
  z.iso.time();
  z.iso.datetime();
  z.iso.duration();
  ```

- Method forms like `z.string().email()` still work but are deprecated.
- `z.uuid()` is strict about UUID variant bits. Use `z.guid()` for a looser UUID-shaped pattern.
- `z.url()` uses the platform `URL` parser. Use protocol and hostname constraints for web-only URLs.
- ISO datetime defaults accept UTC `Z` but not offsets or local datetimes unless configured.
- Fixed-width numeric helpers include `z.int()`, `z.float32()`, `z.float64()`, `z.int32()`, and `z.uint32()`.
- Zod 4 `z.number()` no longer accepts infinities, and integer checks are safe-integer oriented.

## Objects

- `z.object({ ... })` makes all properties required by default.
- Unknown keys are stripped from parsed output by default.
- Use `z.strictObject()` to error on unknown keys.
- Use `z.looseObject()` to pass unknown keys through.
- Use `.catchall(schema)` to validate unknown keys against a schema.
- Use `.shape` to access member schemas.
- Use `.keyof()` to derive an enum of object keys.
- Use `.pick()`, `.omit()`, `.partial()`, and `.required()` for object variants.

Prefer spread syntax for large object composition when it is clear:

```ts
const Extended = z.object({
  ...Base.shape,
  ...Extra.shape,
  extra: z.string(),
});
```

Use `.extend()` for simple object extension. Use `.safeExtend()` when extending schemas that contain refinements or when overwrites must remain assignable to the original inferred type.

## Recursive Objects

- Define self-referential and mutually recursive object schemas with getters.
- Add explicit getter return annotations if TypeScript reports circular inference errors.
- Recursive schemas do not protect against cyclical runtime data; cyclical input can loop indefinitely.

```ts
const Category = z.object({
  name: z.string(),
  get children(): z.ZodArray<typeof Category> {
    return z.array(Category);
  },
});
```

## Arrays, Tuples, Maps, Sets, Files

- Arrays: `z.array(T)` or `T.array()` in regular Zod.
- Array checks include `.min()`, `.max()`, and `.length()`.
- Tuples use `z.tuple([A, B])`; rest tuples use the second tuple argument.
- In Zod 4, `.nonempty()` behaves like `.min(1)` and does not infer a tuple type.
- Maps: `z.map(Key, Value)`.
- Sets: `z.set(Value)` with `.min()`, `.max()`, and `.size()`.
- Files: `z.file()` with size checks and MIME checks.

## Unions And Intersections

- `z.union([A, B])` checks options in order and returns the first successful parse.
- `z.xor([A, B])` succeeds only when exactly one option matches.
- Prefer `z.discriminatedUnion(discriminator, options)` for tagged object unions, especially large unions.
- Zod 4 discriminated unions can handle richer discriminator schemas and nested discriminated unions.
- `z.intersection(A, B)` returns an intersection schema that lacks object methods like `.pick()` and `.omit()`.
- Prefer object spread or `.extend()` when merging object schemas.
- Zod 4 throws a regular `Error`, not a `ZodError`, when intersection results cannot be merged.

## Records

- `z.record(KeySchema, ValueSchema)` validates object records.
- Key schemas must be assignable to `string | number | symbol`.
- Numeric record keys validate numeric string keys, matching JavaScript object behavior.
- In Zod 4, `z.record(z.enum([...]), Value)` exhaustively requires every enum key.
- Use `z.partialRecord()` for optional enum-keyed maps.
- Use `z.looseRecord()` when non-matching keys should pass through unchanged.

## Defaults, Optionality, And Nullability

- `.optional()` accepts `undefined`.
- `.nullable()` accepts `null`.
- `.nullish()` accepts `null` and `undefined`.
- Object fields with `z.any()` or `z.unknown()` are required in Zod 4 unless explicitly optional.
- Defaults inside optional object fields are applied in Zod 4:

  ```ts
  z.object({ a: z.string().default("x").optional() }).parse({});
  // { a: "x" }
  ```

## Functions

- `z.function({ input, output })` defines a Zod-validated function factory.
- `input` is an array of parameter schemas or a tuple schema.
- `.implement(fn)` validates inputs and outputs.
- `.implementAsync(fn)` wraps async functions.
- If only inputs need validation, omit `output`.
- Zod 4 no longer uses the Zod 3 `.args().returns()` API.

## Brands, Readonly, JSON, Custom

- `.brand<"Name">()` provides static-only nominal typing. Runtime parsed values are unchanged.
- In Zod 4.2+, the second brand generic can brand `"out"`, `"in"`, or `"inout"`.
- `.readonly()` marks the inferred type readonly and freezes parsed output with `Object.freeze()` for supported containers.
- `z.json()` validates JSON-encodable values.
- `z.custom<T>(validator)` can model third-party types; avoid `z.custom<T>()` without a validator because it validates nothing.
- `z.promise()` is deprecated. Await possible promises before parsing.
