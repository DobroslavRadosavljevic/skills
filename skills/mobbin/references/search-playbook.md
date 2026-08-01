# Mobbin Search Playbook

## Pick the tool

| Need | Tool | Examples |
| --- | --- | --- |
| One screen, layout, component cluster | `search_screens` | login, paywall, empty state, settings row, permission prompt |
| Ordered multi-step journey | `search_flows` | onboarding, checkout, KYC, password reset, booking |
| Marketing / site block | `search_sections` | pricing table, footer, hero, logo cloud, feature grid |

When unsure: start with `search_screens` for composition, add `search_flows` if sequence/state transitions matter, add `search_sections` for landing/marketing pages.

## Platform

Set `platform` to:

- `ios` — mobile app patterns (also use when the product is a native-like mobile web app and you want mobile references)
- `web` — desktop/web app and website patterns

Never put “iOS” / “web” only inside the query; use the parameter.

## Query writing (critical)

Official guidance (screens search): describe **one** screen in plain language — UI elements and how they relate. Be specific.

**Good**

- `login screen with biometric authentication and email fallback link`
- `checkout page with promo code field and Apple Pay button`
- `notification permission pre-prompt explaining benefits before system dialog`
- `Spotify now-playing screen` (app name filters to that app)

**Bad**

- `modern clean login` (vague style words)
- `onboarding and checkout and settings` (multiple intents — split searches)
- `paywall without dark mode` (negations work poorly)
- `button input modal card` (disconnected keywords)

### Enrich queries with product context

Fold in domain and job-to-be-done without style fluff:

- Domain: `neobank`, `B2B analytics`, `consumer marketplace`, `health habit tracker`
- Job: `reduce signup drop-off`, `compare two pricing tiers`, `recover abandoned cart`
- UI structure: `sticky CTA`, `stepper`, `bottom sheet`, `split panel`, `data table empty state`

Keep under practical length (API max 500 chars for screen search).

## Modes and limits

Aligned with current screens search API (MCP should mirror; verify schema):

| Param | Guidance |
| --- | --- |
| `mode` | Default **`deep`** for design judgment. Use **`standard`** for quick scans / rate limits. Avoid **`fast`** (deprecated alias of `standard`). |
| `limit` | Start ~12–20. Raise only if diversity is needed; higher limits cost more context. |
| `image_quality` | Prefer `optimized` for agent inspection; `high` when scrutinizing fine typography/spacing. |
| `exclude_screen_ids` | Pass prior result IDs when paging for fresh alternatives. |

If flow/section tools expose overlapping params, apply the same query discipline.

## Search strategy

1. **Anchor search** — one precise query for the primary screen/flow.
2. **Contrast search** — peer apps or alternate pattern (`linear progress KYC` vs `numbered step KYC`).
3. **Edge-state search** — error, empty, success, permission denied, offline when relevant.
4. **Exclude & widen** — `exclude_screen_ids` + slightly broader or narrower wording if results cluster.

### Example sequences

Paywall:

1. `search_screens` + `ios` + `subscription paywall with annual toggle and restore purchase`
2. `search_screens` + `ios` + `soft paywall with free tier comparison table`
3. `search_flows` + `ios` + `trial signup to paywall to purchase success`

Checkout:

1. `search_flows` + `web` + `ecommerce checkout with guest checkout and express payment`
2. `search_screens` + `web` + `checkout order summary sidebar with promo code field`

## After results

- Read images; note layout structure, hierarchy, copy tone, and interaction chrome.
- Keep `mobbin_url` / app names for citations.
- Discard off-category hits; do not force-fit.
- If everything is irrelevant, rewrite — do not design from empty inspiration.
