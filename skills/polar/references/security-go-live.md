# Security and Go-Live Checklists

## Contents

- Secrets and agent conduct
- Security checklist
- Go-live checklist
- Operations after launch

## Secrets and agent conduct

- Never ask for, paste, echo, summarize, or log a live access token, webhook secret, OAuth client secret, customer session token, license key, or `.env` contents. Refer to env var names only (`POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_ENVIRONMENT`). If the user pastes one, tell them to revoke or rotate it in the Polar dashboard and continue with the variable name.
- Do not read secret files into the conversation. Check presence without printing values (for example test that a variable is set).
- Work against sandbox by default. Do not trigger production checkouts, refunds, subscription revokes, customer deletion, product deletion, webhook secret resets, or payouts without the user's explicit approval for that action.
- Configure secrets through the deployment platform's secret store, not committed files. Add `.env*` to `.gitignore`; Polar auto-revokes tokens that GitHub secret scanning finds, so a leaked token also causes an outage.

## Security checklist

Credentials
- [ ] OAT used server-side only; none in client bundles, mobile apps, extension code, or public repos (`VITE_`, `NEXT_PUBLIC_`, `PUBLIC_` prefixes never carry Polar secrets).
- [ ] Separate tokens and webhook secrets for sandbox and production, per service, with expiry and least-privilege scopes.
- [ ] Rotation procedure documented (token, webhook secret via `resetWebhookEndpointSecret`).
- [ ] Logs and error trackers redact `Authorization`, webhook headers/bodies, and customer PII.

Server-side authority
- [ ] Customer and portal sessions are created for the authenticated user derived from the server session, never from request params (no IDOR via `customer_id` / `external_customer_id`).
- [ ] Product IDs, discount IDs, ad-hoc `prices`, `amount`, `seats`, and `success_url` for checkouts are allow-listed or computed server-side.
- [ ] `return_url` / `success_url` hosts validated against an allow-list.
- [ ] Billable usage is ingested only from trusted server code; the client cannot post arbitrary events.
- [ ] Organization billing (`reference_id`, org customers) checks the user's membership and role before acting.
- [ ] Embedded checkout hosts are listed in Settings → Preferences → Embedding (HTTPS only); `embed_origin` set.

Webhooks
- [ ] Route is public (outside auth/CSRF middleware), HTTPS, no redirects.
- [ ] Raw body verified with `webhooks.validateEvent` before parsing; 403 on bad signature.
- [ ] `webhook-id` unique constraint; handlers idempotent; stale and out-of-order events tolerated.
- [ ] Unknown signed event types acknowledged and alerted on; handler failures return 5xx.
- [ ] Network allowlist (optional) is additional to, not a replacement for, signature verification.

Entitlements
- [ ] Access derives from webhook-fed state (`customer.state_changed` / grants), not from redirects or client claims.
- [ ] Revocation paths tested: cancel at period end, revoke, `past_due` after grace, refund, proactive chargeback refund.
- [ ] Seat access keyed by member, not billing customer.
- [ ] License key validation sends `organization_id` and checks `benefit_id`.

Data and compliance
- [ ] No card data, secrets, or sensitive personal data in `metadata` or `customer_metadata`.
- [ ] Customer deletion flow also removes the Polar customer when required.
- [ ] Privacy policy, terms, and refund policy are public and linked from the product site (needed for review).

Supply chain
- [ ] SDK and adapters pinned in the lockfile (`@polar-sh/sdk` 1.0.x, API version import path pinned).
- [ ] No deprecated adapter pinned to SDK `^0.47` left in production paths.
- [ ] CI uses sandbox credentials only.

Abuse
- [ ] Rate limit checkout and portal-session creation per user and IP.
- [ ] Trial abuse prevention and per-customer discount limits enabled where relevant.

## Go-live checklist

Account and compliance
- [ ] Submit the first payout review at Finance → Account: business description, owner identity verification (Stripe Identity), payout account (Stripe Connect Express). Allow up to 14 days; submit after the integration works end to end.
- [ ] Product complies with the Acceptable Use Policy; a live website shows the product; provide reviewers a 100% discount code or a recording of the paid-user journey.
- [ ] Support contact monitored (Polar expects a reply within 48 hours when looped in).

Production environment
- [ ] Production organization created; catalog (products, prices, currencies, benefits, discounts, meters, custom fields) recreated; production IDs stored in production config only.
- [ ] Organization defaults reviewed: payment currency, tax behavior, proration behavior, benefit-revocation grace period, trial abuse prevention, multiple subscriptions, customer notifications, customer portal toggles.
- [ ] Production OAT created with least-privilege scopes; `environment` is `production` only in the production deployment.
- [ ] Webhook endpoint created in production with the production URL, `api_version`, required events, and secret stored; a `polar trigger`/sandbox rehearsal passed with the same code.
- [ ] Firewall/WAF/Cloudflare allow Polar deliveries (Bot Fight Mode off for the route); endpoint-disabled emails reach a monitored address.
- [ ] Success, return, and portal URLs point to production hosts; embed hosts configured.
- [ ] Checkout creation forwards `customer_ip_address` and sets `external_customer_id`.

Verification in production (no real card testing)
- [ ] Free product or 100% discount code purchase: checkout, webhook delivery, entitlement grant, portal access, cancel, revoke.
- [ ] Customer State read matches local entitlements.
- [ ] Usage events appear on the meter with correct `inserted`/`duplicates`.
- [ ] Reconcile job runs and reports zero drift.

Readiness
- [ ] Dashboards/alerts: webhook failures, signature failures, unknown event types, queue depth, entitlement drift, 429s from the API, `past_due` counts.
- [ ] Runbook: replay deliveries (`redeliverWebhookEvent`), rotate secrets, disable purchases, manual revoke, refund path.
- [ ] Chargeback rate monitored (Polar holds accounts to 0.4%; card networks treat 0.7% as excessive).
- [ ] API version pinned and an upgrade date scheduled before the pinned version's removal.

## Operations after launch

- Each quarter (January, April, July, October) review the API changelog and move the SDK import path and webhook `api_version` to the new Current in sandbox first.
- Watch the changelog for webhook IP changes and secret-signing changes.
- Keep the reconcile job and receipts table; prune payloads per your retention policy.
