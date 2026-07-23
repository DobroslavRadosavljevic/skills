# Payments (Polar)

Use Polar for every paid product. Wire checkout and webhooks in code during build; execute live checkout only after the env gate.

## Shared

- Workspace- or order-owned billing records in Postgres (Mode A: usually user/account scoped; Mode B: order scoped).
- Hosted Polar checkout.
- Verified webhook signatures.
- Store processed webhook event ids for idempotency / replay protection.
- Sync subscription or one-time payment state into local tables.
- Sandbox vs live tokens documented in `.env.example`.
- Never log full secrets.

## Mode A — Accounts

- Checkout tied to the authenticated user (and plan entitlements as designed).
- Customer portal when subscriptions are used.
- Gate paid/AI features on local entitlement state, not only client flags.
- Require verified email before paid or AI-critical actions.

## Mode B — Guest checkout

Typical flow:

1. User configures the product.
2. Enters email.
3. Starts Polar checkout (one-time or as brief specifies).
4. Webhook marks order paid.
5. Generate result (sync in-request when short; otherwise mark processing and complete via webhook/follow-up path without a job queue unless later unlocked).
6. Email the user a receipt + access: unique opaque URL and/or R2 download link.
7. Opaque route validates token and serves or redirects to the asset.

## Env (when payments on)

- `POLAR_ACCESS_TOKEN`
- `POLAR_WEBHOOK_SECRET`
- Product / price ids as required by the Polar catalog setup for this app

## Do not

- Invent fake “successful payment” in production paths
- Skip signature verification
- Process the same webhook event twice as two fulfillments
- Put long-lived secrets in query strings (opaque access tokens only)
