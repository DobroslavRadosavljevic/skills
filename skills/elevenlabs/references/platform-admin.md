# Platform: SDK setup, auth, keys, errors, concurrency, webhooks, residency, workspace, billing

Snapshot 2026-10-03.

## Contents

- [Server SDK setup](#server-sdk-setup)
- [Return types and files](#return-types-and-files)
- [Auth and API keys](#auth-and-api-keys)
- [Client-side auth (no API key in the browser)](#client-side-auth-no-api-key-in-the-browser)
- [Data residency and regions](#data-residency-and-regions)
- [Errors](#errors)
- [Concurrency and rate limits](#concurrency-and-rate-limits)
- [Webhooks](#webhooks)
- [Zero retention, privacy, IP allowlisting](#zero-retention-privacy-ip-allowlisting)
- [User, usage, models](#user-usage-models)
- [Workspace administration](#workspace-administration)
- [Billing](#billing)

## Server SDK setup

```bash
bun add @elevenlabs/elevenlabs-js
```

`@elevenlabs/elevenlabs-js` 2.70.x (Node ≥18; also Bun, Deno, edge runtimes via `fetch`). CommonJS build without an `exports` map in v2. **Never install the unscoped `elevenlabs` npm package** (frozen at 1.59, deprecated). v3.0.0-alpha exists on the `alpha` tag (renames `conversationalAi` → `agents`, removes deprecated methods) — do not adopt unless asked; avoid deprecated v2 methods so migration is mechanical.

```ts
import { ElevenLabsClient, ElevenLabsEnvironment } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,   // default env var; constructor THROWS if missing
  environment: ElevenLabsEnvironment.Production, // or baseUrl
  timeoutInSeconds: 240,                    // default 240 (README's 60 is stale)
  maxRetries: 2,                            // retries 408/429/5xx with backoff, honors Retry-After
});

// per-request options (second argument of every method)
await elevenlabs.voices.search({ search: "narrator" }, { timeoutInSeconds: 30, maxRetries: 0, abortSignal });

// headers / raw response on any call
const { data, rawResponse } = await elevenlabs.textToSpeech.convert(voiceId, req).withRawResponse();
rawResponse.headers.get("request-id"); // also character-cost, x-region, current-/maximum-concurrent-requests
```

Request fields are camelCase in TS; the SDK sends snake_case. Python: `from elevenlabs import ElevenLabs, AsyncElevenLabs` (snake_case methods, `save`, `play`, `stream` helpers). No auto-pagination helpers: loop on `hasMore` + `nextCursor`/`nextPageToken`.

Find any method: [api-endpoints.md](api-endpoints.md) or `python3 scripts/openapi_lookup.py <words> [--full]`. If a method is missing from SDK typings, call REST with `fetch` and the `xi-api-key` header.

## Return types and files

- Audio endpoints return `ReadableStream<Uint8Array>` (web stream). Node file: `Readable.fromWeb(stream).pipe(createWriteStream(path))`; Buffer: `Buffer.from(await new Response(stream).arrayBuffer())`; HTTP: `new Response(stream, { headers: { "Content-Type": "audio/mpeg" } })`.
- `*WithTimestamps` stream methods return async iterables of JSON chunks.
- Upload fields (`file`, `audio`, `files`) accept `fs.createReadStream`, `Blob`, `File`, `Buffer`, `Uint8Array`, web `ReadableStream`, or `{ path }` / `{ data, filename, contentType }`.
- `play()` (ffplay) and `stream()` (mpv) are Node-only local helpers.

## Auth and API keys

Header `xi-api-key: <key>`. Dashboard → Developers → API Keys.

- **User keys**: tied to a person (Full Seat), may expire (15 min–30 days).
- **Service-account keys**: for production backends; no expiry; one service account per environment. `client.serviceAccounts.create`, `client.serviceAccounts.apiKeys.create(id, { name, permissions, characterLimit?, allowedIps? })` → returns the key once.
- Restrictions on any key: permission scopes (e.g. `text_to_speech`, `speech_to_text`, `voices_read`, `voices_write`, `convai_read`, `convai_write`, `music_generation`, `image_video_generation`, `dubbing_write`, `webhooks_write`, or `all`), monthly credit quota, IP allowlist (1–100 CIDRs). New keys are **restricted by default** — "401/403 on voices" usually means a missing scope.
- Leaked keys found by GitHub secret scanning are auto-disabled (`disable_reason: exposed_publicly`). Self-disable: `client.workspaces.apiKeys.disable({ apiKeyName: "self" })`.
- Rotate: create new key with the same permissions → deploy → delete old.

## Client-side auth (no API key in the browser)

| Client need | Server mints | Lifetime |
| --- | --- | --- |
| Realtime STT | `client.tokens.singleUse.create("realtime_scribe")` | 15 min, one use |
| Batch STT from browser | `client.tokens.singleUse.create("batch_scribe")` | 15 min, one use |
| TTS WebSocket | `client.tokens.singleUse.create("tts_websocket")` | 15 min, one use |
| Agent / Speech Engine voice (WebRTC) | `client.conversationalAi.conversations.getWebrtcToken({ agentId })` | per session |
| Agent (WebSocket) | `client.conversationalAi.conversations.getSignedUrl({ agentId })` | 15 min to start |
| Plain TTS/HTTP | Proxy through your backend route | — |

Authenticate your user and rate-limit before minting. A "422 cors" error usually means the browser is calling the API directly.

## Data residency and regions

| `ElevenLabsEnvironment` | Base URL |
| --- | --- |
| `Production` (default) | `https://api.elevenlabs.io` — global routing to US / Netherlands / Singapore (`x-region` header) |
| `ProductionUs` | `https://api.us.elevenlabs.io` — always US |
| `ProductionEu` | `https://api.eu.residency.elevenlabs.io` |
| `ProductionIndia` | `https://api.in.residency.elevenlabs.io` |
| `ProductionSingapore` | `https://api.sg.residency.elevenlabs.io` |

WebSockets use the same hosts with `wss://`. Residency (Enterprise) workspaces are **separate accounts with separate API keys**; mixing a key and host from different environments fails auth. Dubbing is not available in isolated environments; LLM availability varies by region. Agents client: see [agents-clients.md](agents-clients.md#transport-rules). Python: `ElevenLabsEnvironment.PRODUCTION_EU` etc. The Vercel AI SDK provider has no base URL option.

## Errors

Current body:

```json
{ "detail": { "type": "validation_error", "code": "invalid_parameters", "message": "…", "param": "keyterms", "request_id": "…", "status": "invalid_parameters" } }
```

Read `detail.code` first, fall back to legacy `detail.status`. FastAPI validation errors still arrive as 422 with `detail: [{ loc, msg, type }]`.

| HTTP / type | Common codes | Action |
| --- | --- | --- |
| 400 `validation_error` / `invalid_request` | `text_too_long`, `invalid_voice_settings`, `unsupported_model`, `invalid_output_format`, `audio_too_long`, `malformed_json` | Fix the request; check model limits |
| 401 `authentication_error` | `invalid_api_key`, `missing_api_key` | Check key, env, residency host |
| 402 `payment_required` | `insufficient_credits` (legacy `quota_exceeded`), `paid_plan_required` | Top up / upgrade |
| 403 `authorization_error` | `insufficient_permissions`, `feature_not_available`, `voice_access_denied`, `model_access_denied` | Key scopes, plan, model approval |
| 404 `not_found` | `voice_not_found`, `agent_not_found`, `model_not_found`, … | IDs, workspace, environment |
| 409 `conflict` | `already_running`, `concurrent_modification` | Retry after state settles |
| 422 | schema validation; music `bad_prompt` / `bad_composition_plan` with suggestions | Fix fields; use suggestion |
| 429 `rate_limit_error` | `rate_limit_exceeded`, `concurrent_limit_exceeded` (legacy `too_many_concurrent_requests`), `system_busy` | Backoff + jitter; semaphore for concurrency |
| 5xx | `internal_error`, `service_unavailable`, `maintenance` | Retry; report `request_id` to support |

```ts
import { ElevenLabs, ElevenLabsError, ElevenLabsTimeoutError } from "@elevenlabs/elevenlabs-js";

try {
  await elevenlabs.textToSpeech.convert(voiceId, { text, modelId: "eleven_v4" });
} catch (err) {
  if (err instanceof ElevenLabsTimeoutError) { /* retry later */ }
  else if (err instanceof ElevenLabsError) {
    const d = (err.body as any)?.detail;
    console.error(err.statusCode, d?.code ?? d?.status, d?.message, err.requestId);
  } else throw err;
}
// typed subclasses: ElevenLabs.BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError,
// ConflictError, UnprocessableEntityError, TooEarlyError
```

## Concurrency and rate limits

| Plan | Multilingual v2 / v3 / v4 | Flash / Turbo | STT | Realtime STT | Music | TTD WS sessions |
| --- | --- | --- | --- | --- | --- | --- |
| Free | 2 | 4 | 8 | 6 | 0 | 14 |
| Starter | 3 | 6 | 12 | 9 | 2 | 21 |
| Creator | 5 | 10 | 20 | 15 | 2 | 35 |
| Pro | 10 | 20 | 40 | 30 | 2 | 70 |
| Scale / Business | 15 (pricing page: Business 25) | 30 | 60 | 45 | 5 | 105 |
| Enterprise | elevated | elevated | elevated | elevated | highest | elevated |

Dubbing: 3 concurrent jobs on self-serve plans. Over the limit, requests queue briefly then 429. Read `maximum-concurrent-requests` and size a client-side semaphore (e.g. `p-limit`) to it. TTS WebSockets count only while generating; TTD WebSockets hold a session for their lifetime.

## Webhooks

Workspace webhooks are shared by products (agents post-call, STT, dubbing, Flows, voice-library notices).

- CRUD: `client.webhooks.create({ settings: { authType: "hmac", name, webhookUrl } })` → `{ webhookId, webhookSecret }` (secret shown once), `.list`, `.update(id, { isDisabled, name, retryEnabled?, events? })`, `.delete`.
- Payload: `{ type, event_timestamp, data }`. Types include `post_call_transcription`, `post_call_audio`, `call_initiation_failure`, `speech_to_text_transcription`, `flows_generation`, `flows_template_run`, dubbing project/language events, `voice_removal_notice`, `voice_removed`.
- Header `ElevenLabs-Signature: t=<unix>,v0=<hex HMAC-SHA256(secret, "<t>.<rawBody>")>`; reject if older than 30 min.
- Retries are opt-in (`retryEnabled`) and documented for `post_call_transcription` (5 attempts over ~40 min on 5xx/429/408). Webhooks auto-disable after ≥10 consecutive failures with no success in 7 days.
- Return 200 fast, process async, dedupe (events may repeat).

```ts
// Next.js route — verify on the RAW body
export async function POST(req: Request) {
  const raw = await req.text();
  let event;
  try {
    event = await elevenlabs.webhooks.constructEvent(raw, req.headers.get("elevenlabs-signature")!, process.env.ELEVENLABS_WEBHOOK_SECRET!);
  } catch {
    return new Response("invalid signature", { status: 401 });
  }
  queue.enqueue(event);            // idempotent processing elsewhere
  return new Response("ok");
}
// Express: app.post("/hooks/elevenlabs", express.text({ type: "*/*" }), handler)
```

Manual verification (no SDK, e.g. edge runtime without `crypto`): split header on `,`, read `t` and `v0`, check age ≤1800 s, compute `HMAC_SHA256(secret, t + "." + raw)` hex, constant-time compare with `v0`. `new ElevenLabsClient()` throws without an API key, so webhook-only services either set the key or verify manually.

## Zero retention, privacy, IP allowlisting

- Zero Retention Mode (Enterprise): `enableLogging: false` on TTS (HTTP + WS), TTD, STS, STT. Disables history and request stitching. Not available for Music, Image & Video, cloning samples, Dubbing, Studio. Agents have a per-agent toggle.
- HIPAA: Enterprise BAA required before sending PHI (Scribe v2 Medical, agents).
- ElevenLabs egress IPs (allowlist for webhooks, agent tools, MCP, Speech Engine, SIP): US `34.67.146.145`, `34.59.11.47`; EU `35.204.38.71`, `34.147.113.54`; Asia `35.185.187.110`, `35.247.157.189`; residency EU `34.77.234.246`, `34.140.184.144`; India `34.93.26.174`, `34.93.252.69`; Singapore `34.87.23.17`, `34.126.179.103`. Combine with signature verification.

## User, usage, models

- `client.user.get()`, `client.user.subscription.get()` → `tier`, `characterCount` / `characterLimit` (credits), `nextCharacterCountResetUnix`, voice slot counters, `canUseInstantVoiceCloning`, `canUseProfessionalVoiceCloning`, `status`.
- `client.models.list()` → model capabilities, languages, `maximumTextLengthPerRequest`, `tokenCostFactor`, `concurrencyGroup`.
- Usage analytics: `client.workspace.usage.getUsageByProductOverTime({ startTime, endTime, intervalSeconds, groupBy: ["product_type", "model"], timeZone })` (ms timestamps; tabular `{ columns, rows }`). `client.usage.get` (`/v1/usage/character-stats`) is deprecated.
- Request log: `client.workspace.analytics.requests.get({ startTime, limit })`.

## Workspace administration

- Members/invites: `workspace.members.list/update`, `workspace.invites.create/createBatch/delete` (bulk needs a verified domain).
- Groups: `workspace.groups.list/search`, `workspace.groups.members.add/remove`. Disable a feature for most users by removing it from the Everyone group.
- Sharing: `workspace.resources.share(resourceId, { role: "admin"|"editor"|"commenter"|"viewer", resourceType, userEmail? | groupId? | workspaceApiKeyId? })`, `.unshare`, `.get`. Resources created by service accounts are visible only to admins until shared.
- Audit logs (Enterprise): `workspace.auditLogs.list({ limit, cursor })` (OCSF format, 30 req/min).
- Auth connections (OAuth2/JWT/mTLS/basic/bearer credentials for agent tools): `workspace.authConnections.*`.
- Agent environment variables: `client.environmentVariables.list/create/get/update` (top-level in SDK 2.70; docs show `conversationalAi.environmentVariables`).
- Seats: Full vs Basic (Basic: agents + API uncapped from shared pool, ElevenCreative capped). Multi-seat on Scale+. Billing groups set per-group credit quotas. Enterprise: SSO (SAML/OIDC, SP-initiated), SCIM 2.0, domain verification, model approvals (image/video models off by default), consolidated billing.

## Billing

- Self-serve plans (monthly): Free $0 / 10k credits, Starter $6 / 30k, Creator $22 / 121k, Pro $99 / 600k, Scale $299 / 1.8M, Business $990 / 6M; Enterprise custom. Annual = 10× monthly.
- **API usage is billed in USD**, not credits — see [models-pricing.md](models-pricing.md#api-prices-usd).
- Pay-as-you-go top-ups replace overage for new self-serve customers: plan credits first, then balance; $0 balance pauses service immediately; top-up credits expire after 12 months; auto top-up available. Legacy plans and Enterprise keep usage-based overage.
- Credits roll over up to 2 months while subscribed. Free web regenerations do not apply to API calls.
- Out of credits → 402 `insufficient_credits`.
