# Source Map

Snapshot date: 2026-10-01.

This reference records the official documentation and package evidence used to create the skill. Refresh sources for latest/current questions, migrations, plugin APIs, or version mismatches.

## Research Snapshot

- Context7 library (preferred): `/websites/heyapi_dev`
- Alternate Context7 library: `/hey-api/hey-api`
- Official homepage: https://heyapi.dev/
- TypeScript docs root: https://heyapi.dev/docs/openapi/typescript/get-started
- Repository: https://github.com/hey-api/hey-api
- npm versions observed on 2026-10-01:
  - `@hey-api/openapi-ts`: `0.99.0` (`latest`, released 2026-06-22; engines `node >= 22.18.0`). The `next` dist-tag is a `0.0.0-next-<timestamp>` snapshot of `main`; do not install it unless asked.
  - `@hey-api/vite-plugin`: `0.3.2`
  - `@hey-api/codegen-core`: `0.9.1`
  - `@hey-api/client-fetch`: `0.13.1` (legacy standalone package; clients are now bundled into the generated output by the client plugins)
- Plugin names shipped in `0.99.0`: `@hey-api/typescript`, `@hey-api/sdk`, `@hey-api/transformers`, `@hey-api/schemas`, `@hey-api/examples`, `@hey-api/client-{fetch,axios,ky,next,nuxt,ofetch,angular}`, `zod`, `valibot`, `arktype`, `@tanstack/{react,vue,svelte,solid,preact,angular}-query*`, `@pinia/colada`, `@angular/common`, `fastify`, `nestjs`, `orpc`, `swr`, `msw`, `@faker-js/faker`. Docs mark `arktype` and `swr` as planned and `msw` / `@faker-js/faker` as in progress; verify generated output before depending on them.

Pin `@hey-api/openapi-ts` to an exact version (`-D -E` with npm/pnpm/yarn; `bun add -D` then lock the version). The package is in initial development and publishes migration notes per breaking release.

## Refresh Procedure

1. Resolve current docs with documentation tooling (`/websites/heyapi_dev`) before answering "latest" questions.
2. Check package registry metadata:

   ```sh
   bun info @hey-api/openapi-ts
   ```

3. Prefer official docs pages and the official repo. If docs and package metadata disagree, report the mismatch.
4. Check the local project package version and Node engine before applying guidance that requires a minimum version.
5. For upgrades, read the Migrating page for every crossed release.

## Official Pages

### Get started and configuration

- Get started: https://heyapi.dev/docs/openapi/typescript/get-started
- Configuration: https://heyapi.dev/docs/openapi/typescript/configuration
- Input: https://heyapi.dev/docs/openapi/typescript/configuration/input
- Output options: https://heyapi.dev/docs/openapi/typescript/configuration/output
- Parser: https://heyapi.dev/docs/openapi/typescript/configuration/parser
- Vite: https://heyapi.dev/docs/openapi/typescript/configuration/vite
- Output layout: https://heyapi.dev/docs/openapi/typescript/output
- Migrating: https://heyapi.dev/docs/openapi/typescript/migrating
- Integrations / registry: https://heyapi.dev/docs/openapi/typescript/integrations

### Core and clients

- Core plugins: https://heyapi.dev/docs/openapi/typescript/core
- Clients overview: https://heyapi.dev/docs/openapi/typescript/clients
- Fetch: https://heyapi.dev/docs/openapi/typescript/clients/fetch
- Axios: https://heyapi.dev/docs/openapi/typescript/clients/axios
- Ky: https://heyapi.dev/docs/openapi/typescript/clients/ky
- Next.js: https://heyapi.dev/docs/openapi/typescript/clients/next-js
- Nuxt: https://heyapi.dev/docs/openapi/typescript/clients/nuxt
- OFetch: https://heyapi.dev/docs/openapi/typescript/clients/ofetch
- Angular: https://heyapi.dev/docs/openapi/typescript/clients/angular
- Custom client: https://heyapi.dev/docs/openapi/typescript/clients/custom

### Plugins

- SDK: https://heyapi.dev/docs/openapi/typescript/plugins/sdk
- Validators overview: https://heyapi.dev/docs/openapi/typescript/validators
- Zod: https://heyapi.dev/docs/openapi/typescript/plugins/zod
- Valibot: https://heyapi.dev/docs/openapi/typescript/plugins/valibot
- TanStack Query: https://heyapi.dev/docs/openapi/typescript/plugins/tanstack-query
- Pinia Colada: https://heyapi.dev/docs/openapi/typescript/plugins/pinia-colada
- Testing / mocks overview: https://heyapi.dev/docs/openapi/typescript/mocks
- MSW: https://heyapi.dev/docs/openapi/typescript/plugins/msw
- Faker: https://heyapi.dev/docs/openapi/typescript/plugins/faker
- Web frameworks: https://heyapi.dev/docs/openapi/typescript/web-frameworks
- Custom plugin: https://heyapi.dev/docs/openapi/typescript/plugins/custom

### Examples

- StackBlitz collection: https://stackblitz.com/orgs/github/hey-api/collections/openapi-ts-examples
- GitHub examples: https://github.com/hey-api/hey-api/tree/main/examples
- Demo: https://stackblitz.com/edit/hey-api-example
