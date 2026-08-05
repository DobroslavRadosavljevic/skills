# Extension: Effect testing

Load when tests use `@effect/vitest` (`it.effect`, `layer`, optional `it.live`) for Effect services and Layers.

## Stance

Prefer `@effect/vitest` when asserting Effects/Layers. Plain `vitest` is fine for pure non-Effect helpers in the same package.

## MUST

1. Import test APIs from `@effect/vitest` for Effect cases.
2. Provide test Layers explicitly; use `layer(Live, { excludeTestServices: true, timeout })` (or repo equivalent) for integration against real infra.
3. Keep mocked Layers in **unit**; real DB/Redis Layers in **integration**.
4. Align `@effect/vitest` with the repo’s Effect version pin.

## MUST NOT

1. Mixing Bun test with Effect vitest helpers.
2. Requiring Docker in unit Effect tests.

## Checklist

```text
Effect testing overlay:
- [ ] @effect/vitest for Effect cases
- [ ] Unit = mocked layers; integration = real deps
- [ ] Timeouts on live layers
```
