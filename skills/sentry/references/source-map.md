# Source Map

Research snapshot: **2026-08-06**.

## Versions

| Line | Package examples | Version |
|---|---|---|
| JS/TS SDKs (sync together) | `@sentry/browser`, `@sentry/node`, `@sentry/react`, `@sentry/nextjs`, `@sentry/vue`, `@sentry/sveltekit`, `@sentry/nestjs`, `@sentry/cloudflare`, `@sentry/bun`, `@sentry/elysia`, `@sentry/hono`, `@sentry/tanstackstart-react`, `@sentry/effect`, `@sentry/profiling-node`, … | **10.69.0** |
| Bundler plugins | `@sentry/vite-plugin`, `@sentry/webpack-plugin`, `@sentry/esbuild-plugin`, `@sentry/rollup-plugin` | **5.4.0** |
| Bundler core | `@sentry/bundler-plugin-core` | **5.3.0** |
| CLI | `@sentry/cli` | **3.6.2** |
| Wizard | `@sentry/wizard` | **7.0.1** |
| Electron | `@sentry/electron` | **7.16.0** |
| Capacitor | `@sentry/capacitor` | **4.2.0** |
| React Native | `@sentry/react-native` | **8.22.0** |

Keep all **10.x** app SDK packages on the same version. Do not equate plugin/CLI/RN/Electron versions with the JS SDK line.

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

Prefer Exa / Context7 for live refresh over memorized snippets.

## Refresh

```sh
bun info @sentry/node
bun info @sentry/nextjs
bun info @sentry/vite-plugin
npm view @sentry/node version dist-tags
npm view @sentry/wizard version
```

## Stale-doc traps

- `new BrowserTracing()` / `@sentry/tracing` — use `browserTracingIntegration()` on modern SDKs.
- Installing both `@sentry/browser` and a framework SDK (`@sentry/react`, `@sentry/nextjs`) in the same bundle.
- `sendDefaultPii` without knowing it is deprecated in favor of `dataCollection` (since **10.57.0**).
- Assuming wizard `@sentry/wizard -i nextjs` is the only installer — TanStack Start docs also document `bunx sentry@latest init`.
- Pinning `@sentry/vite-plugin` to `10.x` (plugins are on **5.x**).
- Calling `Sentry.init()` inside browser extensions / shared hosts.
- Node: initializing after importing Express/DB clients — breaks auto-instrumentation.
- Expecting console-thrown errors from DevTools to appear in Sentry (sandboxed).
