# Schema v4

Use this reference for Effect Schema v4 validation, transformations, classes, errors, serialization, and JSON Schema generation.

## Mental Model

Schema v4 defines both the encoded input side and decoded runtime type side.

- `schema.Encoded` is the input/serialized shape.
- `schema.Type` is the decoded runtime shape.
- `Schema.decodeUnknownSync(schema)(input)` decodes unknown input to `Type`.
- `Schema.decodeUnknownExit(schema)(input)` returns an `Exit`.
- `Schema.encodeSync(schema)(value)` encodes `Type` back to `Encoded`.
- Effectful transformations and filters require effectful parser/encoder variants.

Do not assume encoded and decoded types match when transformations, defaults, classes, or codecs are involved.

## Basic Schemas

Common primitives:

```ts
import { Schema } from "effect";

Schema.String;
Schema.Number;
Schema.Finite;
Schema.BigInt;
Schema.Boolean;
Schema.Symbol;
Schema.Undefined;
Schema.Null;
Schema.Void;
```

Literals:

```ts
Schema.Literal("ok");
Schema.Literals(["red", "green", "blue"]);
Schema.UniqueSymbol(Symbol("tag"));
```

String checks use `.check(...)`:

```ts
Schema.String.check(
  Schema.isMinLength(3),
  Schema.isPattern(/^[a-z]+$/)
);
```

Common built-ins include `isUUID`, `isBase64`, `isBase64Url`, numeric range checks, `isInt`, and `isInt32`.

## Structs

Struct keys are required and readonly by default:

```ts
const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String
});
```

Use explicit key helpers:

- `Schema.optionalKey(schema)` means the key can be absent.
- `Schema.optional(schema)` means the key can be absent or present as `undefined`.
- `Schema.mutableKey(schema)` makes a property writable.
- Combine with `Schema.NullOr(schema)` when null is a real value.

Defaults are explicit and direction-aware:

- `Schema.withDecodingDefaultKey` for absent key, encoded-side default.
- `Schema.withDecodingDefault` for absent or `undefined`, encoded-side default.
- `Schema.withDecodingDefaultTypeKey` for absent key, decoded-type default.
- `Schema.withDecodingDefaultType` for absent or `undefined`, decoded-type default.

## Excess Properties And Keys

- Struct decoding strips unselected fields in common examples.
- Use decode options such as `onExcessProperty: "error"` or `onExcessProperty: "preserve"` when a boundary needs strict or preserving behavior.
- Use `Schema.encodeKeys({ decodedKey: "encoded_key" })` to rename keys on the encoded side.
- Use `Schema.tagDefaultOmit("Tag")` when a discriminator should exist in decoded values but be omitted during encoding.

## Records, Arrays, Tuples, Unions

- `Schema.Array(item)` validates arrays.
- `Schema.Tuple([...])` validates tuples.
- `Schema.Record(keySchema, valueSchema)` validates records; dynamic key selection is based on encoded property names when the key schema transforms.
- `Schema.Union([A, B])` validates unions.
- `Schema.TaggedStruct("Tag", fields)` and `Schema.TaggedUnion({...})` are preferred for discriminated variants.
- Use `Schema.suspend(() => Schema)` for recursive schemas. Give explicit `Schema.Codec<Type, Encoded>` annotations when encoded and decoded sides differ.

## Filters And Refinements

Add validation filters with `.check(...)` or `Schema.check`.

```ts
const NonEmpty = Schema.String.check(Schema.isNonEmpty());
```

Custom filters:

```ts
const Passwords = Schema.Struct({
  password: Schema.String,
  confirmPassword: Schema.String
}).check(
  Schema.makeFilter((value) =>
    value.password === value.confirmPassword
      ? undefined
      : { path: ["confirmPassword"], issue: "passwords must match" }
  )
);
```

Filter outputs:

- `undefined` or `true` for success.
- `false` for generic failure.
- `string` for a custom message.
- `{ path, issue }` for nested failures.
- arrays for multiple failures.

Multiple filters can run when decoding with `{ errors: "all" }`.

Use `.abort()` on a filter to stop after failure.

Use `Schema.refine` for type-refining schemas and `Schema.brand` for branded types.

## Effectful Validation

Filters passed to `.check(...)` are synchronous. For async/service-backed validation, use an effectful transformation with `SchemaGetter.checkEffect`.

This keeps effects, service requirements, and async behavior visible in the schema's decode path.

## Transformations

Transformations are first-class reusable values in v4.

- `Schema.decodeTo(target, transformation)` transforms from one schema to another while decoding.
- `Schema.encodeTo(target, transformation)` is the inverse direction.
- `Schema.decode(transformation)` applies a transformation where source and target schema are the same.
- `SchemaTransformation.trim`, `toLowerCase`, `toUpperCase`, and `numberFromString` cover common cases.
- `SchemaTransformation.transform` defines pure bidirectional transformations.
- `SchemaTransformation.transformOrFail` defines effectful/failing bidirectional transformations.

Use `SchemaTransformation.passthrough`, `passthroughSubtype`, or `passthroughSupertype` when composing schemas and the encoded/type relation needs to be stated.

## Classes And Tagged Errors

Use `Schema.Class` for prototype-backed instances:

```ts
class User extends Schema.Class<User>("User")({
  id: Schema.String,
  name: Schema.String
}) {}
```

Useful class helpers:

- `.make(...)` constructs validated instances.
- `Schema.decodeUnknownSync(User)(input)` decodes into class instances.
- `User.extend<Sub>("Sub")({...})` builds subclasses.
- Pass a `Struct` with `.check(...)` to validate relationships between fields.
- Use `Schema.suspend` for recursive class fields.

Use `Schema.TaggedClass` for discriminated classes.

Use `Schema.ErrorClass` and `Schema.TaggedErrorClass` for typed errors. Tagged error classes work naturally with `Effect.catchTag`.

```ts
class HttpError extends Schema.TaggedErrorClass<HttpError>()("HttpError", {
  status: Schema.Number,
  message: Schema.String
}) {}
```

## Serialization

Schema has helpers for common serialized forms:

- `Schema.UnknownFromJsonString`
- `Schema.fromJsonString(schema)`
- `Schema.StringFromBase64`
- `Schema.StringFromBase64Url`
- `Schema.StringFromHex`
- `Schema.StringFromUriComponent`
- `Schema.fromFormData(schema)`
- `Schema.fromURLSearchParams(schema)`
- `Schema.toCodecJson(schema)`
- `Schema.toCodecStringTree(schema)`
- `Schema.toCodecIso(schema)`

For class instances or custom types, add `toCodecJson` annotations so JSON serialization and JSON Schema generation describe the same representation.

## JSON Schema Generation

- `Schema.toJsonSchemaDocument(schema)` emits Draft 2020-12 by default.
- Convert to Draft 7 with `JsonSchema.toDocumentDraft07(document)`.
- Attach standard metadata with `.annotate({ title, description, default, examples, readOnly, writeOnly })`.
- For transformed schemas, annotate the encoded side with `Schema.annotateEncoded(...)` when the metadata must appear in JSON Schema output.
- Custom types without JSON codec annotations may produce placeholder or unhelpful JSON Schema.

## Error Formatting

Decode helpers can throw or return `Exit`. Prefer `decodeUnknownExit` in tests and user-facing parsers where assertions need exact failures.

Use Schema error output to preserve paths, multiple issues, and encoded/type distinction. Do not flatten errors prematurely at domain boundaries.
