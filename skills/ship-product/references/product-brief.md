# Product brief

Ask only these knobs before coding. Do not re-litigate the stack.

## Identity modes

Pick **one** primary mode. Do not force dashboards onto guest flows or guest hacks onto account products.

### Mode A — Accounts + dashboard

- Better Auth with email/password
- Email verification **required** before paid or AI-critical actions
- Optional Google OAuth only when asked or Google env will be provided
- Signed-in app shell, dashboard, settings
- Saved work lives on the user account

### Mode B — Guest checkout

- User configures the product → enters email → pays (Polar)
- No account/dashboard unless the brief adds it later
- Deliver result by email and/or unique opaque URL hash and/or R2 download link
- Access tokens/hashes must be unguessable; store server-side; expire when sensible

### Hybrid

Only if the brief asks: guest purchase that later offers “create account to save.” Default is A or B cleanly.

## Product map

| Knob | Default |
| --- | --- |
| Audience | B2C unless said otherwise |
| Identity mode | A or B from brief |
| Google OAuth | Off unless asked (Mode A only) |
| Money | From brief: one-time / subscription / credits / freemium |
| Core loop | Required — the thing users pay for |
| Guest delivery | Email + unique link and/or R2 when Mode B |
| AI | On only if the core loop generates with an LLM |
| PDF | On only if users download documents |
| Uploads / R2 | On only if binaries or guest assets need object storage |
| Captcha | On for public signup or abuse-prone actions |
| Rate limits | On for auth, AI, or paid-action abuse risk |
| Sentry | On when shipping beyond a local toy |
| Motion | On when marketing/product motion matters |

## Capability → packages

After the map is filled, install from [stack.md](stack.md) only for capabilities that are on.

## Illustration (not the skill’s product)

A wedding speech tool might be Mode A (save speeches) or Mode B (pay → email PDF/link). Any other paid product is equally valid.
