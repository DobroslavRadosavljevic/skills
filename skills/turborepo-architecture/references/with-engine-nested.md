# Extension: nested package group + second scope

Load when a second package scope lives under a nested folder (e.g. `packages/engine/*` → `@engine/*`) separate from the main platform scope.

## MUST

1. Add the nested glob to `workspaces.packages` (`packages/<group>/*`).
2. Use a **distinct scope** for the nested group when boundaries differ (platform vs runtime).
3. Fix `tsconfig` extends paths (`../../../tsconfig.base.json`).
4. Document which apps may import the nested scope (see dependency-boundaries overlay).

## MUST NOT

1. Letting HTTP/API apps import nested browser/runtime packages when the boundary forbids it.
2. Relative imports from `apps/` into `packages/<group>/src` bypassing the package name.

## Checklist

```text
Nested scope overlay:
- [ ] Workspace glob includes nested path
- [ ] Distinct scope name
- [ ] tsconfig paths correct
- [ ] Import boundaries documented
```
