# Source Map

Research snapshot: **2026-10-01**.

## Versions

| Line | Package examples | Version |
|---|---|---|
| JS/TS SDKs (sync together) | `@sentry/browser`, `@sentry/node`, `@sentry/react`, `@sentry/nextjs`, `@sentry/vue`, `@sentry/sveltekit`, `@sentry/nestjs`, `@sentry/cloudflare`, `@sentry/bun`, `@sentry/elysia`, `@sentry/hono`, `@sentry/tanstackstart-react`, `@sentry/effect`, `@sentry/profiling-node`, `@sentry/server-utils`, `@sentry/bundler-plugins`, … | **11.2.0** (`latest`, 2026-10-01; 11.0.0 shipped 2026-09-23) |
| Previous major (maintenance) | same packages under dist-tag `v10` | **10.75.3** |
| Standalone bundler plugins | `@sentry/vite-plugin`, `@sentry/webpack-plugin`, `@sentry/esbuild-plugin`, `@sentry/rollup-plugin` | **5.4.0** |
| Bundler core | `@sentry/bundler-plugin-core` | **5.3.0** |
| CLI (legacy binary) | `@sentry/cli` (`sentry-cli`) | **3.8.0** |
| CLI (new) | `sentry` (`bunx sentry@latest init`) | **0.45.0** |
| Wizard | `@sentry/wizard` | **8.0.0** (installs SDK `^11`) |
| Electron | `@sentry/electron` | **7.20.0** (still on JS SDK 10.75) |
| Capacitor | `@sentry/capacitor` | **4.4.0** (still on JS SDK 10.69) |
| React Native | `@sentry/react-native` | **8.29.0** (still on JS SDK 10.75) |

Keep all **11.x** app SDK packages on the same version. Do not equate standalone plugin/CLI/RN/Electron/Capacitor versions with the JS SDK line. Electron, Capacitor, and React Native wrap JS SDK **10.x** internally — do not force `@sentry/*` 11 next to them.

New/removed in v11:

- **New:** `@sentry/bundler-plugins` (`/vite`, `/webpack`, `/esbuild`, `/rollup`, `/core`) — lives in the SDK monorepo and versions in lockstep with the SDK; the meta-framework SDKs use it. Official per-bundler guides still document the standalone `@sentry/vite-plugin` etc. on 5.x.
- **New:** `@sentry/server-utils` — channel-based (orchestrion) instrumentation and AI integrations moved here from `@sentry/core`; platform SDKs re-export what users need.
- **Removed:** `@sentry/types` (import types from `@sentry/core`), `@sentry/node-core` (merged into `@sentry/node`), `@sentry/tanstackstart` (use `@sentry/tanstackstart-react`). The old packages still resolve on npm at 10.x — do not install them next to 11.x.

## Canonical docs

1. https://docs.sentry.io/
2. https://docs.sentry.io/platforms/
3. https://docs.sentry.io/platforms/javascript/
4. https://docs.sentry.io/platforms/javascript/guides/ (framework guides)
5. https://docs.sentry.io/product/
6. https://docs.sentry.io/cli/
7. https://github.com/getsentry/sentry-javascript
8. https://github.com/getsentry/sentry-javascript-bundler-plugins
9. https://getsentry.github.io/sentry-release-registry/
10. Marketing / product overview: https://sentry.io/

Context7 library ids:

- `/getsentry/sentry-javascript` — SDK monorepo / APIs
- `/websites/sentry_io_platforms` — platform guides
- `/getsentry/sentry-docs` — full docs corpus
- v10→v11 migration: https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/ and https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md

Prefer live docs (Context7, official pages, `MIGRATION.md`, GitHub releases) over memorized snippets.

## Refresh

```sh
bun info @sentry/node
bun info @sentry/nextjs
bun info @sentry/vite-plugin
npm view @sentry/node version dist-tags
npm view @sentry/wizard version
gh release list -R getsentry/sentry-javascript -L 10
```

## Stale-doc traps

- `new BrowserTracing()` / `@sentry/tracing` — use `browserTracingIntegration()` on modern SDKs.
- Installing both `@sentry/browser` and a framework SDK (`@sentry/react`, `@sentry/nextjs`) in the same bundle.
- `sendDefaultPii` — deprecated in 10.57.0 and **removed in 11.0.0**. Unset `dataCollection` in v11 now collects user info, cookies, headers, bodies, DB query data, and GenAI inputs/outputs by default.
- `enableLogs` / `_experiments.enableLogs` / `enableMetrics` — removed in v11; logs and metrics are captured when you call `Sentry.logger.*` / `Sentry.metrics.*` or add a logging integration.
- `node --require ./instrument.js` — unsupported in v11; use `node --import ./instrument.js` (works for CJS too).
- `beforeSendTransaction` / `ignoreTransactions` — no-ops in v11 (span streaming is default); use `beforeSendSpan` (streamed format) and `ignoreSpans`.
- `import { withSentryConfig } from '@sentry/nextjs'` — v11 moved it to `@sentry/nextjs/config`.
- `skipOpenTelemetrySetup` — replaced by `enableOpenTelemetrySetup` (inverted).
- Assuming wizard `@sentry/wizard -i nextjs` is the only installer — TanStack Start docs document `bunx sentry@latest init` (the new `sentry` CLI package) as primary.
- Pinning `@sentry/vite-plugin` to `10.x`/`11.x` (standalone plugins are on **5.x**; only `@sentry/bundler-plugins` tracks the SDK version).
- Calling `Sentry.init()` inside browser extensions / shared hosts.
- Node: initializing after importing Express/DB clients — breaks auto-instrumentation. v11 can no longer warn about this (`disableInstrumentationWarnings` removed).
- Expecting console-thrown errors from DevTools to appear in Sentry (sandboxed).
