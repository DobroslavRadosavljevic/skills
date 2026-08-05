# Graphs, Leaf Types, Merge, and Actions

## IdReference

Stub reference to a node defined elsewhere (usually in the same `@graph`):

```ts
import type {IdReference} from 'schema-dts';

const ref: IdReference = {'@id': 'https://example.com/#org'};
```

Use absolute IRIs. Prefer defining the full node once with `@id`, then referencing it from other properties.

## Graph

Typed multi-node JSON-LD document:

```ts
import type {Graph} from 'schema-dts';

const doc: Graph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': 'https://my.site/#alyssa',
      name: 'Alyssa P. Hacker',
      mainEntityOfPage: {'@id': 'https://my.site/about/#page'},
    },
    {
      '@type': 'WebPage',
      '@id': 'https://my.site/about/#page',
      url: 'https://my.site/about/',
      about: {'@id': 'https://my.site/#alyssa'},
      mainEntity: {'@id': 'https://my.site/#alyssa'},
    },
  ],
};
```

Guidance:

- Put shared entities (Organization, Person, WebSite) in `@graph` with stable `@id`s.
- Keep one-off nested types (e.g. a single `Occupation`) inline when nothing else references them.
- Unknown properties on graph members still fail excess-property checks when the object is contextually typed.

## Leaf types (`*Leaf`)

Union aliases like `Organization` / `Product` include **subtypes** (e.g. `Corporation` is assignable where `Organization` is expected).

Exact-class leaves are exported as `ThingLeaf`, `ProductLeaf`, `SoftwareApplicationLeaf`, …

Use leaves when:

1. You need **exactly** that `@type` string (no subtypes), or
2. You are feeding **`MergeLeafTypes`**.

## MergeLeafTypes

Combine concrete leaf types for legitimate multi-typed nodes (`"@type": ["Product", "SoftwareApplication"]`).

```ts
import type {
  MergeLeafTypes,
  ProductLeaf,
  SoftwareApplicationLeaf,
  WithContext,
} from 'schema-dts';

const app: WithContext<
  MergeLeafTypes<[ProductLeaf, SoftwareApplicationLeaf]>
> = {
  '@context': 'https://schema.org',
  '@type': ['Product', 'SoftwareApplication'], // order must match the tuple
  name: 'My App',
  offers: {
    '@type': 'Offer',
    price: 89,
    priceCurrency: 'USD',
  },
  operatingSystem: 'Any',
};
```

Hard rules:

- Pass **leaf** types only — `MergeLeafTypes<[Product, …]>` is wrong.
- `@type` tuple **order** must match the type-parameter order.
- Arbitrary `Thing` values are **not** automatically mergeable; declare the merged type explicitly at the definition site.
- Implemented in `schema-dts-lib` and re-exported from `schema-dts`.

## WithActionConstraints

Schema.org Actions allow `{property}-input` and `{property}-output` annotations. Plain action types do not include those keys; widen with `WithActionConstraints<T>`:

```ts
import type {SearchAction, WebSite, WithActionConstraints} from 'schema-dts';

const potentialAction: WithActionConstraints<SearchAction> = {
  '@type': 'SearchAction',
  'query-input': 'required name=search_term_string',
};

const website: WebSite = {
  '@type': 'WebSite',
  name: 'Acme Search',
  url: 'https://acme.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://acme.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  } as WithActionConstraints<SearchAction>,
};
```

Cast at the nested assignment when the parent property is typed as a plain `Action` union.

## Roles (v2)

Property values may be wrapped in `Role` / `OrganizationRole` / `EmployeeRole` / … to attach role metadata. v2 **removed recursive Role intersections** that previously produced malformed types (see upstream #205). Prefer simple values unless you need Role semantics; if migrating from v1, re-typecheck Role-heavy objects.
