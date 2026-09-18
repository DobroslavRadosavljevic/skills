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
  z.uuidv4();
  z.uuidv6();
  z.uuidv7();
  z.guid();
  z.url();
  z.httpUrl();
  z.hostname();
  z.e164();
  z.emoji();
  z.base64();
  z.base64url();
  z.hex();
  z.jwt();
  z.nanoid();
  z.cuid();   // deprecated: CUID v1 leaks timestamps; prefer z.cuid2()
  z.cuid2();
  z.ulid();
  z.xid();
  z.ksuid();
  z.ipv4();
  z.ipv6();
  z.mac();
  z.cidrv4();
  z.cidrv6();
  z.creditCard();    // 4.5: 12–19 digits, Luhn
  z.currencyCode();  // 4.6.4: ISO 4217, uppercase, vendored list
  z.iban();          // 4.6: electronic format, MOD 97-10
  z.hash("sha256");  // md5 | sha1 | sha256 | sha384 | sha512
  z.iso.date();
  z.iso.time();
  z.iso.datetime();
  z.iso.duration();
  ```

- Method forms like `z.string().email()` still work but are deprecated.
- `z.uuid()` is strict about UUID variant bits. Use `z.guid()` for a looser UUID-shaped pattern. `z.uuid({ version: "v4" })` or `z.uuidv4()` / `v6` / `v7` pin a version.
- `z.url()` uses the platform URL parser (WHATWG). Since 4.6.4 a bare `z.url()` rejects invalid URLs with `URL.canParse()` (~50x faster on invalid input). Use `z.httpUrl()` or protocol/hostname constraints for web-only URLs. `normalize: true` overwrites with `new URL().href`.
- `z.mac()` is colon-delimited, same-case hex by default. Pass `{ delimiter: "-" }` for IEEE dash form.
- `z.creditCard()` accepts optional single spaces or hyphens; no issuer check.
- `z.iban()` is electronic format only (no spaces), uppercase, any country code, checksummed.
- `z.currencyCode()` is three-letter ISO 4217; lowercase and withdrawn codes fail.
- `z.hash(alg, { enc })` defaults to hex. `enc` may be `"hex" | "base64" | "base64url"`.
- `z.nanoid({ length: 64 })` sets a custom length (default pattern otherwise).
- `z.stringFormat("cool-id", predicate | regex)` produces `invalid_format` issues, not generic `custom`.
- `z.templateLiteral(["hello, ", z.string(), "!"])` infers template-literal types.
- ISO datetime defaults accept UTC `Z` but not offsets or local datetimes unless configured. Since 4.5, a `Z` or offset **requires seconds** (`2020-01-01T06:15Z` fails). `local: true` may omit seconds. Union `z.iso.datetime()` with `{ precision: -1 }` to accept both minute and second forms.
- String `.min()` / `.max()` / `.length()` count **Unicode code points**, not UTF-16 units (4.5).
- `z.emoji()` requires at least one pictograph, regional indicator, or keycap. Component-only strings (`"123"`, `"#"`) fail since 4.6.
- `z.ulid()` restricts the first character to `0`–`7`.
- `z.ipv6()` checks the address alphabet directly (no `new URL()`).
- Custom formats and hashes compose into template literals as alphabets, not always full length/padding rules.
- Fixed-width numeric helpers include `z.int()`, `z.float32()`, `z.float64()`, `z.int32()`, and `z.uint32()`.
- Zod 4 `z.number()` no longer accepts infinities, and integer checks are safe-integer oriented.

## Objects

- `z.object({ ... })` makes all properties required by default.
- Unknown keys are stripped from parsed output by default. `__proto__` is always dropped (input, declared, or produced by a key transform). `.strict()` reports an own `__proto__` key as `unrecognized_keys`.
- Use `z.strictObject()` to error on unknown keys.
- Use `z.looseObject()` to pass unknown keys through.
- Use `.catchall(schema)` to validate unknown keys against a schema.
- Use `.shape` to access member schemas.
- Use `.keyof()` to derive an enum of object keys.
- Use `.pick()`, `.omit()`, `.partial()`, and `.required()` for object variants.
- `.exactPartial()` (4.5) is like `.partial()` but wraps fields in `z.exactOptional()`: omitted keys are fine, explicit `undefined` is not.
- `z.deepPartial(schema)` (4.5, functional form; the Zod 3 method is gone) recurses through objects, arrays, tuples, unions, records, and wrappers. Discriminated unions degrade to plain unions. Throws if the object carries its own refinement. Result stays a `ZodObject`.
- A `const` **symbol key** in the shape is required and type-checked (4.5). Undeclared symbol keys are ignored (not passed through by `looseObject`, not flagged by `strictObject`).

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
- Since 4.5, **cyclical runtime input is supported** in regular Zod (output graph mirrors input). Zod Mini needs `z.config({ memoizer: z.memoizer() })` before defining schemas. Recursive schemas still cannot be compiled.

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
- Array checks include `.min()`, `.max()`, `.length()`, and `.nonempty()` (alias of `.min(1)`).
- Tuples use `z.tuple([A, B])`; rest tuples use the second tuple argument.
- In Zod 4, `.nonempty()` behaves like `.min(1)` and does not infer a tuple type.
- Tuple `.partial()` (4.5) makes each element optional. Rest elements stay as the rest schema.
- Maps: `z.map(Key, Value)`.
- Sets: `z.set(Value)` with `.min()`, `.max()`, and `.size()`.
- Files: `z.file()` with size checks and MIME checks.

## Unions And Intersections

- `z.union([A, B])` checks options in order and returns the first successful parse.
- `z.xor([A, B])` succeeds only when exactly one option matches. Multiple matches emit a distinct issue (`inclusive: false`, `matches` indices). Plain `z.object()` options often overlap because unknown keys are stripped — use `z.strictObject()` on the narrower branch. `z.xor()` cannot be compiled.
- Prefer `z.discriminatedUnion(discriminator, options)` for tagged object unions, especially large unions.
- Zod 4 discriminated unions can handle richer discriminator schemas and nested discriminated unions.
- `z.getDiscriminatedOption(union, "tag")` (4.5) returns that member schema. An unknown tag is a TypeScript error. Looking up `undefined` throws if multiple options accept an absent discriminator.
- `z.intersection(A, B)` returns an intersection schema that lacks object methods like `.pick()` and `.omit()`.
- Prefer object spread or `.extend()` when merging object schemas.
- Zod 4 throws a regular `Error`, not a `ZodError`, when intersection results cannot be merged.
- Since 4.5, a record key schema governs only keys that match it (TypeScript index-signature semantics). Intersecting an object with a pattern-keyed record no longer rejects the object's own keys. `unrecognized_keys` no longer aborts the rest of that schema's checks.

## Records

- `z.record(KeySchema, ValueSchema)` validates object records.
- Key schemas must be assignable to `string | number | symbol`.
- Numeric record keys validate numeric string keys, matching JavaScript object behavior.
- In Zod 4, `z.record(z.enum([...]), Value)` exhaustively requires every enum key.
- Use `z.partialRecord()` for optional enum-keyed maps.
- Use `z.looseRecord()` when non-matching keys should pass through unchanged.

## Defaults, Optionality, And Nullability

- `.optional()` accepts `undefined`.
- `.exactOptional()` accepts an absent key but rejects explicit `undefined` (TypeScript `exactOptionalPropertyTypes`).
- `.nullable()` accepts `null`.
- `.nullish()` accepts `null` and `undefined`.
- Object fields with `z.any()` or `z.unknown()` are required in Zod 4 unless explicitly optional.
- Defaults inside optional object fields are applied in Zod 4:

  ```ts
  z.object({ a: z.string().default("x").optional() }).parse({});
  // { a: "x" }
  ```

## Instanceof And Property Checks

- `z.instanceof(C)` returns the same object (prototype and identity survive). Prefer this over `z.object()` for class instances.
- `z.property("key", schema)` is a check that validates one property in place.
- `z.properties({ ... })` is a **check factory**. Spread it into `.check(...)`. Do not treat `z.properties()` as a standalone schema (that 4.6.0 form was removed in 4.6.3).
- Classic: `z.instanceof(Response).properties({ ok: z.literal(true), status: z.number().min(200).max(299) })` spreads the same checks and narrows the inferred type. Since 4.6.5 the shape is keyed off the instance type. Transforms/defaults on those property schemas are discarded; validation is in-place.

```ts
const okResponse = z.instanceof(Response).properties({
  ok: z.literal(true),
  status: z.number().min(200).max(299),
});
okResponse.parse(res) === res; // true
```

Mini:

```ts
z.instanceof(Response).check(...z.properties({
  ok: z.literal(true),
  status: z.number().check(z.minimum(200), z.maximum(299)),
}));
```

## Functions

- `z.function({ input, output })` defines a Zod-validated function factory.
- `input` is an array of parameter schemas or a tuple schema.
- `.implement(fn)` validates inputs and outputs. The function schema is exposed on the result.
- `.implementAsync(fn)` wraps async functions.
- If only inputs need validation, omit `output`.
- Zod 4 no longer uses the Zod 3 `.args().returns()` API.

## Brands, Readonly, JSON, Custom, Apply, Matching Types

- `.brand<"Name">()` provides static-only nominal typing. Runtime parsed values are unchanged.
- In Zod 4.2+, the second brand generic can brand `"out"`, `"in"`, or `"inout"`.
- `.readonly()` marks the inferred type readonly and freezes parsed output with `Object.freeze()` for supported containers.
- `z.json()` validates JSON-encodable values.
- `z.custom<T>(validator)` can model third-party types; avoid `z.custom<T>()` without a validator because it validates nothing. Prefer `z.instanceof()` for classes and `z.templateLiteral()` for template-literal types.
- `z.promise()` is deprecated. Await possible promises before parsing.
- `.apply(fn, ...args)` (4.5 extra args) folds an external helper into the method chain.
- `z.toZod<T>()(schema)` (4.5) returns `schema` unchanged after an **exact** output-type check against `T`. Extra keys, omitted optionals, and `z.any()` fail, unlike `satisfies z.ZodType<T>`. Enum targets stay nominal: `z.enum(Level)` matches; `z.enum(["noob", "pro"])` does not.
