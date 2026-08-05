# Source Map

Snapshot date: 2026-08-05.

This reference records the official documentation and package evidence used to create the skill. Refresh sources for latest/current questions, migrations, plugin APIs, or version mismatches.

## Research Snapshot

- Context7 library (preferred): `/websites/heyapi_dev`
- Alternate Context7 library: `/hey-api/hey-api`
- Official homepage: https://heyapi.dev/
- TypeScript docs root: https://heyapi.dev/docs/openapi/typescript/get-started
- Repository: https://github.com/hey-api/hey-api
- npm versions observed on 2026-08-05:
  - `@hey-api/openapi-ts`: `0.99.0`
  - `@hey-api/vite-plugin`: `0.3.2`
  - `@hey-api/client-fetch`: `0.13.1`

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
- Web frameworks: https://heyapi.dev/docs/openapi/typescript/web-frameworks
- Custom plugin: https://heyapi.dev/docs/openapi/typescript/plugins/custom

### Examples

- StackBlitz collection: https://stackblitz.com/orgs/github/hey-api/collections/openapi-ts-examples
- GitHub examples: https://github.com/hey-api/hey-api/tree/main/examples
- Demo: https://stackblitz.com/edit/hey-api-example
