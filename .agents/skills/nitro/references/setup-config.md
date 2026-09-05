# Setup and Configuration

## Scaffold

Require latest LTS of Node, Bun, or Deno.

```bash
bunx create-nitro-app
```

Follow the CLI. Dev server is typically port **3000**.

## Add Nitro to Vite

```bash
bun add nitro vite
```

```ts
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [nitro()],
  nitro: {
    // optional inline Nitro options
  },
});
```

Point Nitro at server sources (Vite apps usually nest under `server/`):

```ts
import { defineConfig } from "nitro";

export default defineConfig({
  serverDir: "./server",
});
```

Then `server/api/test.ts` → `/api/test`. `vite build` emits frontend + server into `.output/`.

With Vite, unmatched routes default to SPA `index.html` (see [assets-renderer.md](assets-renderer.md)).

## Config files

`defineConfig` from `"nitro"`. Loaded via c12 from project root (CLI cwd). First match wins:

- `nitro.config.{ts,js,mjs,cjs,mts,cts,json,jsonc,json5,yaml,yml,toml}`
- `.config/nitro.*` / `.config/nitro.config.*`

Recommended: `nitro.config.ts`. Optional `.nitrorc` (`key=value`) merges at lower priority.

Vite: also `nitro: { }` in `vite.config.ts`.

### Environment-specific

c12 `$development` / `$production`. Env name is `"development"` during `nitro dev` and `"production"` during `nitro build`.

```ts
export default defineConfig({
  $development: { debug: true },
  $production: { minify: true },
});
```

`extends: "./base.config"` to share presets.

`srcDir` is **deprecated** — use `serverDir`.

## Directory options

| Option | Default | Role |
| --- | --- | --- |
| `rootDir` | `.` | Project root |
| `serverDir` | `false` | Enable (`"server"` or `"./"`) for scanned server files |
| `buildDir` | `node_modules/.nitro` | Build scratch |
| `output.dir` | `.output` | Production tree |
| `output.serverDir` | `.output/server` | Server bundle |
| `output.publicDir` | `.output/public` | Public assets |

## Process env (builder)

| Variable | Role |
| --- | --- |
| `NITRO_PRESET` | Production preset override |
| `NITRO_COMPATIBILITY_DATE` | Preset feature date |
| `NITRO_APP_BASE_URL` | App base URL (default `/`) |

`preset` auto-detects in known CI. Dev preset is always `nitro_dev`. Default production without detect: runtime-based (`node`, or `bun`/`deno` when running there). `defaultPreset` is the fallback when nothing is detected.

`compatibilityDate`: `YYYY-MM-DD` to opt into newer provider features. If omitted, Nitro uses `"latest"` behavior.

## Runtime config

Declare keys in `runtimeConfig`. Access with `useRuntimeConfig()` from `"nitro/runtime-config"`. Namespace `nitro` is reserved.

Only keys declared in config can be overridden by env — you cannot invent keys from env alone.

Mapping: nested camelCase → `NITRO_` + `UPPER_SNAKE`. Example `database.host` → `NITRO_DATABASE_HOST`.

Values must be JSON-serializable. `undefined`/`null` become `""`.

`.env` and `.env.local` apply in **development only**. Production: platform env with `NITRO_` prefix.

Secondary prefix:

```ts
runtimeConfig: {
  nitro: { envPrefix: "APP_" },
  apiToken: "",
}
```

Then both `NITRO_API_TOKEN` and `APP_API_TOKEN` apply.

Experimental `experimental.envExpansion`: expand `{{VAR_NAME}}` inside runtime config strings at runtime.

Prefer `useRuntimeConfig()` over scattering `process.env` in ambient module scope.

## Commands

Prefer project scripts. Typical:

```bash
bunx nitro dev
bunx nitro build
bunx nitro task list   # when experimental.tasks
bunx nitro task run db:migrate
```

Vite apps: `bun run dev` / `bun run build` with the `nitro()` plugin.

## Feature flags

```ts
export default defineConfig({
  features: {
    websocket: true,
    runtimeHooks: true, // auto if any plugin exists
  },
  experimental: {
    database: true,
    tasks: true,
    openAPI: true,
    asyncContext: true,
    envExpansion: true,
    typescriptBundlerResolution: true,
  },
  static: false, // true → prerender-oriented static mode
});
```

Treat `experimental.*` as unstable. Prefer top-level `openAPI` for OpenAPI options once the flag is on.
