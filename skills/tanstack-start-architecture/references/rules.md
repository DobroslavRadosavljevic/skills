# Rules and anti-patterns (TanStack Start core)

## MUST

1. Represent each page as a directory with `index.tsx`.
2. Prefix route-private files/folders with `-` (or the configured ignore prefix).
3. Keep route-only UI/hooks/helpers under that route’s `-components` / `-hooks` / `-lib`.
4. Promote to `src/modules/<feature>/` only when reuse is real (2+ consumers) or the shared API is obvious (auth client, shared form contract).
5. Forbid `modules/**` → `routes/**` imports.
6. Prefer concrete imports over feature barrels.
7. Put app-wide UI in `src/components/` and non-feature infra in `src/lib/`.
8. Treat generated `routeTree.gen.ts` as generated.

## MUST NOT

1. Flat page leaves: `routes/billing.tsx` as the full page (use `routes/billing/index.tsx`).
2. Unprefixed `helpers.ts` / `components/` under `routes/` (they become routes).
3. Pre-building empty `modules/<feature>/` trees “for later.”
4. Importing route components into modules to “reuse the page.”
5. Duplicating the same widget in three route `-components` folders after a second use — promote instead.
6. Hand-editing generated route trees.

## Soft defaults

- Feature module names can mirror API/domain names when a sibling backend exists.
- Pathless `_dashboard` / `_app` layouts for authenticated shells.
- Form validation schemas for UI may live under `modules/<feature>/schema` even when API types come from elsewhere.
- Match existing import alias style (`@/…`) when the app already has one.

## Anti-patterns → fix

| Smell | Fix |
| --- | --- |
| `routes/settings.tsx` page leaf | `routes/settings/index.tsx` + `-components/` |
| `routes/billing/utils.ts` | `routes/billing/-lib/…` |
| `src/features/billing` + `src/modules/billing` dual trees | Pick `modules/`; migrate |
| Module `index.ts` re-exporting everything | Delete barrel; import concrete paths |
| Shared button only used by one page living in `components/` | Move next to the page under `-components` until reused |
| Copy-pasted hook in two routes | Promote to `modules/<feature>/hooks` |

## Conflict with local docs

If `AGENTS.md` / CONTRIBUTING defines a different Start layout, follow the repo unless the user explicitly wants this skill’s tree.
