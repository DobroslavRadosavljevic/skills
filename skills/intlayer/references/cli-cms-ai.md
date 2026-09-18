# CLI, CMS, editor, AI, MCP, analytics

Prefer project scripts when present. Use `bunx intlayer <cmd>` (the `intlayer` package already ships the CLI). Global `intlayer-cli` is unnecessary if `intlayer` is a dependency.

## Everyday commands

```bash
bunx intlayer init
bunx intlayer build
bunx intlayer build --watch
bunx intlayer test              # alias: content test
bunx intlayer list              # alias: content list
bunx intlayer fill
bunx intlayer fill --ci         # 9.5.2: not `intlayer ci fill`
bunx intlayer push
bunx intlayer pull
bunx intlayer extract
bunx intlayer login
bunx intlayer --version
```

| Command | Role |
| --- | --- |
| `init` | Detect env, write config, install packages. Skip `--interactive` for agents. `init mcp` wires the MCP server. |
| `build` / `build --watch` | Transpile `.content.*` → `.intlayer/` |
| `test` / `content test` | Missing translations (CI) |
| `list` / `content list` | Declaration files |
| `fill` | AI-complete missing locales (`dictionary.fill` + `ai.*`) |
| `push` / `pull` | CMS / editor sync (`dictionary push -d <key>` for one key) |
| `extract` | Pull strings from components into a nearby `.content` file |
| `standalone --packages intlayer …` | Single JS bundle (vanilla / CDN) |
| `doc translate` / `doc review` | Markdown/docs AI pass |
| `scan <url>` | Public URL i18n/SEO + page-size audit |
| `projects list` | Discover Intlayer projects in a tree |
| `editor` / live-sync commands | Visual editor process; runtime CMS reflection |

### `--ci` (9.5.2)

`intlayer ci <command>` is **removed**. Pass `--ci` on the real command:

```bash
bunx intlayer build --ci
bunx intlayer fill --ci
bunx intlayer push --ci
```

Runs the command in every Intlayer project in the monorepo (or only the current project when invoked from a project directory). Inject per-project CMS credentials with `INTLAYER_PROJECT_CREDENTIALS` — a JSON map of project path → `{ "clientId", "clientSecret" }`.

Older CI/CD pages and Context7 snippets may still show `npx intlayer ci fill`. Rewrite those to `bunx intlayer fill --ci`.

Suggested scripts (adapt to `bunx`):

```json
{
  "intlayer:build": "intlayer build",
  "intlayer:watch": "intlayer build --watch",
  "intlayer:test": "intlayer test",
  "intlayer:fill": "intlayer fill",
  "intlayer:push": "intlayer push",
  "intlayer:pull": "intlayer pull"
}
```

Use fill/push/pull/extract/scan only when AI fill, CMS, or audits are in scope.

## Visual editor

1. Set `editor.enabled: true` plus `editor.applicationURL`.
2. Dashboard client: `editor.clientId` / `editor.clientSecret` from https://app.intlayer.org/projects.
3. `IntlayerProvider` wraps strings in editor `IntlayerNode` proxies (`postMessage` to the iframe) when the editor is on. Disable per tree with `disableEditor`.
4. `build.minify` field-renaming is **skipped** while the editor is enabled (editor resolves by `keyPath`).
5. Self-host: override `editor.cmsURL` and `editor.backendURL`.

`@intlayer/editor` is optional the same way as analytics: missing package ⇒ no-op / tree-shaken.

## CMS + live sync

- `dictionary.location`: `local` | `remote` | `hybrid`.
- Push local dictionaries, edit in CMS, pull back — or keep hybrid.
- `editor.liveSync` fetches remote dictionaries at runtime (dev start / prod build as configured). Types default `true`; confirm against the installed package.
- Programmatic access: `@intlayer/api` (OAuth2 `client_credentials`; fetch/push dictionaries from scripts). Do not put API secrets in client bundles.

## AI fill

Configure `ai.provider` / `model` / `apiKey` / `applicationContext`. Per-dictionary `description` and `fill` refine targets. `ai.dataSerialization`: `json` (reliable) or `toon` (fewer tokens). Then `bunx intlayer fill`.

`requiredLocales` + `strictMode` determine what “missing” means for `intlayer test` and fill.

## MCP / LSP / agent extras

Official DX extras (not required for Start i18n):

- MCP: `bunx intlayer init mcp` — local `bunx @intlayer/mcp`, remote `https://mcp.intlayer.org` — https://intlayer.org/doc/mcp-server
- LSP: editor diagnostics for dictionaries
- They also ship agent skill snippets inside the engine; this repo skill is independent — do not load those files as a substitute for this folder.

## `@intlayer/analytics` (9.0+, default-on when installed as of 9.3.3)

Optional companion. Install if optional deps were skipped:

```bash
bun add @intlayer/analytics
```

Needs `editor.clientId` (project key + enable switch) and uses `editor.backendURL` as ingest (`POST {backendURL}/api/analytics/events`). Uninstalled ⇒ `INTLAYER_ANALYTICS_ENABLED=false`, dynamic import no-op, zero bundle cost.

Events (batched ~20s, anonymous SHA-256 session, country-only geo, no query strings by default):

| Event | Source |
| --- | --- |
| `page_view` | `IntlayerProvider` (load, locale change) |
| `content_exposure` | `useIntlayer` resolution (coalesced per flush window) |
| `conversion` | `useConversion()` |

A/B without flicker (9.5 React path):

```ts
import { useConversion, useExperiment, useIntlayer } from "react-intlayer";

const { variant, isAssigned } = useExperiment("homepage-hero", [
  "control",
  "black_friday",
]);
const content = useIntlayer("hero-banner", { variant });

const trackConversion = useConversion();
trackConversion({
  experimentKey: "homepage-hero",
  variant: "black_friday",
  goal: "cta_click",
});
```

`useExperiment(experimentKey, variants, weights?)` assigns deterministically per session (no round-trip), records exposure once per mount, and treats the first variant as control until `isAssigned`. Same hooks also export from `react-intlayer/analytics`.

Lower-level (non-React / 9.4 style) still works:

```ts
import { getGlobalAnalyticsClient } from "@intlayer/analytics/client";

const client = getGlobalAnalyticsClient();
const variant = client?.getVariant("homepage-hero", ["control", "black_friday"]);
```

`getVariant(experimentKey, variants)` is a pure function of session id + key. Prefer `useExperiment` in React on 9.5+. Tune `analytics.enabled`, `flushInterval`, `sampleRate`. Dashboard: audience, content-stats, experiment z-test. Bot traffic is filtered (9.4).

React / Next / React Native via `react-intlayer` only today; Vue/Svelte/etc. bindings are planned.
