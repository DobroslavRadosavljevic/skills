# Blume API references

Scope: the `reference` config (`openapi()`, `asyncapi()`, `graphql()`, `scalar()` from `blume/reference`) and hand-written API pages (`api` frontmatter plus the `api` config block). Covers spec sources, routes, code samples, Try it playground, proxy, auth, indexing, warnings.

## Contents

1. [Overview and decision table](#overview-and-decision-table)
2. [Config skeleton and nav tab](#config-skeleton-and-nav-tab)
3. [Shared adapter options](#shared-adapter-options)
4. [OpenAPI](#openapi)
5. [AsyncAPI](#asyncapi)
6. [GraphQL](#graphql)
7. [Scalar embed](#scalar-embed)
8. [Playground, proxy, credentials](#playground-proxy-credentials)
9. [Hand-written API pages](#hand-written-api-pages)
10. [Warnings and BLUME_* codes](#warnings-and-blume_-codes)
11. [Gotchas](#gotchas)

## Overview and decision table

- Every reference is an adapter. Import it from `blume/reference`. List it under `reference` in `blume.config.ts`.
- An adapter is a plain description, not a parsed spec. Blume validates it up front and inlines it into the generated site.
- Omit `reference` (or leave it empty) to render no reference.
- Native adapters give one real Blume page per operation (or per root field and type). Each page has its own URL, appears in site search, `llms.txt`, the MCP server, and gets an Open Graph image.

| Need | Use | Default route | Renderer |
| --- | --- | --- | --- |
| REST API from OpenAPI spec | `openapi()` | `/reference` | native pages |
| Events from AsyncAPI spec | `asyncapi()` | `/events` | native pages |
| GraphQL schema | `graphql()` | `/graphql` | native pages |
| Scalar's own UI (OpenAPI or AsyncAPI doc) | `scalar()` | `/reference` | embed on one route |
| One endpoint, no spec | `api` frontmatter on an MDX page | the page's own URL | native endpoint layout |

| Adapter | Spec input | Spec formats |
| --- | --- | --- |
| `openapi()` | `http(s)` URL or local path | JSON or YAML. Swagger 2.0 and OpenAPI 3.0 are upgraded to 3.1. 3.1 and 3.2 are read as written. Parsed with Scalar's OpenAPI parser. |
| `asyncapi()` | `http(s)` URL or local path | JSON or YAML. 2.x is normalized to 3.x. |
| `graphql()` | `http(s)` URL or local path | SDL text (`.graphql`) or introspection JSON (`{ "__schema": … }` or `{ "data": { "__schema": … } }`). |
| `scalar()` | `http(s)` URL (loaded in browser) or local path (read at build time, inlined) | OpenAPI or AsyncAPI. Scalar detects which. No GraphQL. |

## Config skeleton and nav tab

```ts
// blume.config.ts
import { defineConfig } from "blume";
import { openapi, asyncapi, graphql, scalar } from "blume/reference";

export default defineConfig({
  reference: [
    openapi({ spec: "./openapi.yaml" }),
    asyncapi({ spec: "./asyncapi.yaml" }),
    graphql({ spec: "./schema.graphql", endpoint: "https://api.example.com/graphql" }),
    scalar({ spec: "./legacy.json", route: "/legacy" }),   // routes must differ
  ],
});
```

A reference adds no header tab by itself. Point a navigation tab at its route. This also scopes the operations sidebar for native renderers.

```ts
navigation: {
  tabs: [{ label: "API", path: "/reference" }],
}
```

The list holds as many adapters of each kind as needed. Use separate adapters when two specs need different display options (for example a different `codeSamples` set), each with its own `route`.

## Shared adapter options

`openapi()`, `asyncapi()`, `graphql()` share the base options. `scalar()` shares only the source shape (`spec`, `overlays`, `sources`, `route`) plus `noindex`.

| Option | Applies to | Meaning |
| --- | --- | --- |
| `spec` | all | URL or local path. Shorthand for a single-entry `sources`. Relative paths resolve from the project root. |
| `sources` | all | Array of `{ label, route, spec, … }`. One entry per spec. See [Multiple specs](#multiple-specs). |
| `route` | all | Mount point of overview page and prefix for operation routes. |
| `codeSamples` | `openapi`, `asyncapi`, `graphql` | Languages to render, in order. `false` or `[]` shows none. |
| `expandSchemas` | `openapi`, `asyncapi` | `true` starts nested schema rows expanded. |
| `playground` | `openapi`, `asyncapi`, `graphql` | `false` turns Try it off. `{ proxy }` configures CORS proxy. |
| `overlays` | `openapi`, `scalar` | OpenAPI Overlay files applied in order. |
| `endpoint` | `graphql` | Live GraphQL URL. Per-source value overrides adapter value. |
| `auth` | `graphql` | `{ method, name }`. Per-source value overrides adapter value. |
| per-source `includeInSearch`, `includeInLlms`, `noindex`, `seoDescriptionSuffix` | native adapters | See [Per-source indexing](#per-source-indexing). |
| any other key | `scalar` | Forwarded verbatim to Scalar. |

## OpenAPI

```ts
openapi({ spec: "https://petstore3.swagger.io/api/v3/openapi.json" })
openapi({ spec: "./openapi.yaml" })          // local: read at build time; `blume dev` watches it and local overlays
```

Default mount: overview at `/reference`, operations at `/reference/<tag>/<operation>`.

Full example with all common options:

```ts
openapi({
  route: "/api",                                   // overview /api, ops /api/<tag>/<operation>
  spec: "./openapi.yaml",
  overlays: ["./overlays/public.yaml"],
  codeSamples: ["curl", "python", "go", "java", "csharp"],
  expandSchemas: true,
  playground: { proxy: true },                     // or false, or { proxy: "https://proxy.example.com" }
})
```

### Routes and slugs

- `<tag>` is the operation's first tag (`operations` when none).
- `<operation>` is the `operationId`, else method and path.
- Both are lowercased with words split by hyphens, camelCase and PascalCase included. Tag `InboxesThreads` gives `inboxes-threads`. operationId `listThreads` gives `list-threads`.
- A slug must be unique only within its tag. A second `list` in the same tag gets its method added (`list-post`), with a `BLUME_OPENAPI_DUPLICATE_OPERATION_ID` warning when both share an `operationId`.
- Old URLs from earlier Blume versions (`inboxesthreads`, spec-wide `list-get`) are redirected to current ones unless a page or one of your `redirects` already sits at that URL.

### Order, labels, grouping

- Sidebar tag groups and overview sections follow the spec's top-level `tags` list. Tags not declared follow in order of first use by operations.
- Within a tag: paths in listed order, then each path's methods in written order.
- A `meta.ts` in a tag's folder with its own `pages` list overrides that order (standard Blume `defineMeta`, see the meta docs).
- A tag's `x-displayName` (Redocly) labels its sidebar group and overview section. The URL still comes from the tag name.
- An operation is labeled by its `summary`, or by method and path (`GET /pets`) when none.
- `info.description` opens the overview page. Each tag `description` opens its section. Headings shift down one level so the page title stays the only H1: `# Authentication` becomes H2 in `info.description` or an operation description, H3 in a tag description.

### Multiple specs

```ts
openapi({
  sources: [
    { label: "Public API", spec: "./public.json" },                  // route derived: /reference/public-api
    { label: "Admin API", route: "/admin", spec: "./admin.json" },    // explicit route
  ],
})
```

- `label` names the sidebar group as written and derives the route unless `route` is set.
- A source's group sits at its route. Each folder of the route above it is a sidebar group too.
- `route: "/apis/messaging"` makes the source's group the `messaging` folder's own group, named by `label`.
- `route: "/apis/messaging/openapi"` nests the group inside a **Messaging** group that holds nothing else.
- Sources resolve in list order. When two resolve to the same route, the first wins and the build warns about the dropped one.
- Sources share the adapter's display options.

### Per-source indexing

All pages are in search, `llms.txt`, and crawler indexing by default. Opt out per source without hiding pages or removing them from navigation.

```ts
sources: [
  {
    label: "Platform API",
    route: "/platform",
    spec: "./platform.json",
    includeInSearch: false,   // out of site search (overview and operations)
    includeInLlms: false,     // out of both llms.txt files
    noindex: true,            // crawler noindex metadata, out of sitemap
    seoDescriptionSuffix: false,
  },
]
```

- Operation meta description = operation `description` (or `summary`) + generated English sentence naming the endpoint ("Reference for the `GET /pets` endpoint in the Petstore API.").
- `seoDescriptionSuffix: false` drops that sentence. An operation with neither `description` nor `summary` falls back to its title (`GET /pets`).
- For GraphQL the sentence names the query, mutation, or type. For AsyncAPI it names the channel and action.
- `scalar()` honors only `noindex`.

### Code samples

`codeSamples` defaults to `["curl", "js", "python"]`. `false` or `[]` shows none. Order given is render order.

| Id | Language | Client | Also accepts |
| --- | --- | --- | --- |
| `curl` | cURL | `curl` | `bash`, `sh`, `shell` |
| `python` | Python | `requests` | `py` |
| `js` | JavaScript | `fetch` | `javascript` |
| `node` | Node.js | `axios` | `nodejs`, `node.js` |
| `typescript` | TypeScript | `fetch` | `ts` |
| `php` | PHP | curl extension | |
| `go` | Go | `net/http` | `golang` |
| `java` | Java | `java.net.http` | |
| `ruby` | Ruby | `net/http` | `rb` |
| `powershell` | PowerShell | `Invoke-RestMethod` | `ps1` |
| `swift` | Swift | `URLSession` | |
| `csharp` | C# | `HttpClient` | `c#`, `cs` |
| `dotnet` | .NET | RestSharp | `.net`, `dot-net` |
| `c` | C | libcurl | |
| `cpp` | C++ | cpr | `c++`, `cplusplus` |
| `kotlin` | Kotlin | OkHttp | `kt` |
| `rust` | Rust | reqwest | `rs` |
| `dart` | Dart | `package:http` | `flutter` |

- Values are quoted by each language's own rules (`If-Match: "33a64df5"` and `$` in bodies arrive as written).
- An unknown id (for example `objectivec`) is dropped from every page with `BLUME_OPENAPI_UNKNOWN_CODE_SAMPLE`, which lists valid ids. GraphQL uses `BLUME_GRAPHQL_UNKNOWN_CODE_SAMPLE`.
- Need another language? Write it into the spec as your own sample.

### Your own samples (`x-codeSamples`)

Add to an operation in the spec (Redocly extension; `x-code-samples` also works). Fields: `lang`, `source`, optional `label`.

```yaml
paths:
  /plants:
    get:
      x-codeSamples:
        - lang: typescript
          label: SDK
          source: |
            const plants = await planter.plants.list();
        - lang: go
          source:
            $ref: ./code_samples/go/list_plants.go   # file relative to the spec (fetched when spec is a URL)
```

- Own samples render as tabs ahead of generated ones. They stay as written when the reader edits Try it.
- Show only your own samples: `codeSamples: false`.
- Own samples are in the operation's Markdown copy (so `llms-full.txt`, MCP server, assistant see them). Generated samples are not.
- `source` `$ref` that cannot be read, or points inside the document (`#/…`): sample left out with `BLUME_OPENAPI_CODE_SAMPLE_REF`.
- Own samples are full-text indexed only with `search.indexing.includeCodeBlocks`.

### Schemas and examples

- Request body schemas and samples omit `readOnly` properties. Response schemas omit `writeOnly` ones. Webhook and callback bodies read like responses. Same filtering applies to Try it prefill and response examples.
- Two or more entries in an `examples` map: each shown, labeled by `summary` or key. Response gets a tab per example (`200 · A cat`), webhook payload a tab per example after media type, request body an **Examples** block. Samples and Try it start from the first.
- A property written as `$ref` with sibling keywords reads those keywords over the referenced schema's.
- Search indexes operation summary, description, tag, endpoint (`GET /pets/{id}`), plus Markdown-copy contents (request body top-level properties, response descriptions). Rendered schema tables and generated samples are not indexed.

### Authorization

No config. Blume reads `security` from the spec.

- Operations with security get an **Authorization** section above parameters. Code samples send a placeholder credential (`Authorization: Bearer YOUR_TOKEN`, API-key header, or query key).
- Operation `security` overrides document root. `security: []` marks the operation public: no section.
- Several requirement entries are alternatives ("or" groups). Schemes inside one entry are all required. First alternative feeds code samples.
- Empty `{}` entry means auth is optional.
- OAuth2 scopes are listed per scheme. Scheme `description`s from `components.securitySchemes` render inline.

### Overlays

Keep docs-only changes out of a generated spec with an OpenAPI Overlay (spec 1.0 and 1.1 supported). Each overlay is a local path or `http(s)` URL. They apply in order, per adapter or per source.

```ts
openapi({ spec: "./openapi.json", overlays: ["./overlays/public.yaml"] })
```

```yaml
overlay: 1.1.0
info:
  title: Public docs
  version: 1.0.0
actions:
  - target: $.paths.*[?@['x-internal'] == true]
    remove: true
  - target: $.info
    update:
      description: The public Acme API.
```

- `target` is a JSONPath (RFC 9535) expression.
- `update` merges: objects key by key, arrays gain items, other values replaced.
- `copy` merges in a node from elsewhere in the spec (Overlay 1.1). `remove: true` deletes targets.
- Overlays apply to the spec as written, before the 3.1 upgrade. Target the version you wrote.
- Everything built from the spec sees the result (pages, sidebar, search, `llms.txt`, MCP server).
- An overlay that does not apply fails the reference like an unreadable spec. A broken overlay cannot publish what it should hide.

### Webhooks and callbacks

- Each top-level `webhooks` entry gets its own page, filed under its first tag, or a **Webhooks** group when untagged. It shows payload schema and the responses your endpoint should return. The rail shows an example payload instead of Try it and code samples.
- A webhook page lists only the `security` the webhook declares. Root `security` does not apply.
- A webhook that is a `$ref` to a shared path item is left out (`BLUME_OPENAPI_REF_PATH_ITEM`).
- 3.0 `x-webhooks` become `webhooks` on upgrade. In a spec already 3.1+, `x-webhooks` render nothing (`BLUME_OPENAPI_X_WEBHOOKS`). Rename the field.
- Operation `callbacks` render in a **Callbacks** section on the operation page (URL expression, method, parameters, body, responses). `components.callbacks` via `$ref` works too.
- Webhook pages are in search, `llms.txt`, and MCP. Their Markdown tells agents the API sends the request.

### OpenAPI 3.2

Rendered as written. A `query` operation (HTTP `QUERY`) gets a page, Try it, and samples. Not rendered yet:

- `additionalOperations`: left out, `BLUME_OPENAPI_UNSUPPORTED`.
- `in: querystring` parameters: no table row, no Try it input, no sample entry, same warning.
- `itemSchema` for streamed bodies: no schema shown unless `schema` is set beside it.
- Examples using `dataValue` or `serializedValue` instead of `value`: not shown.
- Nested tags (`parent`) and tag `kind`: tags stay a flat list.
- Other new fields (tag or response `summary`) are ignored, not rejected.

### `<Operation>` in your own MDX

```mdx
---
title: Quickstart
mode: wide
---

Create your first pet:

<Operation source="reference" id="add-pet" />
```

- `source` = the reference route without slashes, lowercased with hyphens (`/reference` is `reference`, `/api/v2` is `api-v2`).
- `id` = `operationId` lowercased with words split by hyphens (`addPet` is `add-pet`), or method and path (`post-pets`) when no `operationId`.
- Easiest way to get both: open an operation page's raw MDX copy (page URL plus `.mdx`). Its body is the tag to copy.
- It lays out in two columns. Set `mode: wide` on the page.
- In the page's Markdown copy it becomes endpoint, request body, and responses.

## AsyncAPI

```ts
import { asyncapi } from "blume/reference";

reference: [asyncapi({ spec: "./asyncapi.yaml" })]   // overview /events, one page per send/receive operation
navigation: { tabs: [{ label: "Events", path: "/events" }] }
```

- Takes the same options as `openapi()`. Same native renderer.
- Each `send`/`receive` operation page has: message payload and header schema tables, channel parameters, protocol bindings, Authorization section (from `securitySchemes`, server- and operation-level, alternatives as "or" groups, per-server applicability when a channel's servers differ), and a Try it composer.
- Shared options that carry over: `route`, `sources` with `label`/`route`, `expandSchemas`, per-source indexing flags (including `seoDescriptionSuffix`), `playground`.
- Search indexes operation summary, description, tag, endpoint (`SEND user/signup`).

### Spec versions

- AsyncAPI 2.x (and 1.x) specs are normalized to 3.x with the official converter. `publish`/`subscribe` channels map to `send`/`receive` pages with stable URLs.
- The converter is an optional peer dependency: `bun add @asyncapi/converter`. Without it, the build fails and prints the install command. 3.x specs need nothing extra.
- Operations group by tag. Untagged operations group under their channel address.

### Code samples (protocol-aware)

Keyed off the operation's binding (or its servers' protocol):

| Protocol | Samples |
| --- | --- |
| WebSocket | `wscat`, browser `WebSocket` snippet |
| Kafka | `kcat` |
| MQTT | `mosquitto_pub` / `mosquitto_sub` |
| Other | payload example only, no fabricated client |

- `codeSamples` filters that set. `codeSamples: false` shows none.
- Kafka `kcat` details: channel binding `topic` replaces the channel address as topic name. Message binding `key` produces `key|payload` lines with `-K '|'`, and consumes with the same flag. Key value comes from the key schema, so give it an `examples` entry.
- Server SASL scheme (`plain`, `scramSha256`, `scramSha512`, `gssapi`): sample adds `-X` settings, reading `$KAFKA_USERNAME` and `$KAFKA_PASSWORD`. A `kafka-secure` server adds TLS.

### Try it for events

- Server-rendered collapsed. JS loads on first open.
- Payload editor prefilled from message `examples`, else sampled from the payload schema. Validated against the payload schema as you type.
- Input per channel parameter. Server picker from channel `servers` (host and path variables at defaults) plus a free-text URL.
- Code samples stay in lockstep: the channel address template is filled with typed parameter values.
- Live connect is WebSocket-only (`ws` or `wss` binding). It shows state and logs timestamped frames. A `receive` operation (API receives from you) gets a **Send** button. A `send` operation only connects and logs. No auto-reconnect.
- Kafka, MQTT, AMQP, others: composer and copyable CLI samples only.
- `playground: false` turns it off: `asyncapi({ spec: "./asyncapi.yaml", playground: false })`.
- `playground.proxy` does not apply to events (WebSocket goes browser to server directly).
- No broker credentials collected. Nothing persisted.

## GraphQL

```ts
import { graphql } from "blume/reference";

reference: [
  graphql({
    spec: "./schema.graphql",
    endpoint: "https://api.example.com/graphql",
  }),
]
navigation: { tabs: [{ label: "GraphQL", path: "/graphql" }] }
```

### Routes

| Page | Route |
| --- | --- |
| Overview | `/graphql` |
| Query | `/graphql/queries/<field>` |
| Mutation | `/graphql/mutations/<field>` |
| Subscription | `/graphql/subscriptions/<field>` |
| Type | `/graphql/objects/<type>`, `/graphql/enums/<type>`, and so on by kind |

- One page per root field (queries, mutations, subscriptions) and per named type (objects, input objects, enums, interfaces, unions, custom scalars).
- Spec-defined scalars (`String`, `Int`, …) get no pages. Custom scalars do, including their `specifiedBy` URL.
- SDL: directives used without a declaration (Apollo Federation `@key`, AppSync `@aws_*`) are ignored.
- `endpoint` is the live API URL. A schema names no server, so Try it and code samples target `endpoint`. Without it, samples use a placeholder URL.

### Generated content

- Each operation page: complete valid example operation (one typed variable per argument, bounded-depth selection set), example variables, example response mirroring the selection.
- Argument defaults seed the variables. Deprecated fields are left out of the selection.
- Code samples show the exact HTTP request (JSON `POST` of `{ query, variables }`) in each language from `codeSamples`. Same language ids as `openapi()`. `codeSamples: false` shows none.
- Type pages: linked fields and input fields, enum values, union members, interface implementations, and **Used by** (operations and types referencing it). Arguments show defaults and deprecations.

```ts
graphql({ spec: "./schema.graphql", codeSamples: ["curl", "js"] })
```

### Multiple schemas

```ts
graphql({
  endpoint: "https://api.example.com/graphql",
  sources: [
    { label: "Public API", spec: "./schema.graphql" },
    {
      label: "Admin API",
      route: "/graphql-admin",
      spec: "./admin.graphql",
      endpoint: "https://admin.example.com/graphql",   // overrides adapter endpoint
    },
  ],
})
```

Per-source controls: `includeInSearch`, `includeInLlms`, `noindex`, `seoDescriptionSuffix`, plus per-source `endpoint` and `auth`.

### Playground and auth

- Query and mutation pages: edit body (query and variables), pick endpoint or custom URL, send. Samples update live.
- Subscription pages show the generated operation and an example event only (no WebSocket or SSE transport in Try it).
- `playground: false` turns it off.
- No credentials are sent until `auth` is set. Shape is the same as `api.auth`:

```ts
graphql({
  spec: "./schema.graphql",
  endpoint: "https://api.example.com/graphql",
  auth: { method: "bearer" },        // "bearer" | "basic" | "key" | "none"; name = header for key (default x-api-key)
  playground: { proxy: true },
})
```

- With `auth`: every operation page gets an Authorization section, Try it gets a credential field (works like the OpenAPI one), code samples get a placeholder credential. Per-source `auth` overrides the adapter's.
- `playground.proxy: true` needs server output (host adapter such as `deployment: vercel()` from `blume/deploy`). Built-in proxy route is `/_api-proxy` under `basePath`.
- GraphQL proxy allow-list = each configured GraphQL `endpoint` plus absolute `servers[].url` from documented OpenAPI specs. Without `endpoint`, the proxy has no origin for this reference, refuses every send, and the build warns. Set `endpoint` for a working proxy.
- Same body limit, header forwarding, response headers as the OpenAPI proxy.
- No Scalar counterpart: GraphQL always renders natively.

## Scalar embed

Use when you want Scalar's UI (own sidebar, search, theme, request client) on one route instead of native pages.

```ts
import { scalar } from "blume/reference";

reference: [
  scalar({
    spec: "./openapi.yaml",
    theme: "purple",                  // a Scalar theme name
    route: "/api",                    // default /reference
    overlays: ["./overlays/public.yaml"],
    sources: [
      { label: "Public API", spec: "./public.json" },                              // → /api/public-api
      { label: "Legacy API", route: "/legacy", spec: "./legacy.json", noindex: true },
    ],
  }),
]
```

| Option | Meaning |
| --- | --- |
| `spec` | URL (loaded in browser) or local path (read at build time, inlined). OpenAPI or AsyncAPI. |
| `overlays` | Same as OpenAPI. Spec is inlined with overlays applied, so a remote spec with overlays is fetched at build time. If an overlay does not apply, the build warns and leaves that page out. |
| `sources` | Several documents, each on its own route. Same `label`/`route` rules as native adapters. |
| `route` | Mount point. Default `/reference`. |
| `theme` | Scalar theme name. Without it Blume layers its accent and radius on Scalar's default theme. A named `theme` replaces that. |
| any other key | Forwarded verbatim as Scalar configuration. JSON values only (inlined into the page). |

Forwarded-option example:

```ts
scalar({
  spec: "./openapi.yaml",
  localization: { locale: "es" },     // translate Scalar's own UI (Blume i18n does not)
  agent: { disabled: true },          // disable the Scalar Agent
  hideTestRequestButton: true,
  orderSchemaPropertiesBy: "preserve",
})
```

- Forwarded options win over Blume's derived config (including `customCss` and spec `content`/`url`).
- The one key that cannot be forwarded is Scalar's multi-document `sources` (that name is Blume's; each Blume source becomes its own page).
- Follows Blume's light/dark toggle (pinned on mount, switches with it). Scalar's theme switch is hidden. Pass `forceDarkModeState` or `darkMode` to hand color mode back to Scalar.
- The adapter declares `@scalar/astro` as its runtime dependency. The generated project lists it only when a `scalar()` adapter is configured.
- Embed and native pages can coexist if routes differ.

What the embed does not do:

- Not woven into Blume's sidebar, search, or `llms.txt`. Only `noindex` of the per-source controls applies.
- No `codeSamples`, `expandSchemas`, or `playground` options.
- Scalar's request client calls your API directly from the browser. Blume's `playground.proxy` is not available. The API must send `Access-Control-Allow-Origin` for the docs site.
- AsyncAPI documents render channels, operations, messages, Models. No event composer (Scalar has no AsyncAPI playground).

## Playground, proxy, credentials

Applies to `openapi()` (full), `asyncapi()` (composer, no proxy), `graphql()` (query and mutation), and the `api` config block.

### What the OpenAPI Try it panel does

- Generated from the operation: input per path, query, header parameter; body editor from the request-body schema; prefilled from spec examples.
- Wire format follows the spec: `style` and `explode` (`tags=dog&tags=cat`, `1,2` in a path, `filter[color]=red` for `deepObject`). `application/x-www-form-urlencoded` and `multipart/form-data` bodies are sent as form fields, not JSON.
- Server picker: operation `servers`, else path `servers`, else spec `servers`, variables at defaults, plus free-text base URL.
- Auth inputs match resolved security: bearer, API key, basic. OAuth2 is a token paste field (no flow is run).
- When any response is JSON, Send and samples carry an `Accept` header with the first JSON media type (a success response's first). A declared `Accept` header parameter takes its place.
- Form values update code samples live (copied curl equals what Send does).
- Server-rendered collapsed. JS loads on first open.
- `TRACE`: browsers cannot send it via `fetch`. Send says so. The JS sample is a note. cURL and Python samples work.
- Turn off: `openapi({ spec, playground: false })`.

### Credentials

- Typed credentials stay in memory and vanish on reload.
- **Remember on this device** persists them in `localStorage`, scoped to the docs origin. Sent only to the API being called.
- Samples keep placeholders (`YOUR_TOKEN`) unless the reader toggles **Include my values in samples**.

### CORS and the proxy

Requests go directly from the browser to the target API, so the API must allow the docs origin (`Access-Control-Allow-Origin`). If it cannot:

```ts
playground: {
  proxy: true,                              // built-in /_api-proxy (at {basePath}/_api-proxy)
  // proxy: "https://proxy.example.com",    // or a proxy URL you host
}
```

`proxy: true` needs server output: a host adapter such as `deployment: vercel()` from `blume/deploy`.

Built-in proxy behavior:

| Aspect | Behavior |
| --- | --- |
| Allowed targets | Only origins specs declare in `servers` (document, path, or operation level, variables at defaults), including across redirects. |
| Custom base URL typed in panel | Not a documented server. Refused with 403 when the proxy is on. |
| Forwarded headers | Only what the panel sets: filled credentials and header parameters, `Accept`, body `Content-Type`. Cookies, browser-attached credentials (preview HTTP Basic auth), host headers (`X-Forwarded-For`, `CF-*`, `X-Vercel-*`) never reach the API. |
| Body limit | 4 MB request body. Larger gets `413`. |
| Response headers added | `Content-Security-Policy: sandbox`, `X-Content-Type-Options: nosniff`, `Cross-Origin-Resource-Policy: same-origin`, plus `Content-Disposition: attachment` for HTML or SVG. |
| Rate limit | Per reader, like every reader-callable server route (see rate-limiting config). |

For hand-written pages the proxy forwards only to `api.server`'s origin and origins of full URLs in `api` frontmatter. For GraphQL see [Playground and auth](#playground-and-auth).

## Hand-written API pages

Document one endpoint in MDX without a spec. Add `api` frontmatter. Blume builds the OpenAPI-style layout: method and path at the top, Try it panel and request samples in a right column, pinned examples beneath.

```mdx
---
title: Create a user
api: POST /workspaces/{workspaceId}/users
---

Creates a user and sends them an invite.

<ParamField path="workspaceId" type="string" required>
  The workspace to add the user to.
</ParamField>

<ParamField body="email" type="string" required placeholder="ada@example.com">
  The user's email address.
</ParamField>

<ParamField body="role" type="string" default="member">
  One of `owner`, `admin`, or `member`.
</ParamField>

<ResponseField name="id" type="string" required>
  The new user's ID.
</ResponseField>

<ResponseExample>

```json 201
{ "id": "usr_8f2k", "status": "invited" }
```

</ResponseExample>
```

### Frontmatter keys

| Key | Values | Meaning |
| --- | --- | --- |
| `api` | `METHOD /path` or `METHOD https://full.url/path` | HTTP method plus path or full URL. Path joins `api.server`. A full URL is sent to as written. Path params use braces (`{workspaceId}`) and fill from the matching `path` field. |
| `authMethod` | `bearer`, `basic`, `key`, `none` | Auth for this endpoint. `key` = API key in a header. Overrides site `api.auth`. |
| `playground` | `interactive` (default), `simple`, `none` | `interactive` = Try it panel and samples. `simple` = samples only. `none` = neither. Method, path, and examples stay. |

### Fields to Try it mapping

Components: `ParamField`, `ResponseField`, `Expandable`, `RequestExample`, `ResponseExample` (same as elsewhere in Blume MDX; props match Mintlify's, so Mintlify pages keep working).

| Field | Becomes |
| --- | --- |
| `ParamField path=…` / `query=…` / `header=…` | A parameter input of that kind. |
| `ParamField body=…` | A property of the JSON body. Nested fields inside `Expandable` become the properties of an object. |
| `type="string[]"` | Array. |
| `type` that is not a JSON type (such as `enum<string>`) | Sent as a string. |
| `default` | Fills the body. |
| `placeholder` | The example value shown in samples. |
| Optional body field with neither `default` nor `placeholder` | Starts empty. Stays out of the request until filled. |

- Request samples: cURL, JavaScript, Python. A page with its own `RequestExample` shows that instead.
- The page's Markdown copy lists each field. Search indexes the page like any other.

### Site defaults (`api` config block)

```ts
// blume.config.ts
export default defineConfig({
  api: {
    server: "https://api.acme.com/v1",
    auth: { method: "key", name: "x-api-key" },
    playground: { proxy: true },
  },
});
```

| Option | Meaning |
| --- | --- |
| `server` | Base URL that a path in `api` frontmatter joins. |
| `auth.method` | `bearer`, `basic`, `key`, `none`. Applies unless a page sets `authMethod`. |
| `auth.name` | Header name for an API key. Default `x-api-key`. |
| `playground` | Same values as the OpenAPI playground option. `false` hides Try it on every page. `proxy` is `true` (built-in) or your proxy URL. |

- Without `auth`, pages send no credentials.
- Built-in proxy needs server output. It forwards only to `server`'s origin and origins of full URLs in `api` frontmatter.

## Warnings and BLUME_* codes

Blume does not validate a spec against the OpenAPI schema. Lint in CI with Spectral or oasdiff. It does warn in `blume dev`, `blume build`, and `blume check`. Each warning names the spec. The rest of the reference still builds.

| Code | Meaning |
| --- | --- |
| `BLUME_OPENAPI_PATH_PARAMETER_MISSING` | `{name}` in a path has no `in: path` parameter. No input. Try it and samples send the placeholder literally. |
| `BLUME_OPENAPI_PATH_PARAMETER_UNUSED` | `in: path` parameter has no `{name}` in the path. Try it value never reaches the URL. |
| `BLUME_OPENAPI_UNKNOWN_SECURITY_SCHEME` | A `security` requirement names a scheme missing from `components.securitySchemes`. No description, no credential sent. |
| `BLUME_OPENAPI_UNSUPPORTED` | OpenAPI 3.2 feature not rendered: `additionalOperations` (operations dropped) or `in: querystring` parameters. |
| `BLUME_OPENAPI_CODE_SAMPLE_REF` | `x-codeSamples` `source` `$ref` unreadable or points inside the document. Sample dropped. |
| `BLUME_OPENAPI_X_WEBHOOKS` | 3.1+ spec keeps webhooks under `x-webhooks`. None render. Rename to `webhooks`. |
| `BLUME_OPENAPI_REF_PATH_ITEM` | Path or webhook is a `$ref` to a shared path item (for example `components.pathItems`). Operations missing. Inline under `paths` or `webhooks`. |
| `BLUME_OPENAPI_DUPLICATE_OPERATION_ID` | Two operations share an `operationId`. Method is added to the second one's `<Operation>` id, and to its URL when they share a tag. Make ids unique. |
| `BLUME_OPENAPI_LOCAL_SERVER` | A server is `localhost`, `127.0.0.1`, `0.0.0.0`, or `[::1]`. Try it and samples target it. List the public URL or fix with an overlay. |
| `BLUME_OPENAPI_NULLABLE` | A 3.1+ spec uses `nullable` (removed in 3.1). Blume shows nullable, validators read never-null. Use `type: [string, "null"]`. |
| `BLUME_OPENAPI_UNKNOWN_CODE_SAMPLE` | `codeSamples` id Blume cannot generate. Left out. Warning lists valid ids. |
| `BLUME_GRAPHQL_UNKNOWN_CODE_SAMPLE` | Same, for `graphql()`. |

## Gotchas

- A reference does not create a header tab. Add a `navigation.tabs` entry with `path` set to the reference route, or readers cannot find it.
- Default routes collide: `openapi()` and `scalar()` both default to `/reference`. Set `route` on one. On duplicate routes the first wins and the later one is dropped with a build warning.
- `spec` is shorthand for a single-entry `sources`. Use `sources` only for more than one spec per adapter. Different display options need separate adapters.
- Use `label` to name a source group. Without `route`, the route derives from `label`.
- `playground.proxy: true` needs server output (for example `deployment: vercel()` from `blume/deploy`). A static build has no `/_api-proxy`.
- The built-in proxy refuses origins your specs do not declare. A custom base URL typed in the panel gets 403. For GraphQL, set `endpoint` or every send is refused.
- `playground.proxy` does nothing for AsyncAPI (WebSocket goes direct) and for `scalar()` (Scalar calls the API itself). Those APIs need CORS.
- `playground: false` is the whole off switch. For hand-written pages, `playground: "none"` in frontmatter hides panel and samples for one page. `"simple"` keeps samples.
- OAuth2 in Try it is a token paste field. Blume does not run the OAuth flow.
- `codeSamples: false` hides generated samples. Your `x-codeSamples` still render. They are the only samples in the Markdown copy and `llms-full.txt`.
- Unknown `codeSamples` ids are dropped with a warning, not an error. Valid ids are the 18 in the table.
- Remote spec URLs for `scalar()` load in the reader's browser. Local paths are inlined at build time. Overlays on `scalar()` force build-time fetch.
- Overlay targets the spec version you wrote (applied before the 3.1 upgrade). A failing overlay fails the whole reference build.
- `x-webhooks` only works for 3.0 specs (upgraded). In a 3.1+ spec rename it to `webhooks`.
- Path items via `$ref` to `components.pathItems` are not resolved. Inline them.
- Operation slug uniqueness is per tag, not per spec. Old URL forms are redirected unless something already occupies them.
- `<Operation>` needs `mode: wide` on the page, `source` as the route slug (no slashes), and `id` as the hyphenated operationId. Copy it from the operation's `.mdx` URL.
- AsyncAPI 1.x or 2.x specs need `bun add @asyncapi/converter`. Without it the build fails.
- `scalar()` forwards every unknown key to Scalar as JSON. Functions and non-JSON values will not survive. `sources` there is Blume's, not Scalar's.
- Only `noindex` applies to `scalar()`. `includeInSearch`, `includeInLlms`, `codeSamples`, `expandSchemas`, `playground` do not.
- `seoDescriptionSuffix` is an English sentence. Set `false` for non-English specs.
- GraphQL subscriptions get no live Try it. Only query and mutation pages do.
- GraphQL Try it sends no credentials until `auth` is set. API-key header default name is `x-api-key`.
- Blume does not lint specs. Run Spectral or oasdiff in CI. Watch dev/build/check output for `BLUME_OPENAPI_*` warnings.
- Search does not index generated schema tables or generated samples. It indexes titles, prose, tag, endpoint, and (via Markdown copy) body properties and response descriptions.
