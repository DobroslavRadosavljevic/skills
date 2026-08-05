# Extension: TanStack Query

Load when the Start app uses TanStack Query (often with a generated OpenAPI client and route loaders).

## Stance

Router context holds a **QueryClient**. Critical identity/session data is ensured in `beforeLoad` / loaders; pages consume hooks. Prefer generated `*Options` / `*Mutation` when present.

## Tree

```text
src/integrations/query.ts    # or equivalent QueryClient factory
src/router.tsx               # context: { queryClient }; fresh client per router
routes/…/
  route.tsx | index.tsx      # beforeLoad: ensureQueryData / prefetchQuery
  -lib/ensure-*-queries.ts   # optional helpers for multi-query ensure
modules/<feature>/hooks/     # useQuery(…Options) / useMutation(…Mutation)
```

## MUST

1. Create a **fresh QueryClient per router** instance (SSR-safe).
2. Prefer **generated options** over hand-written fetchers for OpenAPI endpoints.
3. Use `ensureQueryData` for data the gate/page must have; `prefetchQuery` for secondary.
4. Set conservative retries on auth/identity queries when failures should surface fast (`retry: false` is common).

## MUST NOT

1. A module-level singleton QueryClient shared across SSR requests.
2. Fetching the same OpenAPI endpoint with ad-hoc `fetch` in parallel to generated helpers.

## Soft defaults

- Invalidate with generated `*QueryKey` helpers after mutations.
- Keep ensure helpers under route `-lib/` when only one layout uses them; promote to modules when shared.

## Checklist

```text
TanStack Query overlay:
- [ ] QueryClient on router context (per router)
- [ ] Gates/loaders ensure critical queries
- [ ] Hooks use generated *Options / *Mutation when available
- [ ] Mutation success invalidates the right keys
```
