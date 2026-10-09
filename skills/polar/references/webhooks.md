# Webhooks

## Contents

- Rule: webhooks are the source of truth
- Endpoint setup and versions
- Signature verification
- Receiver pattern
- Idempotency and ordering
- Delivery, retries, and troubleshooting
- Event catalog and sequences
- Recommended subscriptions
- Local development and testing

## Rule: webhooks are the source of truth

Polar is the merchant of record and the only party that knows whether money moved. Redirects, client callbacks, and `checkout.status` are hints. Derive every entitlement change (grant, change, revoke) from verified webhooks, store the result in your database, and use Customer State or list endpoints only to reconcile. Never grant on `checkout.created`, `checkout.updated`, or `order.created`; use `order.paid` for fulfillment and `customer.state_changed` or `benefit_grant.*` for access.

## Endpoint setup and versions

Dashboard: Settings → Webhooks → Add Endpoint: public HTTPS URL (no redirects), format `raw` (Slack/Discord formats exist for chat alerts), events, and the secret. One endpoint per environment and per app; sandbox and production endpoints are independent.

- API 2026-10 removed the user-supplied `secret` on create/update; Polar generates it. Rotate with `polar.webhooks.resetWebhookEndpointSecret` (needs `webhooks:write`) and redeploy the new `POLAR_WEBHOOK_SECRET`.
- Set `api_version` on the endpoint (`"2026-10"`); payloads then stay stable across quarterly releases. Updating it affects only future events; redeliveries keep their original contract. Each delivery has `webhook-api-version`.
- Create via API: `polar.webhooks.createWebhookEndpoint({ url, format: "raw", events: [...], api_version: "2026-10" })`.

## Signature verification

Polar sends Standard Webhooks headers: `webhook-id`, `webhook-timestamp`, `webhook-signature`. Secrets generated on or after 2026-09-08 00:00 UTC use Standard Webhooks signing; older secrets use Polar's HMAC (key is the UTF-8 bytes of the entire `whsec_...` string). SDK `>=1.0.0-alpha.19` (so 1.0.x) tries both, so pass the dashboard secret unchanged. Regenerating a secret moves an endpoint to the Standard Webhooks scheme.

```ts
import { webhooks } from "@polar-sh/sdk/2026-10";
const event = await webhooks.validateEvent(rawBody, headers, process.env.POLAR_WEBHOOK_SECRET!);
```

- Signature: `(body: string | Uint8Array, headers: Record<string, string>, secret: string) => Promise<WebhookPayload>` (async; `await` it).
- Errors: `webhooks.PolarWebhookVerificationError` (return 403), `webhooks.PolarWebhookUnknownTypeError` (signed but unknown to this API version; ack with 2xx and alert), `webhooks.PolarWebhookError` base (malformed payload; 400).
- Pass the exact raw bytes or string. Run the raw-body reader before any JSON parser. Re-serializing the parsed body breaks the signature.
- Old docs and examples that import `validateEvent` / `WebhookVerificationError` from `@polar-sh/sdk/webhooks` target SDK 0.x. Use the versioned `webhooks` namespace.
- With a Standard Webhooks library directly: pass the new-style secret as-is; for old-style secrets base64-encode the whole `whsec_` string first. Prefer the SDK.

## Receiver pattern

Verify, persist, enqueue, ack. Do slow work in a worker.

```ts
import { webhooks } from "@polar-sh/sdk/2026-10";

export async function POST(request: Request): Promise<Response> {
  const body = await request.text();
  const headers = {
    "webhook-id": request.headers.get("webhook-id") ?? "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
    "webhook-signature": request.headers.get("webhook-signature") ?? "",
  };

  let event: webhooks.WebhookPayload;
  try {
    event = await webhooks.validateEvent(body, headers, POLAR_WEBHOOK_SECRET);
  } catch (error) {
    if (error instanceof webhooks.PolarWebhookVerificationError) return new Response(null, { status: 403 });
    if (error instanceof webhooks.PolarWebhookUnknownTypeError) {
      console.warn("unsupported signed polar event", { type: error.eventType });
      return new Response(null, { status: 202 });
    }
    if (error instanceof webhooks.PolarWebhookError) return new Response(null, { status: 400 });
    throw error; // 5xx so Polar retries
  }

  // Unique constraint on webhook_id: insert-or-ignore, enqueue only when newly inserted.
  await recordAndEnqueue({ webhookId: headers["webhook-id"], type: event.type, payload: event });
  return new Response(null, { status: 202 });
}
```

Framework notes:

- Express: register `app.post("/webhooks/polar", express.raw({ type: "application/json" }), ...)` before `app.use(express.json())`; or capture the buffer via the JSON parser's `verify` option. Express 4 does not forward async errors; call `next(error)`.
- Next.js route handler: `await request.text()`; exclude the route from auth middleware; do not use the edge body parser on pages routes.
- TanStack Start: server route handler `POST` using `request.text()`.
- Hono/Elysia/Bun/Workers: `await c.req.text()` / the raw `Request`; Elysia needs the raw body, so disable body parsing for that route.
- Adapters (`Webhooks(...)` from `@polar-sh/nextjs`, `@polar-sh/tanstack-start`, `@polar-sh/nuxt`, the Better Auth `webhooks()` plugin) do the same verification and return 403 for bad signatures, 400 for malformed payloads, 200 for unknown signed types; a throwing handler fails the request so Polar retries. Their handlers run inline, so keep them short or only enqueue.

## Idempotency and ordering

- Dedupe on `webhook-id` with a database unique constraint (an in-memory set is not enough). Do not dedupe on `data.id`; the same resource legitimately produces many events.
- Delivery is at-least-once and not ordered. `subscription.updated` can arrive before `subscription.created`; Stripe-migration events can interleave with Polar events. Make each write a state-based upsert keyed by the object ID, compare `modified_at` and ignore stale payloads, or re-fetch the object via the API before applying.
- Prefer snapshot events for access (`customer.state_changed`): compute desired state and write it idempotently, enabling and disabling.
- Side effects (emails, provisioning) get their own idempotency key (for example `order.id` + purpose).
- Multiple events per action are normal (cancel yields `subscription.updated` and `subscription.canceled`). Pick one event as the trigger for each side effect.
- Persist the raw verified payload for replay and audit; drop PII you do not need.
- Add a periodic reconcile job: list active subscriptions or Customer States and compare with local entitlements to heal missed deliveries.

## Delivery, retries, and troubleshooting

- Polar retries failed deliveries up to 10 times with exponential backoff. Request timeout is 10 s today; respond within 2 s because the timeout may shrink.
- An endpoint is auto-disabled after 10 consecutive non-2xx responses and organization members are emailed; re-enable in Settings → Webhooks after fixing. Redirects (3xx, including `www` vs apex, or missing trailing slash) count as failures.
- 403 causes: auth middleware on the route, Cloudflare Bot Fight Mode (disable it; IP allowlisting does not help), WAF rules.
- Invalid signature causes: body parsed before verification, wrong environment's secret, secret from a different endpoint, proxy altering the body, old-style vs new-style secret with a hand-rolled verifier.
- Redeliver from the dashboard delivery log or `polar.webhooks.redeliverWebhookEvent`.
- Firewall allowlist (docs as of 2026-09): production `3.134.238.10`, `3.129.111.220`, `52.15.118.168`, `3.134.178.243` (new, rolling out), `74.220.50.0/24`, `74.220.58.0/24`; sandbox `3.134.238.10`, `3.129.111.220`, `52.15.118.168`, `18.117.215.101`, `74.220.50.0/24`, `74.220.58.0/24`. Re-check the delivery docs before pinning.

## Event catalog and sequences

Payload shape: `{ type, timestamp, data }`; fields are `snake_case`. 2026-10 event types:

- checkout: `checkout.created`, `checkout.updated`, `checkout.expired`
- customer: `customer.created`, `customer.updated`, `customer.deleted`, `customer.state_changed`
- seats and members: `customer_seat.assigned`, `customer_seat.claimed`, `customer_seat.revoked`, `member.created`, `member.updated`, `member.deleted`
- orders and refunds: `order.created`, `order.updated`, `order.paid`, `order.refunded`, `refund.created`, `refund.updated`
- subscriptions: `subscription.created`, `subscription.updated` (catch-all), `subscription.active`, `subscription.canceled`, `subscription.uncanceled`, `subscription.cycled`, `subscription.revoked`, `subscription.past_due`, `subscription.paused`, `subscription.resumed`, `subscription.migrated`
- benefits: `benefit.created`, `benefit.updated`, `benefit_grant.created`, `benefit_grant.updated`, `benefit_grant.cycled`, `benefit_grant.revoked`
- catalog and org: `product.created`, `product.updated`, `discount.created`, `discount.updated`, `discount.deleted`, `organization.updated`

Sequences:

- Cancel at period end: `subscription.updated`, `subscription.canceled` now (still `active`, `cancel_at_period_end: true`); at period end `subscription.updated`, `subscription.revoked` (`canceled`). Immediate revoke: `updated`, `canceled`, `revoked` together.
- Renewal: `subscription.cycled` (fires on every new period, also trial conversion; read `status`), `subscription.updated`, `order.created` (`pending`), then `order.updated`, `order.paid`. Failed payment: `subscription.past_due`.
- Pause: `subscription.updated` now (`pause_at_period_end`); at period end `subscription.updated`, `subscription.paused` (benefits revoked). Resume: `subscription.updated`, `subscription.resumed`, `order.created`.
- Stripe takeover: `subscription.updated`, `subscription.migrated` (with `provider`, `provider_subscription_id`); no `subscription.created` or `.active`.
- Seats: `order.paid`, `subscription.updated` (seat change), `customer_seat.assigned`, `customer_seat.claimed`, `benefit_grant.created` (use `member`), then reverse on revoke.

## Recommended subscriptions

Subscribe to the minimum that matches your model; unsubscribed events cost nothing.

- Access control via state: `customer.state_changed`, `order.paid`, `order.refunded`, `subscription.past_due`.
- Local grant ledger: `benefit_grant.created|updated|revoked` plus `customer.state_changed` for repair.
- Subscription UI/analytics: `subscription.updated` (or the narrow lifecycle events) and `subscription.cycled`.
- Seats: `customer_seat.*`, `member.*`, `benefit_grant.*`.
- Skip catalog events unless you mirror the catalog.

## Local development and testing

Polar CLI (`@polar-sh/cli` 2.0.x, single binary; `curl -fsSL https://polar.sh/install.sh | bash` or `bun install -g --trust @polar-sh/cli`):

```bash
polar auth login --sandbox
polar listen http://localhost:3000/api/webhooks     # prints the signing secret for this session
polar trigger order.paid --override data.customer.email=test@example.com
polar trigger --list
polar trigger subscription.active --seed 42 --dry-run
```

- Put the printed secret into the local `POLAR_WEBHOOK_SECRET` (it is a session secret, not your endpoint's). `trigger` creates nothing in Polar; it sends a realistic sample through `listen`.
- Headless CI: set `POLAR_ACCESS_TOKEN` and `POLAR_ENVIRONMENT=sandbox`; the env token overrides saved sessions.
- Real flow: buy a sandbox product with `4242 4242 4242 4242` and watch the dashboard delivery log.
- Unit-test the handler with fixtures signed by the same library path (compute a Standard Webhooks signature with a test secret), covering: bad signature, duplicate `webhook-id`, unknown type, out-of-order pair, and handler failure returning 5xx.
