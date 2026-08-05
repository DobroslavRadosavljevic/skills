# Generator and Migration

## When to use schema-dts-gen

Use the prebuilt `schema-dts` package for normal Schema.org core markup.

Reach for **`schema-dts-gen`** when you need:

- A pinned Schema.org ontology version / N-Triples URL
- Pending or other Schema.org-compatible layers not in the published package
- A custom ontology that is Schema.org-compatible (includes Schema.org DataTypes and a top-level `Thing`)
- Different `@context` naming (prefixed multi-namespace contexts)

```sh
bun add -d schema-dts-gen schema-dts-lib
bunx schema-dts-gen --ontology=https://schema.org/version/latest/schemaorg-all-https.nt
```

Redirect stdout to a `.d.ts` (or `.ts`) file your project references.

## CLI flags

| Flag | Purpose |
| --- | --- |
| `--ontology` | HTTPS URL (or path, depending on version) to an `.nt` N-Triples ontology. Required for custom runs. |
| `--context` | Default `https://schema.org`. Single URL, or comma-separated `name:URL` pairs for multi-namespace contexts. Affects property names and `@type` string values. |
| `--deprecated` / `--nodeprecated` | Include or omit deprecated types/properties. Included deprecated members get `@deprecated` JSDoc. |
| `--verbose` | Extra diagnostics on stderr. |

Examples:

```sh
# Core-ish all-https ontology, drop deprecated
bunx schema-dts-gen \
  --ontology=https://schema.org/version/latest/schemaorg-all-https.nt \
  --nodeprecated \
  > schema.d.ts

# Prefixed multi-namespace context
bunx schema-dts-gen \
  --ontology=https://schema.org/version/latest/schemaorg-all-https.nt \
  --context=rdf:http://www.w3.org/2000/01/rdf-schema,schema:https://schema.org \
  > schema-prefixed.d.ts
```

## Generated output (v2)

v2 generator output **depends on `schema-dts-lib`**. The emitted file starts with imports/re-exports such as:

```ts
import type {JsonLdObject, IdReference, MergeLeafTypes} from 'schema-dts-lib';
export type {JsonLdObject, IdReference, MergeLeafTypes};
```

Projects that commit custom gen output must also depend on `schema-dts-lib` (v2).

Programmatic API (advanced): `loadTriples`, `Context.Parse`, `WriteDeclarations` from `schema-dts-gen` — stream chunks to a write callback. Prefer the CLI unless integrating into a build pipeline.

## v1 → v2 migration checklist

Target: `schema-dts@2.0.0` (Schema.org **v30**). Release: https://github.com/google/schema-dts/releases/tag/v2.0.0

- [ ] Bump `schema-dts` (and `schema-dts-gen` if used) to `2.x`; ensure `schema-dts-lib` resolves.
- [ ] Adopt **`WithActionConstraints`** for `*-input` / `*-output` Action properties (new in v2).
- [ ] For multi-typed nodes, switch to **`MergeLeafTypes<[…Leaf]>`** instead of unsafe casts.
- [ ] Prefer **`*Leaf`** when you need an exact class (no subtypes).
- [ ] Re-typecheck **Role**-valued properties — Role typings are no longer recursive (#205).
- [ ] Revisit **`Quantity`** assignments — now a core DataType (Schema.org v30); formerly-legal shapes may fail.
- [ ] Rename imports of **non-schema.org** conflict types to escaped FQIRI identifiers (e.g. `www_omg_org_spec_Commons_DatesAndTimes_Date`). Most apps never used these.
- [ ] Regenerate any custom `schema-dts-gen` output and add `schema-dts-lib`.

## Pitfalls

| Pitfall | Fix |
| --- | --- |
| Missing `@context` on the root | Wrap with `WithContext<T>` or use `Graph` |
| `@context` on nested nodes | Remove; only the document root needs it |
| `MergeLeafTypes<[Product, …]>` | Use `ProductLeaf`, not the union alias |
| Swapped multi-`@type` order | Match the `MergeLeafTypes` tuple order |
| `query-input` on plain `SearchAction` | Use `WithActionConstraints<SearchAction>` (or cast nested) |
| Raw JSON in HTML templates | Escape with `safeJsonLd` or use `react-schemaorg` |
| Expecting runtime / Rich Results validation | Typecheck only; validate separately for SEO |
| Pending vocabulary missing | Generate with `schema-dts-gen` from an ontology that includes those terms |
| Treating `schema-dts` as Google Search API | It is community Schema.org typings, not Search Console |

## Adjacent version notes (1.1.x)

- `1.1.5` tracked Schema.org v28 and removed TypeScript as a peer of `schema-dts` so installing as a regular dependency works more smoothly.
- Prefer upgrading to v2 for `MergeLeafTypes`, leaf exports, Action constraints, and Schema.org v30 alignment.
