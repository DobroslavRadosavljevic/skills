# Extension: route gates

Load when pathless layouts enforce auth, onboarding, guest-only, or org capability access via `beforeLoad`.

## Stance

Gates are **UX redirects**, not the sole security boundary. Start docs: protect the
data/API boundary first — authorize every server function / server route / API
that touches private data. `beforeLoad` keeps users out of screens; it does not
replace server authorization. Compose gates as pathless layout layers
(`_private`, `_auth`, `_onboarding`, …).

## Tree

```text
routes/
  _auth/route.tsx            # guest-only: bounce if session exists
  _onboarding/route.tsx      # session required; incomplete onboarding stays here
  _private/route.tsx         # session + product identity (e.g. /me)
  _private/o/$orgId/route.tsx  # org context + capability enter policy
```

Typical flow:

1. `ensureQueryData(sessionQueryOptions)`
2. Optional product identity query (`getMe` / equivalent)
3. Map missing session → sign-in; incomplete onboarding → onboarding; capability fail → safe home / 403 UI
4. Signed-in users hitting `_auth` → redirect into the app

## MUST

1. Put gate logic in **pathless layout `route.tsx`**, not copied into every page.
2. Branch on **HTTP status + stable error codes** from the API error helper when identity calls fail.
3. Re-check access when grants change without navigation (hook under `modules/authorization/` when that package exists).
4. Remember: `beforeLoad` is not enough for server mutations — server/API must authorize.

## Soft defaults

- `ssr: false` on cookie-gated trees when the SSR runtime cannot forward cookies.
- Capability → enter-policy map lives in `modules/authorization/lib/`, not hardcoded in every org child route.

## MUST NOT

1. Client-only “hide the button” as the only protection for privileged actions.
2. Fetching session ad-hoc in every page instead of shared query options.

## Checklist

```text
Route gates overlay:
- [ ] Pathless layouts own redirects
- [ ] Session then identity (when product requires onboarding)
- [ ] Error status/code → redirect map
- [ ] Capability enter policies for org sections when applicable
```
