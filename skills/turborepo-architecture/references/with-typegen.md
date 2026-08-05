# Extension: typegen / codegen

Load when some workspaces define `typegen` / `gen:api` (OpenAPI clients, router gen, …).

## Stance

Typegen is **opt-in**. Turbo skips packages without the script. Mutating generation is usually `cache: false`.

## MUST

1. Only packages that need generated artifacts define `typegen` / `gen:api`.
2. Refresh OpenAPI snapshots / inputs before typegen when contracts change.
3. Keep generated output out of hand-edits; commit or gitignore per repo policy.
4. Optional: isolate codegen in a `.codegen` workspace with a named catalog TypeScript pin.

## Soft defaults

- `typecheck` may `dependsOn: ["gen:api"]` when clients are gitignored and must exist first.
- `passThroughEnv` for OpenAPI URL overrides when dumping live specs.

## Checklist

```text
Typegen overlay:
- [ ] Opt-in scripts only where needed
- [ ] Inputs/outputs declared for turbo when cached (or cache: false)
- [ ] Consumers regenerate after contract changes
```
