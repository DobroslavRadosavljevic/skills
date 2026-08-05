# Setup and Core Types

## Install

Prefer a **devDependency** (types are compile-time only). A runtime dependency is fine if the project already installs types that way.

```sh
bun add -d schema-dts
```

v2 pulls in `schema-dts-lib` automatically. TypeScript peer: `schema-dts-lib` declares `typescript >= 4.9.5`.

Always import with `import type` unless a bundler requires a value import for side-effect-free re-exports (the package ships a tiny `schema.js`).

```ts
import type {Organization, Person, WithContext} from 'schema-dts';
```

## What the package is

- Complete **discriminated unions** of Schema.org classes keyed by `@type`.
- Pre-packaged **latest core** Schema.org (as of v2: **v30**). Does **not** include [pending.schema.org](https://pending.schema.org/) or other non-core layers.
- **No runtime validators.** Invalid structured data that still type-checks (wrong enum URL, missing required Google Rich Result fields) is still possible.

## WithContext

Top-level JSON-LD documents need `@context`. `WithContext<T>` intersects `T` with a **literal** context:

```ts
export type WithContext<T extends JsonLdObject | string> = T & {
  '@context': 'https://schema.org';
};
```

```ts
import type {Person, WithContext} from 'schema-dts';

const p: WithContext<Person> = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Eve',
  affiliation: {
    '@type': 'Organization',
    name: 'Nice School',
  },
};
```

Rules:

- Put `@context` **only** on the root document (`WithContext` or `Graph`).
- Nested entities use `@type` (and optional `@id`) only.
- Wrong context URL fails typecheck (`'https://google.com'` is rejected).

## Thing and discrimination

`Thing` is the top-level union of all Schema.org classes. `@type` is required and narrows allowed properties:

```ts
import type {Thing} from 'schema-dts';

const person: Thing = {'@type': 'Person', name: 'Ada'};

// Excess property check: subtypes' props are invalid when @type is bare Thing
const tooWide: Thing = {
  '@type': 'Thing',
  name: 'ok',
  // @ts-expect-error — additionalName is not on Thing
  additionalName: ['alias'],
};
```

Prefer naming the concrete export (`Product`, `Article`, …) at call sites. Use `Thing` for helpers that accept any node (`JsonLd<T extends Thing>`).

## Property value shape

Properties are typed as `SchemaValue<T, TProperty>` — roughly:

- a single `T`
- a `Role`-wrapped value (for time-bounded / positional relationships)
- or a readonly array of those

Many fields also accept `IdReference` (`{ '@id': string }`) instead of an inline object.

## DataTypes

Common Schema.org DataTypes map to TypeScript as:

| Schema.org | TypeScript surface (simplified) |
| --- | --- |
| `Text` | `string` |
| `URL` | `string` |
| `Number` | `number` \| numeric template string \| `Float` \| `Integer` |
| `Integer` / `Float` | branded numeric string unions + number |
| `Boolean` | `boolean` \| `"True"` / `"False"` \| Schema.org URLs |
| `Date` / `DateTime` / `Time` | `string` (ISO 8601) |
| `Quantity` (v2 / Schema.org v30) | core **DataType** (breaking vs older typings) |

Enumerations (e.g. availability) often accept both compact names and full `https://schema.org/…` IRIs.

## JsonLdObject

From `schema-dts-lib` (re-exported by `schema-dts`):

```ts
interface JsonLdObject {
  readonly '@type': string | readonly string[];
  readonly '@id'?: string;
}
```

All typed nodes are JSON-LD objects in this sense. Custom generator output also imports these shared types from `schema-dts-lib`.
