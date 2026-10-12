# XState Source Map

Snapshot date: 2026-10-12. Use this file to refresh facts before relying on version-specific behavior.

## Current Package Evidence

npm `dist-tags.latest` at this snapshot (publish date of that version):

| Package | Latest | Published | Other tags |
| --- | --- | --- | --- |
| `xstate` | `5.33.2` | 2026-09-15 | `alpha` `6.0.0-alpha.65` |
| `@xstate/react` | `6.1.0` | 2026-02-26 | `alpha` `7.0.0-alpha.4` |
| `@xstate/vue` | `5.0.1` | 2026-07-14 | |
| `@xstate/svelte` | `5.0.0` | 2025-06-19 | |
| `@xstate/solid` | `2.0.0` | 2025-06-19 | |
| `@xstate/store` | `4.3.0` | 2026-10-08 | `alpha` `5.0.0-alpha.6` |
| `@xstate/store-react` | `2.1.0` | 2026-10-08 | |
| `@xstate/store-vue` / `-svelte` / `-angular` / `-preact` | `2.0.0` | 2026-09-30 | |
| `@xstate/store-solid` | `2.0.1` | 2026-10-08 | |
| `@xstate/graph` | `3.0.4` | 2025-05-31 | core also ships `xstate/graph` |
| `@statelyai/inspect` | `0.7.2` | 2026-06-14 | |
| `@statelyai/agent` | `1.1.6` | 2024-09-28 | `next` `2.0.0-next.5`, `alpha` `2.0.0-alpha.28` |
| `statelyai` (CLI) | `0.12.6` | 2026-10-09 | |
| `@statelyai/mcp` | `0.16.0` | 2026-10-06 | |
| `@statelyai/sdk` | `0.38.0` | 2026-10-09 | |
| `eslint-plugin-xstate` | `3.2.1` | 2023-12-16 | |

Legacy or deprecated: `@xstate/test` `0.5.1` (deprecated, replaced by `xstate/graph` path utilities), `@xstate/inspect` `0.8.0` (replaced by `@statelyai/inspect`), `@xstate/fsm` `2.1.0` (prefer core), `@xstate/cli` typegen (XState v4 only), `@xstate/immer` `0.3.3`. `@xstate/effect` is `0.1.0-alpha.7`.

Peer ranges worth knowing:

- `@xstate/react@6.1.0`: `react ^16.8 || ^17 || ^18 || ^19`, `xstate ^5.28.0`.
- `@xstate/store-react@2.1.0`: `react ^18 || ^19`; depends on `@xstate/store ^4.3.0`.

## Refresh Commands

Run these from a project root (`bun info` needs a `package.json`):

```bash
bun info xstate
```

```bash
bun info @xstate/react peerDependencies
```

```bash
bun info @xstate/store
```

Changelogs live at `packages/<pkg>/CHANGELOG.md` in the monorepo. When docs and code disagree, trust the package source and changelog.

## Official Sources

- Docs home: `https://stately.ai/docs`
- XState overview: `https://stately.ai/docs/xstate`
- Cheatsheet: `https://stately.ai/docs/cheatsheet`
- Setup and TypeScript: `https://stately.ai/docs/setup`, `https://stately.ai/docs/typescript`
- Actors: `https://stately.ai/docs/actors`, `https://stately.ai/docs/invoke`, `https://stately.ai/docs/spawn`, `https://stately.ai/docs/system`
- Persistence and inspection: `https://stately.ai/docs/persistence`, `https://stately.ai/docs/inspection`
- React: `https://stately.ai/docs/xstate-react`
- Vue, Svelte: `https://stately.ai/docs/xstate-vue`, `https://stately.ai/docs/xstate-svelte`
- Store: `https://stately.ai/docs/xstate-store`
- Testing and graph: `https://stately.ai/docs/testing`, `https://stately.ai/docs/graph`
- Migration v4 → v5: `https://stately.ai/docs/migration`
- Stately Studio: `https://stately.ai/docs/studio`
- Agents: `https://stately.ai/docs/agents`
- Monorepo: `https://github.com/statelyai/xstate` (`main` = v5 stable, `next` = v6 alpha)
- Docs source: `https://github.com/statelyai/docs` (`content/docs/*.mdx`)
- Examples: `https://github.com/statelyai/xstate/tree/main/examples`

Context7 library IDs, when that docs tool is available: resolve `xstate` first; prefer the official `statelyai` entries.

## Source Files For Verification

- Core exports: `packages/core/src/index.ts`
- `setup`: `packages/core/src/setup.ts`
- Actor runtime: `packages/core/src/createActor.ts`, `packages/core/src/system.ts`
- Actor logic creators: `packages/core/src/actors/*.ts`
- Built-in actions: `packages/core/src/actions/*.ts`
- Guards: `packages/core/src/guards.ts`
- Pure transition helpers: `packages/core/src/transition.ts`, `packages/core/src/getNextSnapshot.ts`
- Graph and model-based testing: `packages/core/src/graph/*` (published as `xstate/graph`)
- React adapter: `packages/xstate-react/src/*`
- Store: `packages/xstate-store/src/*`, adapters in `packages/xstate-store-*/src/*`
