# Framework Adapters and the Better Auth Plugin

## Contents

- Package matrix
- Choosing adapter vs SDK
- Next.js adapter
- TanStack Start adapter
- Nuxt module
- Direct SDK in other frameworks
- Better Auth plugin
- Better Auth flows and pitfalls

## Package matrix

npm `latest` on 2026-10-09; versions verified from the registry.

| Package | Version | Status | Notes |
|---|---|---|---|
| `@polar-sh/sdk` | 1.0.2 | current | Node >=22; `next` tag 1.0.3-alpha.1 |
| `@polar-sh/better-auth` | 2.1.0 | maintained | peers `better-auth ^1.7.0`, `@polar-sh/sdk ^1.0.2`, `zod`; package `engines.node >=24` (docs say Node 22+; trust the package metadata) |
| `@polar-sh/nextjs` | 1.1.0 | maintained | Next.js 15 and 16 App Router route handlers |
| `@polar-sh/tanstack-start` | 1.1.0 | maintained | peer `@tanstack/react-start ^1.168.0` |
| `@polar-sh/nuxt` | 1.1.0 | maintained | Nuxt 4, Node >=22, peer `zod` |
| `@polar-sh/adapter-utils` | 1.1.0 | internal | shared by the maintained adapters |
| `@polar-sh/checkout` | 0.4.3 | maintained | embed (`/embed`), payment-method embed, React components; used by the Better Auth plugin |
| `@polar-sh/cli` | 2.0.2 | maintained | `polar listen`, `polar trigger`, resource commands |
| `@polar-sh/express` 0.6.6, `hono` 0.5.6, `elysia` 0.5.6, `fastify` 0.5.6, `remix` 0.6.6, `sveltekit` 0.7.6, `astro` 0.7.6, `supabase` 0.4.5 | frozen | deprecated in docs (no npm deprecate flag) | depend on SDK `^0.47`, camelCase API, old webhook scheme. Docs: use the SDK directly |
| Deno adapter | n/a | deprecated in docs | use the SDK directly |
| `@polar-sh/laravel` | n/a | PHP/Composer, not an npm package | out of scope here |
| `@polar-sh/ingestion` | 0.4.2 | stale | pins SDK `^0.41`; prefer `events.ingest` |
| `@convex-dev/polar` | 0.9.2 | third-party component | verify before recommending |

No `@polar-sh/*` adapter exists for Cloudflare, Nitro, React Router, Solid Start, Payload, or Fresh. Do not invent import paths; check the registry.

## Choosing adapter vs SDK

- The adapters are thin: one `Checkout` redirect handler, one `CustomerPortal` redirect handler, one `Webhooks` verifier with `onPayload` and ~40 `on<Event>` handlers (`onOrderPaid`, `onSubscriptionRevoked`, `onCustomerStateChanged`, `onBenefitGrantRevoked`, ...). Handlers receive `{ type, timestamp, data }` with `snake_case` fields.
- Use an adapter when it removes boilerplate and the project already runs that framework. Use the SDK directly when you need custom auth around checkout, queue-based webhook processing, per-request currency/IP logic, or a framework without a maintained adapter.
- Adapter webhook handlers run inline before the 2xx response. Keep them to "persist and enqueue".
- Adapters take `accessToken` and `environment: "sandbox" | "production"` (omit for production) explicitly; read them from env, never hard-code.

## Next.js adapter

```ts
// app/api/checkout/route.ts
import { Checkout } from "@polar-sh/nextjs";
export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: process.env.POLAR_SUCCESS_URL,   // absolute URL; {CHECKOUT_ID} appended unless includeCheckoutId: false
  returnUrl: "https://app.example.com/pricing", // absolute URL
  environment: process.env.POLAR_ENVIRONMENT === "production" ? "production" : "sandbox",
});
```

- Query params: `products` (repeat the key for several), `customer_id`, `external_customer_id`, `customer_email`, `customer_name`, `customer_billing_address`, `customer_tax_id`, `customer_ip_address`, `customer_metadata`, `allow_discount_codes`, `discount_id`, `discount_code`, `seats`, `metadata`. Missing `products` returns 400.
- These query params are attacker-controlled. When identity or price matters (`external_customer_id`, `customer_id`, `discount_id`, `seats`), prefer `polar.checkouts.create` in your own authenticated route and keep the adapter handler for anonymous, low-risk purchase links.
- `CustomerPortal({ accessToken, getCustomerId: async (req) => polarCustomerId })`, or `getExternalCustomerId` to resolve by your user ID; empty result returns 400. Derive the ID from the verified session only.
- `Webhooks({ webhookSecret, onPayload, onOrderPaid, ... })` in `app/api/webhook/polar/route.ts` (`export const POST`).

## TanStack Start adapter

Same three exports from `@polar-sh/tanstack-start`, wired as server route handlers:

```ts
// src/routes/api/webhook/polar.ts
import { createFileRoute } from "@tanstack/react-router";
import { Webhooks } from "@polar-sh/tanstack-start";

export const Route = createFileRoute("/api/webhook/polar")({
  server: {
    handlers: {
      POST: Webhooks({
        webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
        onCustomerStateChanged: async (payload) => { /* upsert entitlements, enqueue */ },
      }),
    },
  },
});
```

`CustomerPortal.getCustomerId` here must resolve a Polar customer ID (no external-ID variant); look it up with `customers.getExternal` or store the mapping. Checkout returns 400 without `products` and 500 when creation fails. Keep secrets in server-only env (never `VITE_`-prefixed).

## Nuxt module

`bun add zod @polar-sh/nuxt`, register `modules: ["@polar-sh/nuxt"]`, and set private runtime config (`polarAccessToken`, `polarServer`, `polarCheckoutSuccessUrl`, `polarWebhookSecret`, overridable via `NUXT_PRIVATE_POLAR_*`). `Checkout`, `CustomerPortal`, `Webhooks` are auto-imported in `server/`; call the returned handler with the H3 event. Multiple products use a comma-separated `products` query. Invalid params return 400, creation failure 500.

## Direct SDK in other frameworks

For Express, Hono, Elysia, Fastify, Remix, SvelteKit, Astro, Workers, Bun: write one checkout route, one portal route, and one webhook route with `createPolar` and `webhooks.validateEvent` (patterns in [catalog-checkout.md](catalog-checkout.md), [customers-subscriptions.md](customers-subscriptions.md), [webhooks.md](webhooks.md)). Remove the old adapter and its transitive SDK 0.47 when migrating. Elysia: read the raw `request.text()` for the webhook and do not let body parsing consume the stream first; assert with a test.

## Better Auth plugin

Requires `better-auth >=1.7` (the Better Auth project's own security baseline is >=1.7.7) and `@polar-sh/sdk >=1.0.2`.

```bash
bun add better-auth zod @polar-sh/better-auth @polar-sh/sdk
```

```ts
// auth.ts
import { betterAuth } from "better-auth";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { createPolarCore } from "@polar-sh/sdk/2026-10";

const polarClient = createPolarCore({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  environment: process.env.POLAR_ENVIRONMENT === "production" ? "production" : "sandbox",
});

export const auth = betterAuth({
  plugins: [
    polar({
      client: polarClient,               // createPolarCore, not createPolar
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [{ productId: process.env.POLAR_PRO_PRODUCT_ID!, slug: "pro" }],
          successUrl: "/success?checkout_id={CHECKOUT_ID}",
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          onCustomerStateChanged: async (payload) => { /* upsert entitlements */ },
          onOrderPaid: async (payload) => { /* fulfillment */ },
        }),
      ],
    }),
  ],
});
```

```ts
// auth-client.ts
import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth/client";
export const authClient = createAuthClient({ plugins: [polarClient()] });
```

Run the Better Auth schema workflow after plugin changes if the project's setup requires it. Add `organizationClient()` only when using Better Auth's organization plugin.

## Better Auth flows and pitfalls

- **Signup**: with `createCustomerOnSignUp`, the plugin creates the Polar customer after the user row exists with `external_id = user.id`, links one existing same-email customer that has no external ID, reuses a customer already linked to the same user, and reports a conflict instead of reassigning a different external ID. `getCustomerCreateParams({ user })` can add metadata only; user ID, email, and name stay authoritative. Email or name updates sync to Polar; anonymous users are skipped. Without a Polar customer, `authClient.customer.state()` fails.
- **Deletion**: deleting the user deletes the matching Polar customer. Do not add your own hook.
- **Checkout**: `await authClient.checkout({ slug: "pro" })` or `{ products: [id] }` redirects (`redirect: false` returns the URL). Snake_case options: `reference_id`, `organization_id`, `metadata`, `custom_field_data`, `discount_id`, `discount_code`, `allow_discount_codes`, `seats`/`min_seats`/`max_seats`, `allow_trial`, `trial_interval`, `trial_interval_count`, `success_url`, `return_url`. `authClient.checkoutEmbed(...)` opens the embed and returns an event target (`success`, `close`). Customer IP is forwarded by default (override with `customerIpAddress`).
- **Portal and state**: `authClient.customer.portal()`, `customer.state()`, `customer.benefits.list()`, `customer.orders.list()` (`productBillingType`), `customer.subscriptions.list({ query: { active: true } })`. All are scoped to the signed-in user; anonymous users are rejected.
- **Usage**: ingest billable usage on the server with `ingestEvents(polarClient)({ events: [{ name, external_customer_id: session.user.id, external_id, metadata }] })` from `@polar-sh/sdk/2026-10/services/events`. The `authClient.usage.ingest` endpoint trusts the client and must not carry billable usage. `authClient.usage.meters.list` returns the user's meters.
- **Webhooks**: endpoint path is `<basePath>/polar/webhooks`, default `/api/auth/polar/webhooks`. Register that URL in Polar, set `POLAR_WEBHOOK_SECRET`. Same 403/400/200/throw-to-retry semantics as the standalone adapters. Exclude it from your own auth middleware and any CSRF/origin check that would block Polar.
- **Organization billing** has two modes; do not mix them:
  - `reference_id`: checkout stays on the user's personal Polar customer and stores `metadata.referenceId` on checkout, order, subscription. The plugin does not verify the user belongs to that organization, and subscription listing returns every subscription with that metadata in your Polar organization, so check membership yourself before granting access.
  - `experimental_organizationSync: { enabled: true, ... }` with Better Auth's `organization()` plugin mirrors organizations to Polar team customers (org ID as `external_id`, members as Polar members). It does not migrate existing subscriptions, orders, benefits, or seats, so avoid enabling it on top of `reference_id` billing. Pass `organization_id` / `organizationId` explicitly on checkout, usage, portal, state, benefits, subscriptions, orders, and meters; membership and billing role are verified. Needs scopes `customers:read|write`, `members:read|write`. Optional `syncSeats`, `mapBetterAuthRoleToPolarRole`, `selectSeatProductsForMember`. Experimental: gate behind a feature flag and test in sandbox.
- **Upgrading from plugin 1.x / SDK 0.x**: replace `new Polar({ server })` with `createPolarCore({ environment })` from `@polar-sh/sdk/2026-10`, switch payload field access to snake_case (`payload.data.customer_id`), and re-test every webhook handler.
- The plugin does not replace entitlement storage. Persist state from `onCustomerStateChanged` (or call `customer.state()`) and gate on that.
