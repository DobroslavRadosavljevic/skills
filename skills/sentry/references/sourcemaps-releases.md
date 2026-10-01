# Source Maps, Releases & CLI

Readable stacks and release health require **matching `release`**, uploaded artifacts, and (ideally) commit association.

## Bundler plugins (JS)

| Bundler | Package | Factory |
|---|---|---|
| Vite | `@sentry/vite-plugin` **5.4.x** | `sentryVitePlugin` |
| Webpack 5.1+ | `@sentry/webpack-plugin` | `sentryWebpackPlugin` |
| esbuild | `@sentry/esbuild-plugin` | `sentryEsbuildPlugin` |
| Rollup | `@sentry/rollup-plugin` | `sentryRollupPlugin` |

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  build: { sourcemap: "hidden" },
  plugins: [
    // …app plugins first…
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: ["./dist/**/*.map"],
      },
    }),
  ],
});
```

Rules:

- Enable source map generation (`hidden` / `hidden-source-map` preferred for clients).
- Put the Sentry plugin **after** other plugins.
- Plugins do **not** upload in typical watch/dev mode — verify with a production build.
- Auth: `SENTRY_AUTH_TOKEN` or `.env.sentry-build-plugin` (gitignore).
- If the plugin injects `release`, omit conflicting `release` in `Sentry.init` or make them identical.
- Delete or block public `.map` files after upload.

The official per-bundler guides still install the standalone 5.x plugins above. SDK v11 also ships `@sentry/bundler-plugins` (`/vite`, `/webpack`, `/esbuild`, `/rollup`), versioned in lockstep with the SDK and used internally by the meta-framework SDKs; it uses the new `sentry` CLI package instead of `@sentry/cli`. The `/webpack5` entry was removed in v11.

Framework helpers often wrap this. Prefer the framework guide when present. v11 build-option changes:

- Next.js: `withSentryConfig` from `@sentry/nextjs/config`.
- Astro / Nuxt / SvelteKit / React Router: `sourceMapsUploadOptions` was removed — move `org`, `project`, `authToken`, `sourcemaps`, `release` to the top level (`url`→`sentryUrl`; `enabled: false`→`sourcemaps: { disable: true }`).
- SvelteKit `sentrySvelteKit`, React Router `sentryReactRouter`, Remix `sentryRemixVitePlugin` import from their `/vite` subpaths.
- `unstable_sentry*PluginOptions` escape hatches are gone; `applicationKey`, `moduleMetadata`, and `sourcemaps.resolveSourceMap` are first-class build options.
- Automatic Vercel deploys use `VERCEL_TARGET_ENV` as the environment (no `vercel-` prefix).

## Sentry CLI

Package: `@sentry/cli` **3.x** (binary `sentry-cli`, 3.8.0 at snapshot). A separate new `sentry` package (binary `sentry`, 0.x) powers `bunx sentry@latest init` and the v11 bundler plugins; keep using `sentry-cli` commands below for release/source map scripting until the docs move them.

Common flows:

```sh
bunx sentry-cli login
bunx sentry-cli releases new "$RELEASE"
bunx sentry-cli sourcemaps upload --release="$RELEASE" ./dist
bunx sentry-cli releases set-commits "$RELEASE" --auto
bunx sentry-cli releases finalize "$RELEASE"
bunx sentry-cli deploys new --release="$RELEASE" --env=production
```

Use CLI when the bundler plugin cannot run (odd pipelines, mobile hybrids, post-build artifact folders).

## Auth token scopes

Organization token or personal token with project read/write and release admin (wording varies in UI). Never embed the auth token in client bundles — only DSN is public.

## Release naming

Pick a stable scheme and keep it consistent across client, server, and upload:

- Git SHA
- `package.json` version + SHA
- CI build number

Example: `my-app@1.4.2+abc1234`

## Next.js note

`withSentryConfig(nextConfig, { org, project, authToken, useRunAfterProductionCompileHook: true })` can upload after compile for faster builds on supported Next versions — follow current Next.js Sentry guide.

## Troubleshooting uploads

- No stacks → maps not uploaded, wrong `release`, or missing `urlPrefix` / path rewrite
- Partial maps → `sourcemaps.assets` globs too narrow
- esbuild `splitting: true` → may need legacy upload mode or CLI (see Sentry legacy uploading docs)
- Token missing in CI → silent skip; check build logs
- Ad-blockers blocking ingest → consider `tunnel`
