# Stately Tooling and Ecosystem

Every official tool and library around XState v5 beyond core and the framework adapters: status, install, a minimal snippet, and when to use it. Covers `@statelyai/inspect`, Stately Studio (editor, simulate, import/export, GitHub sync, Studio API, embeds, versions, Sky), the `statelyai` CLI, `@statelyai/mcp`, `@statelyai/sdk`, `@statelyai/graph` / `@statelyai/flow`, `@statelyai/agent`, the VS Code extension, `eslint-plugin-xstate`, and legacy or alpha packages (`@xstate/immer`, `@xstate/fsm`, `@xstate/inspect`, `@xstate/cli`, `@xstate/test`, `@xstate/graph`, `@xstate/effect`, `@xstate/scxml`). Versions are npm `latest` as of this writing; re-check with `npm view <pkg> version dist-tags deprecated peerDependencies`.

## Contents

- Status matrix
- Decision guide
- `@statelyai/inspect`
- Stately Studio
- `statelyai` CLI
- `@statelyai/mcp`
- `@statelyai/sdk`
- `@statelyai/graph` and `@statelyai/flow`
- `@statelyai/agent`
- XState VS Code extension
- `eslint-plugin-xstate`
- Legacy and deprecated packages
- Alpha packages for XState v6
- SCXML
- Data and security notes
- Pitfalls, Do / Don't, Stale API

## Status matrix

| Package / tool | Version | Status | Works with xstate 5 | Use for |
| --- | --- | --- | --- | --- |
| `@statelyai/inspect` | 0.7.2 | Current (0.x) | Yes (peer `^5.5.1`) | Live inspection in browser, over WebSocket, or via Stately's hosted relay |
| Stately Studio (stately.ai, editor.stately.ai) | hosted | Current; several features paid or beta | Yes | Visual modeling, simulation, sharing, export, GitHub sync |
| `statelyai` (CLI) | 0.12.6 | Current, pre-1.0 | Yes (min `defaultXStateVersion` 5) | Scan, open in visual editor, push/pull to Studio, semantic diff in CI |
| `@statelyai/mcp` | 0.16.0 | Current, pre-1.0 | Yes | MCP tools: validate, simulate, paths, convert, diff, visualize machines |
| `@statelyai/sdk` | 0.38.0 | Public alpha | Yes (and v6) | Embed the editor, Studio API client, hosted inspector |
| `@statelyai/graph` | 2.5.1 | Current | Optional peer `^5.19.0` | Generic JSON graph IR, algorithms, format converters |
| `@statelyai/flow` | 0.12.0 | Pre-1.0 | Indirect | Framework-agnostic flow visualization on top of `@statelyai/graph` |
| `@statelyai/agent` | 1.1.6 latest; 2.0.0-alpha.28 | 1.x stale; 2.0 alpha targets XState v6 alpha | 1.x only | State-machine-guided LLM agents |
| XState VS Code extension (`statelyai.stately-vscode`) | marketplace | "Not fully supported in v5" | Partial | Visual editor in the IDE, autocomplete, jump-to-definition |
| `eslint-plugin-xstate` | 3.2.1 (Dec 2023) | Community, unmaintained since 2023 | Yes (default config) | Lint machine configs; ESLint 8 eslintrc only |
| `@xstate/graph` | 3.0.4 | Superseded by `xstate/graph` (xstate ≥ 5.20) | Yes (peer `^5.19.4`) | Only when stuck below xstate 5.20 |
| `@xstate/test` | 0.5.1 | Deprecated on npm | No (peer xstate 4) | Nothing new; use `xstate/graph` |
| `@xstate/immer` | 0.3.3 | Deprecated in v5 docs | No (published peer `xstate ^4.37.2`) | Nothing new; use `immer` inside `assign` |
| `@xstate/fsm` | 2.1.0 | Deprecated in v5 docs | No (separate v4-era API) | Nothing new; use `xstate` or `@xstate/store` |
| `@xstate/inspect` | 0.8.0 | Deprecated; replaced by `@statelyai/inspect` | No (peer xstate 4) | Nothing new |
| `@xstate/cli` (typegen) | 0.5.17 | v4 only | No | Nothing; v5 has no typegen |
| Stately Visualizer (stately.ai/viz) | hosted | Deprecated, unmaintained | No | Nothing |
| `@statelyai/sky` (Stately Sky) | 0.0.14 | Beta | Yes | Hosted, multiplayer machine actors (`actorFromStately`) |
| `@xstate/effect` | 0.1.0-alpha.7 | Alpha | No (peer `xstate ^6.0.0-alpha.65`, `effect ^4`) | v6 alpha + Effect experiments only |
| `@xstate/scxml` | 1.0.0-alpha.1 | Alpha | No (peer `xstate ^6.0.0-alpha.61`) | v6 alpha SCXML import only |
| `@xstate/test@alpha` | 2.0.0-alpha.2 | Alpha | No (peer xstate v6 alpha, vitest, fast-check) | v6 alpha model/property-based tests only |

npm `deprecated` flags: only `@xstate/test` is flagged. `@xstate/immer`, `@xstate/fsm`, `@xstate/inspect`, and `@xstate/graph` are marked deprecated in docs but not on npm, so installs do not warn. Check the peer range before trusting an install.

## Decision guide

- Debug a running app: `@statelyai/inspect` (`createBrowserInspector` in the browser, `createWebSocketInspector` for Node). Details are in `persistence-inspection.md`.
- Edit a machine visually while keeping code as the source of truth: `bunx statelyai open src/checkout.machine.ts`. Fall back to Studio's import/export when the CLI cannot parse the file.
- Keep Studio and the repo in sync: `statelyai init` + `push` / `pull`, or Studio's Connect GitHub repo (paid, beta).
- Fail CI when a machine drifts from the Studio version: `bunx statelyai diff <file> <machineId> --fail-on-changes`.
- Let a coding agent validate, simulate, or visualize machines: `@statelyai/mcp` (local stdio or hosted HTTP).
- Embed an editor or viewer in your own product: `@statelyai/sdk` `createStatelyEmbed`; public read-only diagrams: Studio embed URL.
- Generate test paths in code: `xstate/graph` (see `testing-graph.md`). Studio's Tests panel can also generate path code (paid beta).
- Lint configs: `eslint-plugin-xstate` only on ESLint 8 or through a compat layer; otherwise rely on TypeScript with `setup({ types })`.
- LLM agents: with stable XState v5, `@statelyai/agent` 1.1.6 exists but pins old AI SDK versions; the actively developed 2.0 alpha requires the XState v6 alpha. Prefer plain XState actors (`fromPromise` around your AI SDK call) unless you accept those trade-offs.

## `@statelyai/inspect`

Install as a dev dependency and pass the inspector's `inspect` observer to the root actor. Exports (0.7.2): `createBrowserInspector`, `createWebSocketInspector`, `createSkyInspector`, `createInspector`, `createBrowserReceiver`, `createWebSocketReceiver`; server helpers live in `@statelyai/inspect/server`.

```bash
bun add -d @statelyai/inspect
```

```ts
import { createActor } from 'xstate';
import { createBrowserInspector } from '@statelyai/inspect';

const inspector = createBrowserInspector(); // opens the Stately inspector window
const actor = createActor(machine, { inspect: inspector.inspect });
actor.start();
```

Gate it behind a dev flag so it never ships to production. `createSkyInspector` streams to Stately's hosted relay; treat the generated URL as a secret. `@statelyai/sdk` also exports a different `createInspector` (hosted Sky relay, XState v5 and v6); do not mix the two `createInspector` functions up.

## Stately Studio

Hosted visual editor at stately.ai (new machine: `state.new`; editor host `editor.stately.ai`). Machines are XState JSON under the hood; exports target XState v5 (a v4 toggle remains).

| Feature | What it does | Notes |
| --- | --- | --- |
| Design mode | Draw states, transitions, guards, actions, actors, tags, descriptions, notes, colors, assets | Colors and notes are not exported to code |
| Simulate mode | Click events to walk the machine; `always` fires instantly; `after` timers run; event log with time travel | Disabled while the machine has errors |
| Live simulation | Share a running simulation by code or link | Paid |
| Import from code | Paste a `createMachine(...)` call (multiple machines supported) | Importing into an existing machine overwrites it |
| Sources panel | Attach code for named actions, actors, guards; templates for creators and built-ins | Inline implementations get generated names like `inline:(machine).a.b#entry[0]`; name them for clean round trips. Delay sources not supported |
| Export as code | JSON, JavaScript, TypeScript, Mermaid; Markdown and Stories (paid beta); CodeSandbox / StackBlitz | |
| Connect GitHub repo | Import machines from JS/TS files, auto-sync, open or update PRs, multiple branches | Paid beta; best under ~100 files. Default path for new files `src/stately-studio` |
| Import from GitHub URL | Replace `github.com` with `github.stately.ai` in a file URL | Works for private repos after granting access |
| Version history | Save, view, restore, copy, delete versions; hourly auto-snapshots | Paid; locked machines cannot be restored |
| Share | Embed URL (`stately.ai/registry/editor/embed/<id>?machineId=…&mode=Design\|Simulate&colorMode=light\|dark`), image URL, share URL | Embeds only for public or unlisted projects |
| Generate test paths | Shortest or simple paths; Playwright or custom output; dedupe and transition-coverage options | Paid beta; optional AI titles send the machine to OpenAI |
| Generate with AI / Generate React app | Create or extend flows from text; scaffold a React app | AI features send machine data to a model provider |
| Studio API | REST for projects, machines, versions, export | Paid; API keys scoped to a project or an account |
| Self-hosting | Run the editor from source with your own auth, persistence, and AI settings | Early preview; see `@statelyai/sdk` for the env vars |
| Stately Sky | Deploy a machine as a hosted, multiplayer actor | Beta, paid; see below |

Code annotations to preserve when editing machine files:

- `/** @xstate-layout ... */` above `createMachine` stores manual layout written by the VS Code extension. It is opaque; do not edit it by hand, and do not delete it unless the user wants layout reset.
- `@statelyai` ID comments are written by `statelyai push` to link a source machine to a Studio machine. Deleting one unlinks the machine.

**Stately Sky (beta).** Deploy from the editor's Deploy button, then connect from the app:

```ts
import { actorFromStately } from '@statelyai/sky';

const actor = actorFromStately({
  apiKey: process.env.STATELY_API_KEY!,
  url: process.env.SKY_URL!, // the URL copied from the editor's Deploy dialog
  sessionId: 'user-123', // shared id = shared actor; unique id = isolated actor
});
```

Sky is multiplayer by default: everyone with the same `sessionId` drives the same actor. It needs an API key in the client, so keep it to prototypes or put it behind your own server.

## `statelyai` CLI

Discovers XState machines in a repo and syncs them with Studio. Version 0.12.6. Run with `bunx statelyai <command>` or install globally with `bun add -g statelyai`.

| Goal | Command | Writes |
| --- | --- | --- |
| List local machines (no auth, no config) | `statelyai scan [--json]` | Nothing |
| Local-only config | `statelyai init --local --scan` | `statelyai.json` |
| Link to a Studio project | `statelyai init --scan [--name … --visibility Private\|Public\|Unlisted]` | Remote project + `statelyai.json` |
| Classify machines | `statelyai status [--json] [--auth]` | Nothing |
| Visual editing of local files | `statelyai open [file] [--source-update preserve\|rewrite] [--no-open]` | Source file on save; `.statelyai/local.json` sidecar for unlinked layout |
| Preview / upload | `statelyai push --dry-run`, `statelyai push [file]` | Remote machines; `@statelyai` IDs in source |
| Download | `statelyai pull [file \| machineId target]` | Linked files; new files under `newMachinesDir` |
| Semantic diff | `statelyai diff <a> <b> [--fail-on-changes]` | Nothing |
| Offline report | `statelyai verify --from-report report.json` | Local report |

Key facts:

- Discovery finds JS/TS files that import XState and call `createMachine(...)` or `setup(...).createMachine(...)`. Default `exclude` skips tests and specs.
- `statelyai.json` fields: `$schema`, `version` (`1.0.0`), `projectId`, `studioUrl`, `defaultXStateVersion` (min 5), `sourceUpdateStrategy` (`preserve` default, or `rewrite`), `include`, `exclude`, `newMachinesDir`.
- `diff` locators: a local JS/TS file, XState JSON, Stately graph JSON, Studio digraph JSON, a Studio machine ID, or a machine URL. It ignores entity IDs and layout/color-only changes. `--fail-on-changes` exits `1` on semantic differences.
- `pull` skips linked files with uncommitted Git changes. `--force` overwrites them and also allows full regeneration that drops surrounding comments and helpers; use it only when that is acceptable.
- Auth order: `STATELY_ACCESS_TOKEN`, `STATELY_API_KEY`, `NEXT_PUBLIC_STATELY_API_KEY`, then the stored login. `.env.local` is loaded. In CI pass a secret env var; set `CI=true` or `NO_COLOR=1` for plain output.
- `open` parses and writes back locally; it loads the file, its relative imports, and nearby package manifests (limits via `STATELY_SYNC_MAX_FILES`, `STATELY_SYNC_MAX_BYTES`).

```bash
bunx statelyai scan
bunx statelyai push --dry-run
bunx statelyai diff src/checkout.machine.ts machine_123 --fail-on-changes
```

## `@statelyai/mcp`

MCP server for state machine work. Version 0.16.0. Two modes:

- Local stdio: binary `stately-mcp` from `@statelyai/mcp`. Credentials from `STATELY_ACCESS_TOKEN`, `STATELY_API_KEY`, or the `statelyai login` store. `STATELY_API_BASE_URL` points it at a self-hosted API (default `https://editor.stately.ai/api`).
- Hosted Streamable HTTP endpoint: `https://mcp.stately.ai/mcp`, with Stately sign-in. Adds the hosted project/machine tools.

```json
{
  "mcpServers": {
    "stately": {
      "command": "bunx",
      "args": ["@statelyai/mcp"],
      "env": { "STATELY_ACCESS_TOKEN": "..." }
    }
  }
}
```

Tools (all registered read-only, non-destructive, idempotent):

| Tool | Purpose | Limits |
| --- | --- | --- |
| `validate_machine` | Deterministic syntax and graph checks; returns `ok` and `issues` | Does not typecheck or run code |
| `simulate_machine` | Run events and get a step trace (states, context, action names) | ≤ 100 events |
| `generate_graph_paths` | Shortest or simple paths with state/transition coverage | ≤ 5 paths per call |
| `convert_machine` | XState, SCXML, XGraph, DigraphDef, Mermaid, D2 → XState, SCXML, XGraph, D2 | |
| `diff_machines` | Structural diff with `semanticChanges`; optional patches | |
| `apply_machine_patches` | Apply semantic patches in memory, e.g. `{ op: 'createTransition', sourceId, targetId, eventType }` | Never writes files |
| `review_machine_implementation` | Compare an edited machine against the original and intended patches; returns a Markdown behavior review | Never writes files or touches Git |
| `visualize_machine` | Interactive graph (MCP Apps) or PNG fallback | Graph capped at 500,000 bytes |
| `extract_machines_from_code` | Static extraction of machine configs from JS/TS (infers v5 vs v6) | No code execution |
| `list_machines`, `get_machine` | Read local workspace files | Only these two run fully locally |
| `list_stately_projects`, `get_stately_project`, `list_stately_project_machines`, `get_stately_machine`, `visualize_stately_machine` | Read hosted Studio resources | Need a credential |
| `verify`, `generate_test_paths`, `coverage_report` | Process verification reports | `verify` needs a host-supplied adapter; otherwise `verification_unavailable` |

Every tool except `list_machines` and `get_machine` sends the machine source to the configured Stately API, and the hosted API rejects calls without credentials. A good edit loop: inspect the machine, call `apply_machine_patches` for intended behavior, edit the source yourself, then call `review_machine_implementation` and `validate_machine`. MCP results do not replace TypeScript checks or `xstate/graph` tests in the repo.

## `@statelyai/sdk`

Public alpha (0.38.0); APIs may change between minor releases, so pin the exact version. Subpath exports include `./embed`, `./api`, `./inspect`, `./graph`, `./protocol`, `./relay`, `./node-relay`, `./studio`, `./auth`, `./oauth`, `./editor-host-protocol`.

```bash
bun add @statelyai/sdk@0.38.0
```

**Embed the editor.**

```ts
import { createStatelyEmbed } from '@statelyai/sdk';

const embed = createStatelyEmbed({ baseUrl: 'https://editor.stately.ai', apiKey: token });
embed.mount(document.getElementById('editor')!);
embed.init({ machine: machineConfig, format: 'xstate', mode: 'editing', theme: 'dark' });
embed.on('save', async ({ machineConfig, graph }) => {
  await saveMachine({ machineConfig, graph });
});
```

The `apiKey` is sent over `postMessage` after the handshake, not in the iframe URL; refresh it with `embed.setApiKey(token)`. Restrict viewers with `readOnly: true` and `capabilities: { edit: false, export: false, ai: false, simulate: false }`. Export formats include XState v5, XState v6 alpha, XState JSON, Mermaid, SCXML, and others.

**Studio API client.** Maps to the `/api/v1` contract on `editor.stately.ai` (do not call `stately.ai/registry` URLs directly; they are deprecated for clients).

```ts
import { createStatelyClient } from '@statelyai/sdk';

const studio = createStatelyClient({
  credential: { type: 'oauth', accessToken: process.env.STATELY_ACCESS_TOKEN! },
});
const projects = await studio.projects.list();
const machine = await studio.machines.get('machine-id'); // record has `definition` and maybe `graph`
const extracted = await studio.code.extractMachines({ code: sourceCode });
```

Methods: `auth.verify`, `projects.list/create/get/update/delete/listMachines`, `projects.ensure` (client-side helper), `machines.create/get/getVersion/update`, `code.extractMachines`. Pass `expectedUpdatedAt` on `machines.update` to reject stale writes. Errors are `StudioApiError` with `status` and `code`.

**Hosted inspector.** `createInspector()` from `@statelyai/sdk` streams to `wss://sky.stately.ai` and prints a viewer URL with a `?r=` room id. That room id is a bearer capability: anyone with the URL sees the data. Default `launch: 'none'` is safe for CI. Self-host the relay with `bunx @statelyai/sdk relay` and pass `url` / `inspectorBaseUrl`.

## `@statelyai/graph` and `@statelyai/flow`

`@statelyai/graph` (2.5.1) is a general graph library on plain JSON objects: create/update nodes and edges, hierarchy and ports, algorithms (shortest paths, coverage paths, topological sort, components), layouts (ELK, dagre, Graphviz, d3-force, ...), and converters (DOT, Mermaid, D2, GraphML, GEXF, JGF, xyflow, Cytoscape, ...), each on its own subpath. The `@statelyai/graph/xstate` subpath exports `createGraphFromMachine(machine, options?)` and `getSerializedSnapshot(snapshot)`. Layout and parser adapters need optional peers (for example `elkjs`, `dotparser`, `fast-xml-parser`).

`@statelyai/flow` (0.12.0) is a framework-agnostic flow visualization engine built on `@statelyai/graph`.

Use them to render or convert machine graphs in your own tools. For testing XState machines, `xstate/graph` is the better fit: it traverses real snapshots, including context and guards.

## `@statelyai/agent`

Three release lines exist on npm:

| Tag | Version | Published | Peers / deps | Meaning |
| --- | --- | --- | --- | --- |
| `latest` | 1.1.6 | Sep 2024 | deps `xstate ^5.18.2`, `ai ^3.4.6`, `@ai-sdk/openai ^0.0.40` | Last stable; old AI SDK |
| `next` | 2.0.0-next.5 | Feb 2025 | `xstate ^5.19.2`, peer `ai ^4.1.36` | Abandoned preview line |
| `alpha` | 2.0.0-alpha.28 | Oct 2026 | peers `xstate 6.0.0-alpha.64` (exact), `ai ^7`, `openai`, `ajv`, `@opentelemetry/api` | Active line; what stately.ai docs describe |

The Stately docs describe 2.0 ("Version 2.0 is currently in alpha... pin an exact version"). Its API is `setupAgent`, `runAgent`, `runAgentStream`, `initialAgentStep` / `transitionAgentStep`, `getInteraction` / `eventFromInteraction`, `isAgentIdle`, with subpaths `@statelyai/agent/ai-sdk` (`createAiSdkExecutors`), `/openai`, `/machines` (tool loop, router, supervisor, handoff presets), `/testing`, `/log`, `/otel`, `/validate`. It requires the XState v6 alpha; do not add it to a stable v5 app.

1.1.6 API (verified from its type declarations): `createAgent({ id?, name?, description?, model, events, context?, planner?, adapter?, ... })` where `events` maps event types to Zod schemas; agent methods `decide`, `generateText`, `streamText`, `interact(actorRef, getInput?)`, `onMessage`, memory getters/adders; actor logic creators `fromDecision(agent)`, `fromText(agent)`, `fromTextStream(agent)`.

```ts
import { createAgent, fromDecision } from '@statelyai/agent';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const agent = createAgent({
  name: 'triage',
  model: openai('gpt-4o-mini'),
  events: {
    'agent.escalate': z.object({ reason: z.string() }).describe('Hand off to a human'),
    'agent.reply': z.object({ text: z.string() }).describe('Answer the customer'),
  },
});
// Use fromDecision(agent) as an invoked actor, or agent.interact(actor, getInput)
// to let the agent pick the next event for a running actor.
```

Check the installed package's `.d.ts` for the exact `getInput` and `decide` option shapes before relying on them. When a project only needs "call a model in one state", a named `fromPromise` actor around the current AI SDK is simpler and easier to test with `machine.provide()`.

## XState VS Code extension

Marketplace id `statelyai.stately-vscode` (also on Open VSX). Features: open any `createMachine` in the visual editor (`XState: Open Visual Editor`, or the code lens), autocomplete for targets and initial states, linting, jump to definition for targets/actions/guards/actors, refactors, and the `xsm` snippet. Add `// xstate-ignore-next-line` above a machine to skip it. Use spaces for indentation; tab indentation is known to break it. Docs warn it is "not fully supported in XState version 5", and its typegen feature is v4 only. For v5 visual editing, prefer `statelyai open`, which shares its layout sidecar with VS Code.

## `eslint-plugin-xstate`

Community plugin (by rlaffers), 3.2.1, last published Dec 2023. Peer `eslint ^8.40.0`; it ships only eslintrc configs (no flat config). Configs: `plugin:xstate/recommended` and `plugin:xstate/all` (XState v5, the default), and `recommended_v4` / `all_v4`. Without a shareable config, set `settings.xstate.version`.

```bash
bun add -d eslint@8 eslint-plugin-xstate
```

```json
{
  "plugins": ["xstate"],
  "extends": ["plugin:xstate/recommended"]
}
```

Rules: `no-infinite-loop`, `no-imperative-action`, `no-ondone-outside-compound-state`, `invoke-usage`, `entry-exit-action`, `no-misplaced-on-transition`, `no-invalid-transition-props`, `no-invalid-state-props`, `no-async-guard`, `no-invalid-conditional-action`, `no-auto-forward` (in v5 `recommended`), `prefer-always`, `prefer-predictable-action-arguments` (v4 config), `spawn-usage` (v4 only), `no-inline-implementation`, `system-id`, `event-names`, `state-names`.

Notes:

- `all` sets `event-names` to `macroCase` and `state-names` to `camelCase`. If the codebase uses dot-separated event types (`form.submit`), configure or turn off `event-names`.
- By default it lints only code inside `createMachine`/`Machine` calls. Add `/* eslint-plugin-xstate-include */` at the top of files that export bare config objects.
- On ESLint 9 flat config you need a compat wrapper (for example `FlatCompat` from `@eslint/eslintrc`) and you are outside the declared peer range. Many of its checks are already covered by `setup({ types })` type errors in v5.

## Legacy and deprecated packages

Do not add these to v5 code. When you find them, migrate.

**`@xstate/immer` 0.3.3.** The published package peers on `xstate ^4.37.2`. Use Immer directly inside `assign`:

```ts
import { produce } from 'immer';
import { assign, setup } from 'xstate';

const todos = setup({
  types: {
    context: {} as { todos: { id: string; done: boolean }[] },
    events: {} as { type: 'todo.toggle'; id: string },
  },
}).createMachine({
  context: { todos: [] },
  on: {
    'todo.toggle': {
      actions: assign({
        todos: ({ context, event }) =>
          produce(context.todos, (draft) => {
            const todo = draft.find((t) => t.id === event.id);
            if (todo) todo.done = !todo.done;
          }),
      }),
    },
  },
});
```

**`@xstate/fsm` 2.1.0.** Tiny v4-era FSM with its own `createMachine`/`interpret` API. Replace with `xstate` (tree-shakable) for real statecharts, or `@xstate/store` for event-driven state without finite states.

**`@xstate/inspect` 0.8.0.** v4 inspector (`inspect({ iframe })`). Replace with `@statelyai/inspect` and the `inspect` option of `createActor`.

**`@xstate/cli` 0.5.17 (`xstate typegen`) and `tsTypes`.** Typegen is not supported in v5. Delete `*.typegen.ts` files and `tsTypes`; declare types with `setup({ types: { context, events, input, output, emitted, children, tags, meta } })`.

**`@xstate/test` 0.5.1 and `@xstate/graph` 1.x–3.x.** Use `xstate/graph` (`createTestModel`, `getShortestPaths`, ...). See `testing-graph.md`.

**Stately Visualizer (stately.ai/viz).** Deprecated and unmaintained. Use the Studio editor or `@statelyai/inspect`.

## Alpha packages for XState v6

These peer on the XState v6 alpha (`xstate@alpha`, 6.0.0-alpha.65). They cannot be combined with stable v5. Use them only in a deliberate v6 spike.

- `@xstate/effect` 0.1.0-alpha.7 (peer `effect ^4`): exports `fromEffect`, `fromEffectStream`, `fromEffectEventStream`, `createEffectActor`, `setupEffect`, `taggedState`, helpers (`send`, `waitFor`, `snapshots`, `emitted`, `join`, ...), and an `./atom` subpath. The npm package has no README; read the v6 docs before use.
- `@xstate/scxml` 1.0.0-alpha.1: create machines from SCXML documents.
- `@xstate/test` 2.0.0-alpha.2: model-based and property-based testing on `fast-check`, `vitest`, `effect`, and `zod`.
- `@statelyai/agent` 2.0.0-alpha.x: see above.

## SCXML

Stable `xstate` does not export SCXML conversion. Core has an internal `scxml.ts` used only by its own conformance tests. Options:

- One-off conversion: Studio export, `@statelyai/sdk` embed export, or the MCP `convert_machine` tool (SCXML ↔ XState, plus XGraph and D2).
- Runtime import of SCXML: `@xstate/scxml`, which needs the v6 alpha.

Expect manual cleanup: SCXML data models and executable content do not map one-to-one to `setup()` implementations.

## Data and security notes

- Hosted tools receive your machine source: MCP tools (except the two local ones), Studio import, CLI `push`/`diff` with remote locators, Sky, and hosted inspectors. Ask before sending proprietary machines when the user has not opted in.
- Inspector room URLs (`createSkyInspector`, SDK `createInspector`) are bearer capabilities. Do not paste them into issues or logs. Keep inspection out of production builds, or self-host the relay.
- Never commit `STATELY_API_KEY` / `STATELY_ACCESS_TOKEN`; the CLI reads them from env or `.env.local`.
- Studio AI features (generate flow, AI test titles) send the machine to a model provider.

## Pitfalls

- **Installing a "deprecated in docs" package because npm did not warn.** Check `peerDependencies`: `@xstate/immer`, `@xstate/inspect`, `@xstate/test` 0.x all peer on xstate 4.
- **Adding `@statelyai/agent@alpha` or `@xstate/effect` to a v5 app.** They require the v6 alpha. Fix: stay on v5 primitives or isolate the spike.
- **Relying on `npm`'s `next` tag for `@statelyai/agent`.** It points to an older 2.0.0-next.5 from Feb 2025; the active line is `alpha`.
- **`statelyai pull --force` wiping helpers and comments.** Commit first; prefer the default surgical update.
- **Deleting `@xstate-layout` or `@statelyai` comments during cleanup.** It drops layout or unlinks Studio machines.
- **Expecting MCP `generate_graph_paths` to replace repo tests.** It returns at most five paths per call and runs in Stately's sandbox. Keep `xstate/graph` tests in the repo.
- **Using `stately.ai/registry/...` API URLs in new clients.** Use the SDK client against `editor.stately.ai` `/api/v1`.

## Do / Don't

- Do keep the code as the source of truth and use Studio, the CLI, or MCP as views and checks on it.
- Do name every action, guard, actor, and delay in `setup()`; visual tools, `provide()`, and Studio sources all depend on names.
- Do pin exact versions of pre-1.0 and alpha Stately packages.
- Don't use typegen, `@xstate/inspect`, `@xstate/immer`, or `@xstate/fsm` in v5 code.
- Don't ship inspectors or API keys in client bundles.

## Stale API

| Stale | Current |
| --- | --- |
| `import { inspect } from '@xstate/inspect'; inspect({ iframe: false })` | `createBrowserInspector()` from `@statelyai/inspect`, passed as `createActor(m, { inspect: inspector.inspect })` |
| `xstate typegen "src/**/*.ts?(x)"`, `tsTypes: {} as import('./m.typegen').Typegen0` | `setup({ types: { ... } })` |
| `import { assign } from '@xstate/immer'` | `assign` from `xstate` + `produce` from `immer` |
| `import { createMachine, interpret } from '@xstate/fsm'` | `setup(...).createMachine(...)` + `createActor` from `xstate`, or `@xstate/store` |
| `import { createModel } from '@xstate/test'` | `createTestModel` from `xstate/graph` |
| `import { getShortestPaths } from '@xstate/graph'` | `from 'xstate/graph'` (xstate ≥ 5.20) |
| stately.ai/viz visualizer | Studio editor, `statelyai open`, `@statelyai/inspect` |
| Studio REST via `stately.ai/registry/...` | `createStatelyClient` from `@statelyai/sdk` (`editor.stately.ai/api/v1`) |
