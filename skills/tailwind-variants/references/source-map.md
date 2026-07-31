# Tailwind Variants Source Map

Snapshot date: 2026-07-31.

## Current Package Evidence

| Item | Value |
| --- | --- |
| Package | `tailwind-variants` |
| Latest | `3.3.0` |
| Dist-tags | `latest: 3.3.0`, `dev: 0.0.17-dev.1` |
| Peer deps (npm metadata) | `tailwindcss: *`, `tailwind-merge: >=3.0.0` |
| Docs stance (v3.3.0) | Conflict resolution is **included** in the default build; install `tailwind-merge` only if the app calls it directly |
| Tailwind pairing | TV **v3.x ↔ Tailwind CSS v4.x**; Tailwind CSS **v3.x → TV v0.x** |
| Site | [https://www.tailwind-variants.org/](https://www.tailwind-variants.org/) |
| Repo | `https://github.com/heroui-inc/tailwind-variants` |

Exports of note:

- `.` — default build (`tv`, `createTV`, `cn`, `cnMerge`, `cx`, …)
- `./lite` — no conflict resolution (~80% smaller)
- `./utils` — shared utils entry

## Research Notes

- Primary docs: Context7 `/websites/tailwind-variants` plus live pages under `https://www.tailwind-variants.org/docs/`.
- README confirms responsive variants were removed because Tailwind v4 dropped `config.content.transform`.
- Created by HeroUI team; comparison positions TV vs CVA primarily around slots, compound slots, extend, and conflict resolution.

## Official Docs

- Introduction: `https://www.tailwind-variants.org/docs/introduction`
- Getting started: `https://www.tailwind-variants.org/docs/getting-started`
- Migration: `https://www.tailwind-variants.org/docs/migration`
- Release notes: `https://www.tailwind-variants.org/docs/release-notes`
- Tailwind CSS v4: `https://www.tailwind-variants.org/docs/tailwindcss-v4`
- Comparison: `https://www.tailwind-variants.org/docs/comparison`
- Variants: `https://www.tailwind-variants.org/docs/variants`
- Slots: `https://www.tailwind-variants.org/docs/slots`
- Overriding styles: `https://www.tailwind-variants.org/docs/overriding-styles`
- Conflict resolution: `https://www.tailwind-variants.org/docs/conflict-resolution`
- Composing components: `https://www.tailwind-variants.org/docs/composing-components`
- Examples: `https://www.tailwind-variants.org/docs/examples`
- TypeScript: `https://www.tailwind-variants.org/docs/typescript`
- Config: `https://www.tailwind-variants.org/docs/config`
- API reference: `https://www.tailwind-variants.org/docs/api-reference`
- FAQ: `https://www.tailwind-variants.org/docs/faq`

## Refresh Triggers

Refresh before relying on this skill when:

- `tailwind-variants` moves past `3.3.0` or peer/merge packaging changes again.
- The project is on Tailwind CSS v3 while code uses TV v3 APIs (or the reverse).
- Tasks mention `responsiveVariants`, `cnBase`, curried `cn(...)(config)`, or required `tailwind-merge`.
- Editors stop completing classes inside `tv` / Prettier stops sorting them.
- Bundle budgets push a default ↔ `/lite` switch.
