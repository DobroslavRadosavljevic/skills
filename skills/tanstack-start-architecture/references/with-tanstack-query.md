# Extension: TanStack Query

Load when the Start app uses TanStack Query (often with a generated OpenAPI client and route loaders).

## Stance

Router context holds a **QueryClient**. Critical identity/session data is ensured in `beforeLoad` / loaders; pages consume hooks. Prefer generated `*Options` / `*Mutation` when present.

Wire Query inside Start’s **`getRouter()`** (fresh client per call). For SSR
dehydration/hydration/streaming, prefer
`@tanstack/react-router-ssr-query` (`setupRouterSsrQueryIntegration`) over
hand-rolled dehydrate/hydrate or the older `@tanstack/react-router-with-query`
package.

## Tree

```text
src/router.tsx               # getRouter(): new QueryClient + context + SSR integration
src/integrations/query.ts    # optional shared QueryClient defaults / factory helpers
routes/…/
  route.tsx | index.tsx      # beforeLoad / loader: ensureQueryData / prefetchQuery
  -lib/ensure-*-queries.ts   # optional helpers for multi-query ensure
modules/<feature>/hooks/     # useQuery / useSuspenseQuery (…Options) / useMutation (…Mutation)
```

## MUST

1. Create a **fresh QueryClient inside `getRouter()`** (SSR-safe; never a module singleton).
2. Prefer **generated options** over hand-written fetchers for OpenAPI endpoints.
3. Use `ensureQueryData` for data the gate/page must have; `prefetchQuery` for secondary.
4. Set conservative retries on auth/identity queries when failures should surface fast (`retry: false` is common).

## MUST NOT

1. A module-level singleton QueryClient shared across SSR requests.
2. Fetching the same OpenAPI endpoint with ad-hoc `fetch` in parallel to generated helpers.
3. Assuming plain `useQuery` runs during SSR — prefer loader/`ensureQueryData` + `useSuspenseQuery` for render-critical data.

## Soft defaults

- Use `setupRouterSsrQueryIntegration({ router, queryClient })` when the app SSRs with Query.
- Invalidate with generated `*QueryKey` helpers after mutations.
- Keep ensure helpers under route `-lib/` when only one layout uses them; promote to modules when shared.

## Checklist

```text
TanStack Query overlay:
- [ ] QueryClient created in getRouter (per router / request)
- [ ] SSR integration wired when SSR + Query are both used
- [ ] Gates/loaders ensure critical queries
- [ ] Hooks use generated *Options / *Mutation when available
- [ ] Mutation success invalidates the right keys
```
