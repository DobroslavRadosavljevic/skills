# Extension: Effect packages

Load when domain Effect services live in workspace packages and apps compose Layers.

## MUST

1. Put reusable `Context.Service` + `Layer` definitions in packages when shared across apps/workers.
2. Apps compose with `ManagedRuntime` / `Layer.mergeAll` and dispose on shutdown.
3. Pass secrets/URLs from validated app env into `.make({ … })`.
4. Keep HTTP/UI out of domain packages — apps own routes/pages.

## MUST NOT

1. Ad-hoc singletons in packages that bypass Layers when the monorepo standard is Layers.
2. Importing app `runtime.ts` from a package.

## Checklist

```text
Effect packages overlay:
- [ ] Domain services in packages
- [ ] App runtime composes Layers from env
- [ ] Dispose on shutdown
```
