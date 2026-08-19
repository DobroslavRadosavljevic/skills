# `.temp` ignore targets

Apply only to files and configs that **already exist** in the project. Add `.temp` in the same style as neighboring ignore entries.

Prefer ignoring the directory as `.temp` or `.temp/` (or `**/.temp/**` only when that is the file's existing convention). Do not ignore unrelated `temp` folders in packages unless the project already does.

## Git (required)

In the root `.gitignore` (create `.gitignore` only if the project already uses git and has no ignore file — otherwise add to the existing root file):

```
.temp/
```

If the repo uses a root ignore plus package ignores, root is enough for a root-level `.temp/`.

Confirm with `git check-ignore -v .temp` or `git status` after creating the directory.

## Formatters and linters

Add `.temp` (or `.temp/`) when these exist:

| If present | Where |
| --- | --- |
| `.prettierignore` | one line `.temp/` |
| `prettier` ignore in config | same list as other ignored dirs |
| `.eslintignore` | `.temp/` |
| `eslint.config.*` | `ignores: [..., ".temp/**"]` (or the file's glob style) |
| Oxlint config (`oxlint.config.*`, `.oxlintrc*`) | ignore / `ignorePatterns` |
| Oxfmt ignore file or config ignore list | `.temp/` |
| `biome.json` / `biome.jsonc` | `files.includes` / `files.ignore` / VCS ignore as the file already uses |
| `.oxfmtrc*` / `oxfmt.config.*` | ignore list |
| Ruff / `ruff.toml` / `pyproject.toml` `[tool.ruff]` | `extend-exclude` or `exclude` |
| `.flake8` / `.pylintrc` | ignore paths |

## Typecheck and compilers

| If present | Where |
| --- | --- |
| `tsconfig*.json` | `exclude`: `".temp"` (root/solution configs that otherwise glob the repo) |
| `jsconfig.json` | same |
| `pyrightconfig.json` / `[tool.pyright]` | `exclude` or `ignore` |
| `mypy.ini` / `[tool.mypy]` | `exclude` |
| `go.work` / wide `./...` scripts | do not change module layout; keep `.temp` out of `go.work` |

Skip package-level `tsconfig.json` files that only include `src` — they already miss `.temp`. Prefer the root or solution config that uses `**/*` or lists the repo root.

## Tests, coverage, bundlers

| If present | Where |
| --- | --- |
| `vitest.config.*` / `vite.config.*` | `test.exclude` / `server.watch.ignored` if they watch the repo root |
| `jest.config.*` | `testPathIgnorePatterns` / `modulePathIgnorePatterns` |
| Playwright config | `testDir` is usually enough; add ignore only if tests glob from root |
| `.dockerignore` | `.temp` if Docker build context is repo root |
| Knip config | `ignore` / `ignoreWorkspaces` as applicable |
| Turborepo | no change unless a task's `inputs` globs the whole repo unsafely |

## Editor and agents

| If present | Where |
| --- | --- |
| `.cursorignore` | `.temp/` |
| `.ignore` (generic) | `.temp/` |
| cspell / typos config | ignore paths if they scan the whole tree |

## Do not

- Do not add `.temp` to `package.json` `files` allowlists (absence is enough).
- Do not force-add `.temp` with `git add -f`.
- Do not ignore `.temp` inside a clone's own git repo as a substitute for host ignores — host root ignores are what matter.
- Do not delete the project's existing `!.temp` un-ignore unless that was clearly a mistake and the user wants `.temp` ignored.
