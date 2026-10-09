# TanStack DB Source Map

Snapshot date: 2026-10-09.

## Current Package Evidence

Npm evidence from this snapshot (`dist-tags.latest`, publish date 2026-10-07 unless noted). Each package has only a `latest` tag; there is no beta, next, or RC tag.

- `@tanstack/db`: `0.12.3`
- `@tanstack/react-db`: `0.5.7` (depends on `@tanstack/db` exactly `0.12.3`; React `>=18`)
- `@tanstack/vue-db`: `0.3.7`, `@tanstack/solid-db`: `0.3.7`, `@tanstack/svelte-db`: `0.5.7`, `@tanstack/angular-db`: `0.2.7`
- `@tanstack/query-db-collection`: `1.4.2` (peer `@tanstack/query-core ^5`, depends on `@tanstack/db` `0.12.3`)
- `@tanstack/electric-db-collection`: `0.5.8` (depends on `@electric-sql/client ^1.5.15`)
- `@tanstack/trailbase-db-collection`: `0.1.118`
- `@tanstack/rxdb-db-collection`: `0.1.106`
- `@tanstack/powersync-db-collection`: `0.2.8`
- `@tanstack/offline-transactions`: `1.0.65`
- `@tanstack/db-ivm`: `0.1.26` (differential dataflow engine)
- `@tanstack/react-router-with-db`: `0.1.0` (published 2026-08-18)
- SQLite persistence: `@tanstack/db-sqlite-persistence-core` `0.4.7`; runtime packages `0.2.32` (`browser`, `node`, `react-native`, `expo`, `capacitor`, `tauri`, `cloudflare-durable-objects`) and `electron` `0.2.8`
- Not on npm: `@tanstack/indexeddb-db-collection` (merged into `@tanstack/db` on `main`, unreleased at this snapshot), `@tanstack/react-native-db-collection`, `@tanstack/react-start-db`
- `@tanstack/db-collections` `0.0.24` (2025-07) is a legacy package, not the current adapter set

Status notes:

- Repo README badge says BETA; `packages/db/README.md` still shows an alpha badge. Versions are `0.x`; docs refer to a future "1.0" and "1.0 RC" that removes deprecated APIs. Treat DB as beta.
- Docs on `main` matched the published versions at this snapshot (monorepo HEAD `8ef6505`, 2026-10-09). `IndexedDB Collection` docs and `createIndexedDB` are on `main` through an unreleased changeset (`move-indexeddb-into-db`).
- The agent skills bundled inside `@tanstack/db` (`skills/db-core`, `meta-framework`) declare `library_version: 0.6.17` and predate `DbClient` SSR and several handler changes. Prefer the current docs over them; their "Common Mistakes" sections remain useful.

Context7 library IDs that resolved: `/tanstack/db` (repository docs, high reputation) and `/websites/tanstack_db` (website docs). A `/tanstack/db` query for `DbClient`/`collectionOptions` returned content matching the repository docs.

## Official Docs (https://tanstack.com/db/latest/docs/...)

Core:

- Overview: `https://tanstack.com/db/latest/docs/overview`
- Installation: `https://tanstack.com/db/latest/docs/installation`
- Quick start: `https://tanstack.com/db/latest/docs/quick-start`
- Error codes: `https://tanstack.com/db/latest/docs/errors`
- React adapter: `https://tanstack.com/db/latest/docs/framework/react/overview`

Guides:

- Live queries: `https://tanstack.com/db/latest/docs/guides/live-queries`
- Mutations: `https://tanstack.com/db/latest/docs/guides/mutations`
- Schemas: `https://tanstack.com/db/latest/docs/guides/schemas`
- Error handling: `https://tanstack.com/db/latest/docs/guides/error-handling`
- SSR and hydration: `https://tanstack.com/db/latest/docs/guides/ssr`
- SQLite persistence: `https://tanstack.com/db/latest/docs/guides/sqlite-persistence`
- Offline transactions: `https://tanstack.com/db/latest/docs/guides/offline-transactions`
- Collection options creator (custom adapters): `https://tanstack.com/db/latest/docs/guides/collection-options-creator`

Collections:

- Query: `https://tanstack.com/db/latest/docs/collections/query-collection`
- Electric: `https://tanstack.com/db/latest/docs/collections/electric-collection`
- TrailBase: `https://tanstack.com/db/latest/docs/collections/trailbase-collection`
- RxDB: `https://tanstack.com/db/latest/docs/collections/rxdb-collection`
- PowerSync: `https://tanstack.com/db/latest/docs/collections/powersync-collection`
- LocalStorage: `https://tanstack.com/db/latest/docs/collections/local-storage-collection`
- LocalOnly: `https://tanstack.com/db/latest/docs/collections/local-only-collection`
- IndexedDB: `https://tanstack.com/db/latest/docs/collections/indexed-db-collection`

## Raw Docs And Source

Use GitHub when the website is hard to fetch:

- `https://raw.githubusercontent.com/TanStack/db/main/docs/<path>.md` (same paths as above)
- Package changelogs: `https://github.com/TanStack/db/blob/main/packages/<package>/CHANGELOG.md` (`db`, `react-db`, `query-db-collection`, `electric-db-collection`, `offline-transactions`)
- Source of truth for signatures: `packages/db/src/client.ts` (`DbClient`, `collectionOptions`), `packages/db/src/transactions.ts`, `packages/db/src/paced-mutations.ts`, `packages/db/src/query/builder/functions.ts`, `packages/react-db/src/`
- Examples: `examples/react/start-ssr-e2e` (Start + `routerWithDbClient`), `examples/react/next-ssr-e2e`, `examples/react/todo`, `examples/react/offline-transactions`, `examples/react/paced-mutations-demo`, `examples/react/action-enforcement`, `examples/react-native/offline-transactions`
- The installed package ships `dist/esm/*.d.ts` (for example `node_modules/@tanstack/db/dist/esm/index.d.ts`), the quickest way to confirm an export exists in the installed version

Reference docs for generated types live under `docs/reference/` in the repo and at `https://tanstack.com/db/latest/docs/reference/...`.

Refresh this source map when package versions drift, when a 1.0 RC appears, when IndexedDB collections ship in a release, or when the deprecated APIs listed in `query-vs-db-migration.md` are removed.
