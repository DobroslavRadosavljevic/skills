# Webhooks, Events, Thin Events

Handler and adapter snippets typechecked against `stripe@23.0.0`, `hono`, and `elysia` (TanStack Start follows the documented `server.handlers` shape).

## Contents

- Rules
- Core handler
- Framework adapters (Bun, Hono, Elysia, TanStack Start, Express)
- Idempotent processing schema
- Ordering and missing data
- Retries and responses
- Event destinations, secrets, versions
- Thin events (EventNotificationHandler)
- Testing locally and in tests
- Failure diagnosis

## Rules

1. Read the **raw body once**, as text or bytes, before any JSON parsing or middleware that re-serializes it.
2. Verify with `stripe.webhooks.constructEventAsync(rawBody, signatureHeader, endpointSecret)`. Default tolerance is 300 s; do not pass `0` outside tests.
3. One secret per endpoint/destination per mode (`whsec_...`). The secret printed by `stripe listen` differs from the Dashboard one.
4. Acknowledge fast with 2xx. Do heavy work after dedupe, ideally on a queue.
5. Deduplicate on `event.id` inside the same transaction as the side effects.
6. Never assume order. Re-fetch current objects from the API.
7. Subscribe only to events you handle. Unknown events: return 200.
8. Do not use webhook payloads to authenticate users or trust amounts in a way that bypasses your own order records.

## Core handler

Framework-agnostic `Request -> Response`; adapters below only pass the raw `Request`.

```ts
// src/server/stripe-webhook.ts
import type Stripe from "stripe"
import { stripe } from "../lib/stripe"

export async function stripeWebhook(request: Request): Promise<Response> {
  const signature = request.headers.get("stripe-signature")
  if (!signature) return new Response("missing signature", { status: 400 })

  const rawBody = await request.text() // untouched body
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response("invalid signature", { status: 400 }) // no details, no logging of body
  }

  try {
    await processEvent(event) // dedupe + side effects, see below
  } catch (err) {
    console.error("stripe webhook failed", { id: event.id, type: event.type, err })
    return new Response("processing error", { status: 500 }) // Stripe retries
  }
  return new Response(null, { status: 200 })
}
```

```ts
function subscriptionIdOf(event: Stripe.Event): string | null {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      return event.data.object.id
    case "invoice.paid":
    case "invoice.payment_failed": {
      const ref = event.data.object.parent?.subscription_details?.subscription
      return typeof ref === "string" ? ref : (ref?.id ?? null)
    }
    case "checkout.session.completed": {
      const s = event.data.object
      if (s.mode !== "subscription" || !s.subscription) return null
      return typeof s.subscription === "string" ? s.subscription : s.subscription.id
    }
    default:
      return null
  }
}

export async function processEvent(event: Stripe.Event) {
  const subId = subscriptionIdOf(event)
  const row = subId ? await loadSubscriptionRow(subId) : null // API read outside the DB transaction
  await db.transaction(async (tx) => {
    if (!(await tx.insertEventIfNew({ id: event.id, type: event.type }))) return // duplicate delivery
    if (row) await tx.upsertSubscription({ ...row, userId: row.userId ?? (await tx.customerIdToUserId(row.stripeCustomerId)) })
    // one-time orders, entitlements refresh, refunds, disputes: add cases here, same transaction
  })
}
```

`loadSubscriptionRow` is in [billing-subscriptions.md](billing-subscriptions.md). Narrowing on `event.type` gives typed `event.data.object` for the pinned API version.

## Framework adapters

Bun.serve (routes):

```ts
Bun.serve({ routes: { "/webhooks/stripe": { POST: (req) => stripeWebhook(req) } } })
```

Hono (`c.req.raw` is the untouched `Request`; do not call `c.req.json()` first):

```ts
app.post("/webhooks/stripe", (c) => stripeWebhook(c.req.raw))
```

Elysia (skip Elysia's body parser or the stream is consumed; Elysia only parses once):

```ts
new Elysia().post("/webhooks/stripe", ({ request }) => stripeWebhook(request), { parse: "none" })
```

Do not add a `body` schema to this route. Global `onParse`/body hooks that read the body also break it.

TanStack Start (server route, file such as `src/routes/api/stripe/webhook.ts`):

```ts
import { createFileRoute } from "@tanstack/react-router"
import { stripeWebhook } from "~/server/stripe-webhook"

export const Route = createFileRoute("/api/stripe/webhook")({
  server: { handlers: { POST: ({ request }) => stripeWebhook(request) } },
})
```

Keep the route out of auth/CSRF middleware; the signature is the authentication. Apply body-size limits upstream but never body transformation.

Express (only Node/Express shape that needs care):

```ts
app.post("/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const event = await stripe.webhooks.constructEventAsync(req.body, req.headers["stripe-signature"]!, secret)
  res.sendStatus(200)
})
// register express.json() for other routes AFTER this one, or exclude this path
```

Proxies, gateways, and CDNs must forward the body unmodified (no gzip re-encode, no JSON re-serialization, no added whitespace).

## Idempotent processing schema

```sql
create table stripe_events (
  id          text primary key,           -- evt_...
  type        text not null,
  received_at timestamptz not null default now()
);
-- insertEventIfNew:
-- insert into stripe_events (id, type) values ($1, $2) on conflict (id) do nothing returning id;
-- zero rows returned => duplicate => skip
```

- Because the insert and the side effects share one transaction, a crash rolls both back and Stripe's retry reprocesses cleanly; a concurrent duplicate blocks on the unique key and then no-ops.
- External side effects (emails, third-party APIs) cannot roll back: enqueue them via an outbox table inside the same transaction, and send with their own idempotency keys.
- Queue pattern for slow work: in the handler insert the event (status `received`) plus a job, return 200; the worker processes and marks `processed`. Reprocess by resetting status. Prune old rows after the retry window (weeks).
- Business-level idempotency still applies (unique constraint on order/payment id), because the same business fact can arrive via different events (`checkout.session.completed` and `payment_intent.succeeded`).

## Ordering and missing data

- Stripe does not guarantee delivery order. Timestamps are in seconds and can tie; do not order by `event.created`.
- Make handlers **convergent**: on any event, fetch the current object and overwrite your projection. Two events in either order then produce the same final row.
- When a prerequisite is missing (e.g. an `invoice.paid` arrives before your DB knows the customer), either fetch what you need from the API or return 5xx so Stripe retries later. For customers that do not belong to your app (shared account), return 200 and ignore.
- Deleted objects: `customer.subscription.deleted` still carries the final object; the API retrieve returns `canceled`.
- Connect events carry `event.account`; load objects with `{ stripeAccount: event.account }`.

## Retries and responses

- Any non-2xx or timeout is a failure. Live mode retries for up to 3 days with exponential backoff; sandbox retries 3 times over a few hours. Disabling or deleting a destination cancels pending retries.
- Return 400 for bad signatures, 500 for transient/unknown failures you want retried, 200 for handled or intentionally ignored events. Do not return 4xx for business-logic misses you want retried.
- Respond within a few seconds. Long handlers cause timeouts, then duplicate deliveries.
- Replay: Dashboard "Resend", or `stripe events resend <evt_id>` (add `--webhook-endpoint=we_...` to target one). Only for test/sandbox in agent sessions.
- Monitor failure rates and delivery attempts in Workbench; alert on repeated failures. A persistently failing endpoint can delay Billing finalization (Stripe waits for the `invoice.created` response before attempting payment).

## Event destinations, secrets, versions

- "Event destinations" is the current name for where events go: webhook endpoints (HTTPS URL), Amazon EventBridge, Azure Event Grid. Create in Workbench or via `stripe.webhookEndpoints.create({ url, enabled_events, api_version })` / `stripe.v2.core.eventDestinations`.
- Pin `api_version` on the endpoint (snapshot format) to the same version your code's types assume. Mixed versions across endpoints are fine if each handler is typed for its endpoint.
- Create separate endpoints (and secrets) for sandbox and live, and for Connect (`connect: true`, "events from connected accounts").
- Secrets: store `STRIPE_WEBHOOK_SECRET` in the host's secret store. Rotate with the Dashboard's roll-secret action: the old secret can stay valid for a limited window (Stripe signs with both), so deploy the new secret inside that window.
- Endpoint URLs must be HTTPS and publicly reachable in live mode. Use `stripe listen --forward-to` locally.

## Thin events (EventNotificationHandler)

Thin events (GA for v1 resources with Endive) send a small notification: `id`, `type` (prefixed `v1.`, e.g. `v1.customer.subscription.updated`), `related_object`, optional `changes`. Payload shape is version-independent; you fetch the current object. The destination must be created with event format **Thin** and `v1.*` event types.

| | Snapshot (`customer.subscription.updated`) | Thin (`v1.customer.subscription.updated`) |
| --- | --- | --- |
| Payload | full object at endpoint API version | `related_object` ref (+ `changes`) |
| Version coupling | tied to endpoint `api_version` | none |
| Extra API call | optional | usually one fetch |
| SDK | `constructEventAsync` | `parseEventNotification` / `notificationHandler` |

```ts
const handler = stripe.notificationHandler(
  process.env.STRIPE_THIN_WEBHOOK_SECRET!,
  async (event, _client, details) => {
    console.warn("unhandled thin event", event.type, details.isKnownEventType) // fallback for unknown types
  },
)

handler.preHandle(async (event) => !(await alreadyProcessed(event.id))) // return false to skip duplicates

handler.on("v1.customer.subscription.updated", async (event) => {
  const sub = await event.fetchRelatedObject() // current state from the API
  await upsertFromStripe(sub)
})

export async function thinWebhook(req: Request) {
  await handler.handle(await req.text(), req.headers.get("stripe-signature")!)
  return new Response(null, { status: 200 })
}
```

- Lower-level: `stripe.parseEventNotification(rawBody, sig, secret)` returns a typed `EventNotification` (`.fetchRelatedObject()`, `.fetchEvent()`); unknown newer types come as `UnknownEventNotification`.
- `snapshot_event` on the v2 Event links to the equivalent v1 snapshot event.
- Use `notificationHandlerWithoutVerification` only for channels already authenticated by the cloud provider (EventBridge, Event Grid), never for public HTTP routes.
- Thin handlers still need durable dedupe (the SDK's `preHandle` example uses an in-memory set; replace it with the DB table) and a 5xx on failure so Stripe retries. Check how `handle` surfaces signature errors and map them to 400 (and processing errors to 5xx).
- Do not run snapshot and thin destinations for the same event on the same side effect without dedupe on the business key.

## Testing locally and in tests

```bash
stripe login
stripe listen --forward-to localhost:3000/webhooks/stripe        # prints whsec_ for this session
stripe listen --events checkout.session.completed,invoice.paid --forward-to localhost:3000/webhooks/stripe
stripe trigger customer.subscription.created                      # sandbox only
stripe events resend evt_123                                      # re-deliver
```

Unit-test the handler with signed fixtures; no network needed:

```ts
const payload = JSON.stringify({ id: "evt_test_1", object: "event", type: "invoice.paid", data: { object: {} } })
const header = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_test" })
const res = await stripeWebhook(new Request("http://x/webhooks/stripe", { method: "POST", body: payload, headers: { "stripe-signature": header } }))
```

Cases: valid; tampered body; wrong secret; stale timestamp (`timestamp` option); duplicate id twice; out-of-order pair; handler throws then retried. Use `stripe trigger` fixtures only for smoke tests; they use generic objects with no app metadata.

## Failure diagnosis

| Symptom | Likely cause |
| --- | --- |
| `No signatures found matching the expected signature` | Body parsed/re-serialized; wrong endpoint secret (CLI vs Dashboard, test vs live); proxy changed body; whitespace in env value |
| `Timestamp outside the tolerance zone` | Server clock skew, queued/replayed request, or tolerance too small |
| Empty-secret error (stripe-node 22.6.2+) | `STRIPE_WEBHOOK_SECRET` unset at runtime |
| Works with CLI, fails in production | Production still has the CLI `whsec_`, or route behind auth/CSRF/body middleware |
| Payload fields missing vs types | Endpoint `api_version` older/newer than SDK pinned version |
| Duplicate side effects | No dedupe, or dedupe outside the transaction |
| Handler works but access never granted | Reading `current_period_end` from the subscription (moved to items), or not handling `checkout.session.completed` |
