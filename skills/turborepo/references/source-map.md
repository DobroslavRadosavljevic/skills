# Source Map

This reference captures the Turborepo docs and package snapshot used to create the skill.

## Snapshot

- Captured: 2026-07-30
- Canonical docs: https://turborepo.dev · https://turborepo.com (`turbo.build` redirects)
- npm `turbo`: **2.10.7** (`canary` exists; treat as unavailable unless the project uses it)
- npm `create-turbo`: **2.10.7**
- Schema: https://turborepo.dev/schema.json
- Agent indexes: https://turborepo.dev/llms.txt · https://turborepo.dev/sitemap.md · https://turborepo.dev/agents.md
- Context7 IDs: `/websites/turborepo_dev`, `/vercel/turborepo`
- Support: Turbo **2.x** LTS; **1.x** EOL 2026-06-04
- Package managers: pnpm 8+, npm 8+, yarn 1+, **bun 1.2+** (stable)

## In-skill usage guide

- Full how-to / progressive adoption / troubleshooting: [usage-guide.md](usage-guide.md)

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check registry metadata:

   ```sh
   bun info turbo
   bun info create-turbo
   bunx turbo --version
   ```

3. Prefer official pages under https://turborepo.dev/docs/. If docs and package metadata disagree, report the mismatch.
4. Check the local lockfile / `turbo` version before applying guidance that requires a minimum 2.x feature or `futureFlags` entry.
5. Re-read Remote Cache / CI vendor pages when wiring tokens or self-hosted APIs.

## Official Pages

### Getting started

- Docs home: https://turborepo.dev/docs
- Installation: https://turborepo.dev/docs/getting-started/installation
- Add to existing repo: https://turborepo.dev/docs/getting-started/add-to-existing-repository
- Examples: https://turborepo.dev/docs/getting-started/examples
- Support policy: https://turborepo.dev/docs/getting-started/support-policy
- Editor integration: https://turborepo.dev/docs/getting-started/editor-integration

### Crafting your repository

- Overview: https://turborepo.dev/docs/crafting-your-repository
- Structuring: https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository
- Configuring tasks: https://turborepo.dev/docs/crafting-your-repository/configuring-tasks
- Running tasks: https://turborepo.dev/docs/crafting-your-repository/running-tasks
- Caching: https://turborepo.dev/docs/crafting-your-repository/caching
- Environment variables: https://turborepo.dev/docs/crafting-your-repository/using-environment-variables
- Developing applications: https://turborepo.dev/docs/crafting-your-repository/developing-applications
- Constructing CI: https://turborepo.dev/docs/crafting-your-repository/constructing-ci
- Managing dependencies: https://turborepo.dev/docs/crafting-your-repository/managing-dependencies
- Creating an internal package: https://turborepo.dev/docs/crafting-your-repository/creating-an-internal-package
- Upgrading: https://turborepo.dev/docs/crafting-your-repository/upgrading

### Core concepts

- Package and task graph: https://turborepo.dev/docs/core-concepts/package-and-task-graph
- Internal packages: https://turborepo.dev/docs/core-concepts/internal-packages
- Remote caching: https://turborepo.dev/docs/core-concepts/remote-caching
- OpenAPI (Remote Cache API): https://turborepo.dev/docs/openapi

### Reference

- Configuration: https://turborepo.dev/docs/reference/configuration
- Package configurations: https://turborepo.dev/docs/reference/package-configurations
- Run: https://turborepo.dev/docs/reference/run
- Watch: https://turborepo.dev/docs/reference/watch
- Boundaries: https://turborepo.dev/docs/reference/boundaries
- Prune: https://turborepo.dev/docs/reference/prune
- Generate: https://turborepo.dev/docs/reference/generate
- Create-turbo: https://turborepo.dev/docs/reference/create-turbo
- System environment variables: https://turborepo.dev/docs/reference/system-environment-variables
- Options overview: https://turborepo.dev/docs/reference/options-overview
- Query: https://turborepo.dev/docs/reference/query
- Telemetry: https://turborepo.dev/docs/telemetry

### Guides

- CI vendors: https://turborepo.dev/docs/guides/ci-vendors
- GitHub Actions: https://turborepo.dev/docs/guides/ci-vendors/github-actions
- GitLab CI: https://turborepo.dev/docs/guides/ci-vendors/gitlab-ci
- Docker: https://turborepo.dev/docs/guides/tools/docker
- Skipping tasks: https://turborepo.dev/docs/guides/skipping-tasks
- Migrating from Nx: https://turborepo.dev/docs/guides/migrating-from-nx
- TypeScript: https://turborepo.dev/docs/guides/tools/typescript
- Next.js: https://turborepo.dev/docs/guides/frameworks/nextjs
- Vite: https://turborepo.dev/docs/guides/frameworks/vite
- Vitest: https://turborepo.dev/docs/guides/tools/vitest
- Playwright: https://turborepo.dev/docs/guides/tools/playwright
- Storybook: https://turborepo.dev/docs/guides/tools/storybook
- ESLint: https://turborepo.dev/docs/guides/tools/eslint
- Oxc (oxlint/oxfmt): https://turborepo.dev/docs/guides/tools/oxc
- Generating code: https://turborepo.dev/docs/guides/generating-code
- AI: https://turborepo.dev/docs/guides/ai

### Ecosystem

- npm turbo: https://www.npmjs.com/package/turbo
- npm create-turbo: https://www.npmjs.com/package/create-turbo
- GitHub: https://github.com/vercel/turborepo
- Vercel remote caching: https://vercel.com/docs/monorepos/remote-caching
