---
name: schema-dts
description: "Build, review, debug, migrate, or plan Schema.org JSON-LD with Google schema-dts TypeScript types. Use for schema-dts, schema-dts-gen, schema-dts-lib, WithContext, Graph, IdReference, MergeLeafTypes, ProductLeaf and other *Leaf types, WithActionConstraints, JSON-LD script injection, structured data, Organization, WebSite, Product, Offer, FAQPage, Article, BreadcrumbList, react-schemaorg, and Schema.org v30 typing."
---

# schema-dts

Use this skill when work touches **schema-dts** TypeScript types for Schema.org JSON-LD: building structured data objects, injecting `<script type="application/ld+json">`, multi-typed nodes, `@graph` documents, action input/output constraints, or regenerating typings with **schema-dts-gen**.

## Workflow

1. Inspect the local surface before changing code:
   - Packages: `schema-dts` (and optionally `schema-dts-gen`, `schema-dts-lib`, `react-schemaorg`).
   - Version: target **v2** (`2.0.0` = Schema.org v30). Treat `1.x` as legacy.
   - Role: type-only compile-time checking (no runtime Schema.org validation).
   - Shape: single `WithContext<T>` node vs `Graph` with `@id` stubs vs multi-`@type` via `MergeLeafTypes`.
   - Injection path: React/`react-schemaorg`, Next `Script`, Astro/`set:html`, Svelte head, or vanilla DOM.
2. Refresh docs when the user asks for latest behavior, the installed major is unclear, or work touches v2 helpers / generator output. Start from [source-map.md](references/source-map.md).
3. For install, `WithContext`, `Thing` discrimination, DataTypes, and type-only imports, use [setup-core.md](references/setup-core.md).
4. For `Graph`, `IdReference`, `*Leaf`, `MergeLeafTypes`, and `WithActionConstraints`, use [graphs-merge-actions.md](references/graphs-merge-actions.md).
5. For common page schemas, XSS-safe serialization, and framework wiring, use [patterns-frameworks.md](references/patterns-frameworks.md).
6. For `schema-dts-gen` CLI / programmatic generation and v1→v2 breaks, use [generator-migration.md](references/generator-migration.md).
7. Implement in the existing project style:
   - Prefer `import type { … } from 'schema-dts'`.
   - Put `@context: 'https://schema.org'` only on the document root (`WithContext` or `Graph`).
   - Prefer `bun` / `bunx` in command examples when adding packages or running the generator.

## Judgment

- **Types only.** `schema-dts` catches wrong `@type` / unknown properties at compile time. It does not validate against Google Rich Results or Schema.org at runtime.
- Ship **core Schema.org** from the prebuilt package. Pending / experimental layers need a custom `schema-dts-gen` run, not hand-rolled `as` casts.
- Always use **`WithContext<T>`** (or `Graph`) for the top-level JSON-LD document so `@context` is required and locked to `https://schema.org`.
- Prefer the **narrowest type** that matches the page (`Product`, `Article`, `FAQPage`) over typing everything as `Thing`.
- Use **`*Leaf` + `MergeLeafTypes`** only when `@type` is genuinely an array of concrete types. Never pass union aliases like `Product` into `MergeLeafTypes`.
- Cross-link repeated entities with **`@id` + `IdReference` stubs** inside a `Graph` instead of duplicating nested objects.
- For sitelinks search box / Action markup, wrap or cast with **`WithActionConstraints`** so `query-input` (and other `*-input` / `*-output`) type-check.
- When injecting into HTML, **escape** `<`, `>`, `&`, `'` in the JSON string (or use `react-schemaorg`'s `JsonLd`).
- Prefer **absolute HTTPS URLs** for `url`, `image`, `logo`, `sameAs`, and `@id` values that crawlers resolve.

## Verification

Prefer the repo's existing checks. For meaningful schema-dts work, include the relevant subset:

- Typecheck the JSON-LD builders and any framework wrappers.
- Confirm root objects use `WithContext` / `Graph` and nested nodes omit `@context`.
- Smoke-render the page and inspect the `application/ld+json` script(s) in the DOM / view-source.
- Optionally paste output into [Google Rich Results Test](https://search.google.com/test/rich-results) or Schema Markup Validator when SEO eligibility matters.
- After upgrading to v2, re-check Role-shaped properties, `Quantity` assignments, multi-type nodes, and any custom `schema-dts-gen` output (now imports `schema-dts-lib`).
