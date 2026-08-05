# Extension: Effect

Load this file **only** when the target app already uses Effect (or the user asks to adopt Effect for domain logic). Core folder rules still apply.

## Extra defaults

| Piece | Default |
| --- | --- |
| Domain | `Context.Service` + `Layer` under `services/` |
| Method naming | `Effect.fn("Service.method")` |
| Errors | `Schema.TaggedErrorClass` — **one class / one tag per failure mode** |
| Error files | `services/errors/<name>.error.ts` |
| Multi-service feature | optional `live.ts` merging Layers |
| App runtime | one `ManagedRuntime` in `runtime.ts`; dispose on shutdown |
| Infra Layers | DB/Redis/email/etc. from validated env via `.make({ … })` |

## MUST (Effect)

1. **Services own domain logic.** Routes call into the runtime (`runPromise` / `ManagedRuntime`) and stay free of business rules.
2. **One tagged error class per failure mode.** Name the file after the error (`insufficient-credits.error.ts` → `InsufficientCreditsError`). Do **not** use one catch-all tag with a `reason` / `message` discriminator.
3. **Services declare precise error unions.** Routes map with `Effect.catchTag("ExactTag", …)` (or equivalent) to fixed HTTP bodies/status codes.
4. **Never branch on `error.reason` or `error.message`** to pick HTTP status when tags exist.
5. **Do not leak Effect causes** in public JSON — map at the route edge.
6. **Cross-feature deps** go through services/Layers, not route imports.
7. Prefer `services/<name>.service.ts` for Effect services so role is obvious in the tree.
8. **One app runtime** — `Layer.mergeAll` / `provideMerge` feature `live.ts` layers + infra; provide DB once (memoized). Dispose runtime on SIGINT/SIGTERM (with log flush when observability is enabled).
9. Construct infra with **validated env** at the app boundary — packages still use `.make(options)`.

## MUST NOT (Effect)

1. `Effect.gen` / business workflows inside `routes/index.ts`.
2. Ad-hoc singletons that bypass Layers when the app already uses Layers.
3. Catch-all `DomainError` with stringly `kind` fields for HTTP branching.
4. Passing broad manually typed HTTP `Context` into services — pass validated data / ids only.
5. Creating a second `ManagedRuntime` per request or per feature without a documented reason.

## Tree add-ons

```text
apps/<api>/src/
  runtime.ts                 # ManagedRuntime + Layer graph from env
  telemetry/layer.ts         # optional Effect OTEL (see with-observability.md)
  modules/<feature>/
    services/
      <name>.service.ts
      errors/
        <failure>.error.ts   # one TaggedErrorClass each
    live.ts                  # optional Layer.merge for the feature
```

## Route edge (conceptual)

```ts
await runtime.runPromise(
  Effect.gen(function* () {
    const svc = yield* FeatureService;
    return yield* svc.doThing(input);
  }).pipe(
    Effect.catchTag("InsufficientCreditsError", () =>
      Effect.succeed(status(402, { error: "Insufficient credits" })),
    ),
    Effect.catchTag("NotFoundError", () =>
      Effect.succeed(status(404, { error: "Not found" })),
    ),
  ),
);
```

Inline this pattern per route — do not hide it behind a generic `mapEffectToHttp` helper unless the user explicitly wants one shared plugin for universal mapping.

## Checklist add-on

```text
Effect overlay:
- [ ] Domain in Context.Service + Layer
- [ ] One TaggedErrorClass per failure mode under services/errors/
- [ ] Route maps exact tags → status + small body
- [ ] Feature live.ts merged into single app runtime.ts
- [ ] Infra .make(options) from env; dispose runtime on shutdown
- [ ] No catch-all reason discriminator for HTTP
```
