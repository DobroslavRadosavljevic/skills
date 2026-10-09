# SDK Setup, API Versions, Tokens, Sandbox

## Contents

- Install and client
- API versions
- Tokens and scopes
- Sandbox vs production
- Call conventions, pagination, errors
- Tree-shaken core client

## Install and client

```bash
bun add @polar-sh/sdk   # 1.0.2, Node >=22, ESM + CJS, fetch-based
```

```ts
import { createPolar } from "@polar-sh/sdk/2026-10";

const accessToken = process.env.POLAR_ACCESS_TOKEN;
if (!accessToken) throw new Error("POLAR_ACCESS_TOKEN is required");

export const polar = createPolar({
  accessToken,
  environment: process.env.POLAR_ENVIRONMENT === "production" ? "production" : "sandbox",
});
```

- Create the client once per process and reuse it. There is no close lifecycle.
- `PolarOptions`: `accessToken`, `environment` (`"production"` default, or `"sandbox"`), `timeout` (seconds), `organizationId` (sends `Polar-Organization`; only needed for user/OAuth tokens that span several organizations), `baseUrl`.
- Per-request override as the last argument: `{ timeout: 60 }` or `{ accessToken }`.
- Fail closed on environment: default to sandbox in dev/test, and require an explicit production switch in deployed config.
- The package root (`@polar-sh/sdk`) exports only the error classes and `RequestOptions`. Everything else comes from a versioned path.

## API versions

Polar uses date-based API versions (`YYYY-MM`) for requests, responses, webhook payloads, and SDK types. Docs and OpenAPI list three at 2026-10-09: `2026-04` (Deprecated, inferred from the lifecycle rules), `2026-10` (Current, the SDK README default), `2027-01` (Next, may change). Releases land the first week of January, April, July, October; Deprecated is then removed.

- Pin the version in every production integration. Omitted `Polar-Version` means Current, which moves each quarter.
- SDK: import path pins it (`@polar-sh/sdk/2026-10`) and sets the `Polar-Version` header. Upgrading the package does not change the API contract; changing the import path does.
- REST: send `Polar-Version: 2026-10`. Unknown or removed versions return 404.
- Webhooks are versioned separately via the endpoint's `api_version`; upgrading the client does not migrate endpoints. Every delivery carries `webhook-api-version`. Keep the client and endpoint on the same version unless you intend otherwise.
- Upgrade in sandbox first: change the import path, run tests, update webhook endpoint `api_version`, deploy, confirm the `Polar-Version` response header.
- Each version exposes `createPolar`, `createPolarCore`, `errors`, `models`, `webhooks`, and `services/*` subpaths.

## Tokens and scopes

Organization Access Tokens (OAT) are the recommended server credential, tied to one organization. Create under Settings → Developers → New Token with a name, expiry, and scopes. OAuth 2.0 (partner apps) and personal access tokens exist but span organizations. Polar participates in GitHub secret scanning and auto-revokes leaked tokens.

Rules for agents and humans:

- Never paste a live token, webhook secret, or `.env` contents into chat, issues, logs, or commits. Name the env var (`POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`) and have the user set it.
- Never ship an OAT in a browser, mobile, or extension bundle. The browser only receives a checkout URL, a customer-portal URL, or a short-lived customer session token.
- Sandbox and production tokens are separate. A production token does not work in sandbox and the reverse.
- Use one token per service/purpose with an expiry; rotate on staff change or suspected leak.

Common least-privilege scope sets (names from the 2026-10 OpenAPI):

| Task | Scopes |
|---|---|
| Create checkouts | `checkouts:write` (read: `checkouts:read`) |
| Customer portal session | `customer_sessions:write` |
| Customer State / lookup | `customers:read` |
| Create/update customers | `customers:write` |
| Subscriptions read / change / revoke | `subscriptions:read` / `subscriptions:write` |
| Usage events | `events:write` (list: `events:read`) |
| Customer meter balances | `customer_meters:read` |
| Benefit grants / license keys | `benefits:read`, `license_keys:read`/`license_keys:write` |
| Seats | `customer_seats:read` / `customer_seats:write`; members: `members:read`/`members:write` |
| Orders / invoices | `orders:read` |
| Refunds | `refunds:write` (read: `refunds:read`) |
| Webhook endpoint management | `webhooks:read` / `webhooks:write` |
| Catalog admin | `products:*`, `benefits:*`, `discounts:*`, `meters:*`, `checkout_links:*`, `custom_fields:*` |
| Better Auth organization sync | `customers:read`, `customers:write`, `members:read`, `members:write` |

Other scopes exist (`organizations:*`, `metrics:*`, `files:*`, `payments:read`, `disputes:*`, `payouts:*`, `transactions:*`, `wallets:*`, notifications, `organization_access_tokens:*`, OIDC scopes). Give a runtime token only what its code path calls; keep dashboard/catalog admin tokens out of the app server.

## Sandbox vs production

- Sandbox is a fully separate environment with its own accounts, organizations, products, tokens, webhook endpoints, and customers: dashboard `sandbox.polar.sh`, API `https://sandbox-api.polar.sh`. Production API: `https://api.polar.sh`.
- Pass `environment: "sandbox"` to the SDK. Products, benefits, and IDs do not carry over; recreate the catalog in production and store IDs per environment.
- Test card: `4242 4242 4242 4242`, future expiry, any CVC (Stripe test numbers). Customer emails in sandbox go only to organization members (plus-aliases are fine).
- Sandbox webhook source IPs differ slightly from production; see [webhooks.md](webhooks.md).
- Do not test production with real cards (looks like card testing and triggers account review). Use a free product or a 100% discount code.
- Polar MCP servers: `https://mcp.polar.sh/mcp/polar-sandbox` and `.../polar-mcp` (production), OAuth-based. Prefer sandbox for agent work.

## Call conventions, pagination, errors

- Services are camelCase properties (`polar.checkouts`, `polar.customerSessions`, `polar.customerSeats`, `polar.benefitGrants`, `polar.customerMeters`, `polar.customerPortal.*`), methods are camelCase (`getStateExternal`, `iterList`). Request, query, and response fields are `snake_case`.
- Path params positional, then an optional query object, or a single body object: `polar.subscriptions.update(id, { cancel_at_period_end: true })`.
- Responses are plain typed objects; UUIDs and date-times stay strings.
- Lists: `list(query)` returns a page with `items` and `pagination` (`page`, `limit`). `for await (const x of polar.customers.iterList({ sorting: ["email"] }))` yields single resources and fetches pages lazily (one request per page). Do not `await` the generator first.
- Errors, all from `@polar-sh/sdk`: `PolarError` (base), `PolarNetworkError`, `PolarServerError` (`statusCode`), `PolarClientError` (`statusCode`, `error`), `PolarRateLimitError` (429, `retryAfter`). Endpoint-specific errors live in the version's `errors` namespace; catch those first. There is no built-in `retryConfig`: apply bounded exponential backoff with jitter for 5xx/network on safe or deduplicated calls, and honor `retryAfter` on 429. Do not blindly retry 4xx.
- No general idempotency-key header exists for mutations. Make retries safe with application-level reconcile (look up by `external_id` / `external_customer_id` before re-creating), and always reuse the same event `external_id` for usage events.

## Tree-shaken core client

```ts
import { createPolarCore } from "@polar-sh/sdk/2026-10";
import { getStateExternalCustomers } from "@polar-sh/sdk/2026-10/services/customers";

const core = createPolarCore({ accessToken, environment: "sandbox" });
const state = await getStateExternalCustomers(core)("usr_123");
```

The Better Auth plugin and the framework adapters take a core client or build their own; the core client has no `customers`/`events` properties. Service function names follow `<operation><Service>` (for example `ingestEvents` from `.../services/events`). Check the installed `dist/2026-10/services/*.d.mts` types instead of guessing.
