# Placement

Pick one location rule from the table. Use the same app names in every repo: `internal-human-docs` and `internal-agent-docs`. Then agents and people find them by name.

## Decision table

| Repo shape | How to detect it | Location |
| --- | --- | --- |
| Turborepo | `turbo.json` at the root | `apps/internal-human-docs`, `apps/internal-agent-docs` |
| Other JS workspace monorepo with an apps folder | `workspaces` in `package.json`, `pnpm-workspace.yaml`, or Nx/Lerna config, plus `apps/` (or `sites/`, `services/`) | `<apps folder>/internal-human-docs`, `<apps folder>/internal-agent-docs` |
| JS workspace monorepo without an apps folder | workspaces, but only `packages/` or `libs/` | `internal-docs/human`, `internal-docs/agent`. Add `internal-docs/*` to the workspace globs. |
| Single JS package | one `package.json`, no workspaces | `internal-docs/` as its own small workspace (see below) |
| Not JavaScript (Python, Go, Rust, Ruby, Java, mixed) | no root `package.json`, or one only for tooling | `internal-docs/` as its own small workspace (see below) |

## Monorepo rules

- Each app is a workspace package. Name the packages after the folders, with the repo scope if the repo uses one (`@acme/internal-agent-docs`).
- Put Blume in each app's `devDependencies`. Use the root catalog or the shared version pin if the repo has one.
- Name the dev script `docs:dev`, not `dev`. Then the repo's main `dev` task does not start two more servers. Keep `build` as `blume build`, so the repo build and the hosting build work the same way.
- Turborepo: check that the `build` task outputs include `dist/**`. If the task lists outputs per package, add `dist/**` for the docs apps.
- If the repo has a shared tooling folder (`packages/tooling/`, `tools/`), you can put the password middleware in one small package there. Both apps then re-export it. Otherwise give each app its own copy of `assets/middleware.ts`. Two copies of one small file are fine.
- Check that the repo's lint, format, and typecheck tasks still pass with the new folders. Blume generates `.blume/`. Exclude it, and `dist/`, from every tool that scans files.

## Separate docs workspace (single package or non-JS repo)

Keep the docs apps out of the product's install, build, and tests:

```text
internal-docs/
├── package.json          # private; "workspaces": ["human", "agent"]
├── bun.lock              # its own lockfile
├── .gitignore            # node_modules/, */.blume/, */dist/, */.vercel/
├── human/                # package name: internal-human-docs
│   ├── package.json
│   ├── blume.config.ts
│   ├── middleware.ts
│   ├── public/robots.txt
│   └── docs/
└── agent/                # package name: internal-agent-docs
    └── (same files)
```

- Run installs and scripts from `internal-docs/`. For example: `bun install --cwd internal-docs` and `bun run --cwd internal-docs/agent docs:check`.
- Exclude `internal-docs/` from the product's tools: the root `tsconfig.json`, lint and format ignore files, test discovery, Docker build context (`.dockerignore`), and language tools that scan the tree (for example `pyproject.toml` exclude lists).
- Do not name the folder `docs/`. Many tools treat `docs/` as special (GitHub Pages, MkDocs, Sphinx). The old docs folder is often still there during the move.
- In `AGENTS.md`, write the paths as `internal-docs/agent/docs/...` and `internal-docs/human/docs/...`. Use the package names when you mean the apps.

## Ports

Pick two free ports next to the repo's existing dev ports. Use two neighbors, for example the first two free ports after the highest app port. Set them in the `docs:dev` and `preview` scripts with `--port`. If the repo keeps an official port list (in `AGENTS.md`, a ports script, or a launch config), add both ports to it.

## Start entries

If the repo has a dev launch config (for example `.claude/launch.json`, `.vscode/launch.json`, or a `Procfile.dev`), add one entry per docs app. Each entry runs `docs:dev` from the app folder on its fixed port.
