# Generator and Migration

## When to use schema-dts-gen

Use the prebuilt `schema-dts` package for normal Schema.org core markup.

Reach for **`schema-dts-gen`** when you need:

- A pinned Schema.org ontology version / N-Triples URL
- Pending or other Schema.org-compatible layers not in the published package
- A custom ontology that is Schema.org-compatible (includes Schema.org DataTypes and a top-level `Thing`)
- Different `@context` naming (prefixed multi-namespace contexts)

```sh
bun add -d schema-dts-gen@^2.0.1 schema-dts-lib
bunx schema-dts-gen --ontology=https://schema.org/version/latest/schemaorg-all-https.nt
```

Redirect stdout to a `.d.ts` (or `.ts`) file your project references.

### Security: use `schema-dts-gen@2.0.1+`

`schema-dts-gen@2.0.0` copied ontology `rdfs:comment` text into JSDoc without escaping `*/`, so a malicious or compromised ontology could inject executable TypeScript into the generated module ([GHSA-c4f4-pq98-f2p2](https://github.com/google/schema-dts/security/advisories/GHSA-c4f4-pq98-f2p2), fixed in `2.0.1`).

- Pin `schema-dts-gen` to `^2.0.1` before running it on any third-party `--ontology` URL or `--file`.
- Treat non-schema.org ontologies as untrusted input. Review generated output in code review before committing it.
- Prefer emitting `.d.ts` and consuming it with `import type` so generated code is never evaluated at runtime.
- Regenerate any output produced by `2.0.0` from a custom ontology and diff it.
- The prebuilt `schema-dts` package and runs against the default schema.org HTTPS ontology are not affected.

## CLI flags

| Flag | Purpose |
| --- | --- |
| `--ontology` | HTTPS URL to an `.nt` N-Triples ontology. Defaults to `https://schema.org/version/latest/schemaorg-all-https.nt`. |
| `--file` | Local path to an `.nt` ontology file (instead of a URL). |
| `--context` | Default `https://schema.org`. Single URL, or comma-separated `name:URL` pairs for multi-namespace contexts. Affects property names and `@type` string values. |
| `--deprecated` / `--nodeprecated` | Include or omit deprecated types/properties. Included deprecated members get `@deprecated` JSDoc. |
| `--verbose` | Extra diagnostics on stderr. |
| `--schema` / `--layer` | Deprecated; use `--ontology` instead. |

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

- [ ] Bump `schema-dts` to `2.x` (and `schema-dts-gen` to `^2.0.1` if used); ensure `schema-dts-lib` resolves.
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
| Running `schema-dts-gen@2.0.0` on a third-party ontology | Upgrade to `2.0.1+` (GHSA-c4f4-pq98-f2p2) and review output |
| `class X implements Person` fails | Implement the leaf interface (`PersonLeaf`) |
| Treating `schema-dts` as Google Search API | It is community Schema.org typings, not Search Console |

## Adjacent version notes (1.1.x)

- `1.1.5` tracked Schema.org v28 and removed TypeScript as a peer of `schema-dts` so installing as a regular dependency works more smoothly.
- Prefer upgrading to v2 for `MergeLeafTypes`, leaf exports, Action constraints, and Schema.org v30 alignment.
