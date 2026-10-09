# Commit, Report, And Rollback

## Contents

- Commit message
- Final report
- Rollback

## Commit Message

One group per commit. The subject says what moved; the body lists versions and what changed in the code.

```text
chore(deps): upgrade vitest family to 4.x

- vitest 3.2.4 -> 4.0.2
- @vitest/coverage-v8 3.2.4 -> 4.0.2

Notes: <migration guide URL>
Breaking changes that touched this repo:
- renamed `poolOptions` -> top-level pool config (vitest.config.ts)
Codemod: none
Gates: typecheck, lint, test, build pass; baseline failures unchanged (see report)
```

- Subject prefix follows the repo's convention (`chore(deps):`, `build(deps):`, `fix(deps):` for security).
- List every package `from -> to`; for a large minor/patch batch list them all in the body, not only the count.
- Security commits name the advisory IDs (GHSA/CVE) and severity.
- Code edits that were required by the upgrade stay in the same commit. Voluntary refactors do not belong in it.
- Use the repo's required trailers (for example co-author lines) exactly as its instructions say.
- Do not push, open a PR, or tag unless asked.

## Final Report

```md
## Dependency upgrade report

Baseline: <date/commit>. Runtime: bun X, node Y, typescript Z. Pre-existing failures: <list or none>.

### Upgraded
| Group | Package | From | To | Type | Commit | Notes |
| security | ms | 0.7.0 | 0.7.1 | patch | abc1234 | GHSA-... |

### Skipped or blocked
| Package | Current | Latest | Reason | Retry when |
| some-plugin | 2.1.0 | 3.0.0 | peer: needs vite ^7, plugin supports ^6 | plugin 3.x ships |

### Verification
| Gate | Baseline | Final |
| typecheck | 12 errors | 12 errors (same) |
| test | pass | pass |
| build | pass | pass |
| runtime/E2E | n/a | app started, route / ok |

### Follow-ups
- Deprecation: `oldApi()` removed in next major of pkg X (notes URL).
- Overrides kept: `foo@<1.2.3` until upstream releases the fix (issue URL).
- Suggest: minimum release age is not configured.

### Rollback
`git revert <sha>` per group, or `git reset --hard <baseline-sha>`; then `bun install`.
```

State plainly which gates ran and which did not. Never write "all tests pass" without having run them.

## Rollback

Because each group is a commit, rollback is cheap if the commits stay clean.

- Undo one group: `git revert <sha>` (keeps history, safe on shared branches), then `bun install` to resync `node_modules`.
- Undo the whole effort on an unpushed branch: `git reset --hard <baseline-sha>` or delete the branch; then `bun install`. Only do this on your own unpushed work and say so.
- Undo one package inside a group before committing: `bun add pkg@<previous>` (or restore `package.json` and `bun.lock` with `git checkout -- package.json bun.lock`), then `bun install`.
- Lockfile conflicts after a revert: regenerate with `bun install` on the target base; do not hand-merge `bun.lock`.
- Runtime bumps: also revert CI, Docker, and version files from the same commit. Native modules need a fresh install after switching back.
- If a bad version reached production, pin the previous version exactly (`bun add -E pkg@<previous>`), redeploy, and record the incident in the report as a deferred package.
- Keep the baseline commit SHA in the report so anyone can return to it.
