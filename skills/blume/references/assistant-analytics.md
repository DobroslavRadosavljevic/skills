# Blume: Assistant, Rate Limiting, Narration, Analytics, Consent

Scope: configure the in-page assistant (`ai.assistant`), rate limiting (`rateLimit`), narration (`narration`), analytics adapters (`analytics`), and cookie consent (`consent`) in `blume.config.ts`. Targets `blume` 2.2.2.

## Contents

- [Assistant](#assistant): [options](#assistant-options), [grounding and tools](#grounding-and-tools), [retrieval size](#retrieval-size), [server output](#server-output-requirement), [adapters](#model-adapters-blumeai), [shared adapter options](#options-every-adapter-takes), [reasoning](#reasoning), [external endpoint](#external-endpoint), [cors](#cross-origin-callers-cors), [Ask / open assistant](#ask-about-code-and-opening-the-assistant), [captcha](#bot-protection-blumecaptcha), [events](#assistant-analytics-events)
- [Rate limiting](#rate-limiting)
- [Narration](#narration)
- [Analytics](#analytics)
- [Cookie consent](#cookie-consent)
- [Env var cheat sheet](#env-var-cheat-sheet)
- [Gotchas](#gotchas)

## Assistant

An in-page chat panel backed by a streaming server endpoint (`POST /api/ask`) built on the AI SDK. Opt-in. Static docs stay static until enabled. Enabling it also turns on React for the in-page island.

```ts
// blume.config.ts
export default defineConfig({
  ai: { assistant: { enabled: true } },
});
```

- Default: answers stream through the Vercel AI Gateway from `openai/gpt-5.5` (same as `provider: gateway({ model: "openai/gpt-5.5" })`), key env var `AI_GATEWAY_API_KEY`.

### Assistant options

| Option | Value | Notes |
| --- | --- | --- |
| `enabled` | `boolean` | Turns the assistant on. |
| `provider` | adapter from `blume/ai` | Default `gateway(...)`. Ignored when `endpoint` is set. |
| `suggestions` | `{ label: string; icon?: string }[]` | Starter prompts. `label` is the question sent. `icon` is a Lucide icon name. Unset or empty gives a plain input. |
| `support` | `"mailto:…"`, URL, or site path | Shows a **Contact support** link once a conversation exists. |
| `instructions` | `string` | Appended to the built-in system prompt. Never replaces it. |
| `tools` | `boolean` | `search_docs` and `read_page` tools. Default on, except off for OpenAI-compatible endpoints (`openai()` with `baseUrl`). |
| `retrieval` | `{ maxResults, excerptChars, contextBudget }` | See [Retrieval size](#retrieval-size). |
| `endpoint` | URL | Use your own backend. Blume generates UI only. |
| `cors` | `string[]` | Origins allowed to call the generated route. `"*"` allows any. |
| `captcha` | `turnstile()` or `hcaptcha()` | Bot check. |

```ts
ai: {
  assistant: {
    enabled: true,
    suggestions: [{ label: "What is Blume?", icon: "rocket" }],
    support: "mailto:help@example.com", // or "https://example.com/support", or "/support"
    instructions: "You are Bloomy, the Acme docs assistant. Keep answers under three paragraphs.",
  },
}
```

- `support` as `mailto:` opens an email with the conversation as body (long ones keep the latest turns). A URL or site path gets the conversation id as a `thread` query param. The `ask`, `ask_answer`, `ask_error` events carry the same `thread`.
- `instructions` is appended because the built-in part carries the grounding contract (answer only from retrieved pages, cite as Markdown links) that chat citations depend on.

### Grounding and tools

- Each question retrieves the most relevant pages from the same lexical Orama index as on-page search and injects them into the system prompt. The assistant answers only from them, says when something is not covered, and cites pages.
- The current page is injected first and scopes retrieval to its language, and on versioned sites its docs version. A question from outside the docs (landing page) uses the language of the URL locale prefix (`/ja`), or the default language.
- Retrieval runs at request time from a snapshot baked into the build. It works with any `search` provider, even `search: false`. No config needed.
- Grounding is on for every adapter except `inkeep()`, which runs its own retrieval over content indexed in its dashboard.
- Tools `search_docs` (search) and `read_page` (read a whole page) run server-side on the same snapshot, keep to the reader's language and version, and never reach the reader.
- Each question takes at most five model steps: up to four tool rounds, then the answer. `tools: false` answers from retrieved pages only. `tools: true` enables tools for an OpenAI-compatible endpoint whose model supports tool calling:

```ts
provider: openai({ baseUrl, model, apiKeyEnv }),
tools: true,
```

### Retrieval size

```ts
ai: { assistant: { enabled: true, retrieval: { maxResults: 3, excerptChars: 1200, contextBudget: 3000 } } }
```

| Option | Default | Description |
| --- | --- | --- |
| `maxResults` | `6` | Documents retrieved per question. |
| `excerptChars` | `2000` | Characters kept from each retrieved page. |
| `contextBudget` | `10000` | Total injected characters across all excerpts. |

- The current page is injected on top, so answers can cite one page more than `maxResults`.
- Lower values cut time-to-first-token on self-hosted models. Raise `excerptChars` when one page holds the whole answer and gets cut off.
- Size the model context window for the whole prompt: conversation adds up to 24,000 characters, and with `tools` on one `read_page` result adds up to 20,000 (about 5,000 tokens). Ollama defaults to a 4k-token window on smaller GPUs and silently drops the start of an overlong prompt (instructions and excerpts).
- Does not apply to `inkeep()`.

### Server output requirement

The built-in backend is a server route. It cannot run on a static build. Name a host adapter from `blume/deploy`:

```ts
import { vercel } from "blume/deploy";

export default defineConfig({ deployment: vercel() });
```

- A static build with the assistant enabled and no external `endpoint` fails fast with a message to set a host adapter.
- Other `blume/deploy` adapters in these docs: `node()`, `cloudflare()` (Netlify is also a supported host).
- The route reads request bodies up to 64 KB (larger gets `413`). It validates 1 to 40 messages with only `user` and `assistant` roles, so callers cannot inject a system prompt.

### Model adapters (`blume/ai`)

An adapter returns a plain descriptor Blume inlines into the generated route. Each adapter owns its model, key env var, reasoning mapping, and SDK.

```ts
import { defineConfig } from "blume";
import { anthropic } from "blume/ai";

export default defineConfig({
  ai: { assistant: { enabled: true, provider: anthropic({ model: "claude-sonnet-5" }) } },
});
```

| Adapter | Answers with | API key env var | SDK to install |
| --- | --- | --- | --- |
| `openai()` | OpenAI model, or any OpenAI-compatible endpoint | `OPENAI_API_KEY` | `@ai-sdk/openai` (`@ai-sdk/openai-compatible` with a `baseUrl`) |
| `anthropic()` | Claude model | `ANTHROPIC_API_KEY` | `@ai-sdk/anthropic` |
| `gemini()` | Gemini model | `GEMINI_API_KEY` | `@ai-sdk/google` |
| `grok()` | xAI Grok model | `XAI_API_KEY` | `@ai-sdk/xai` |
| `gateway()` (default) | `provider/model` string via Vercel AI Gateway | `AI_GATEWAY_API_KEY` | none (ships with Blume) |
| `openrouter()` | any OpenRouter model | `OPENROUTER_API_KEY` | `@openrouter/ai-sdk-provider` |
| `llmgateway()` | any LLMGateway model | `LLMGATEWAY_API_KEY` | `@ai-sdk/openai-compatible` |
| `inkeep()` | Inkeep QA model | `INKEEP_API_KEY` | `@ai-sdk/openai-compatible` |

SDKs are optional peer dependencies. Install the one you need:

```sh
bun add @ai-sdk/anthropic
```

If missing, `blume build` stops before Vite runs and names the package and install command. `bunx blume doctor` reports it too.

```ts
openai({ model: "gpt-5.5" });
anthropic({ model: "claude-sonnet-5" });
gemini({ model: "gemini-3.5-flash" }); // key from Google AI Studio
grok({ model: "grok-4.7" });
gateway({ model: "anthropic/claude-sonnet-4-5" }); // OIDC token also works on Vercel
openrouter({ model: "anthropic/claude-sonnet-4-5", reasoning: "none" });
llmgateway({ model: "openai/gpt-5.5" }); // baseUrl overrides https://api.llmgateway.io/v1
inkeep({ model: "inkeep-qa-expert" }); // baseUrl overrides https://api.inkeep.com/v1
```

- `openai()`, `anthropic()`, `gemini()`, `grok()` call the provider API directly with your key.
- Adapters take the NAME of the env var holding the key. No secret is written to a route. The route reads it through Astro `getSecret()`: environment variables on Node, Vercel, Netlify, and Worker bindings on Cloudflare.
- Nothing reads `blume.config.ts` at request time. The ejected route inlines the descriptor as literals.

OpenAI-compatible endpoint (self-hosted model, internal gateway):

```ts
openai({
  baseUrl: "https://my-gateway.example.com/v1",
  apiKeyEnv: "MY_GATEWAY_API_KEY", // defaults to OPENAI_API_KEY
  model: "gpt-4o",
  name: "my-gateway", // default "openai-compatible"
});
```

- `name` is the provider name the AI SDK reports and the key the endpoint reads `providerOptions` under.
- With `baseUrl`, the route uses Chat Completions via `@ai-sdk/openai-compatible`. Install that instead of `@ai-sdk/openai`.
- `openaiCompatible()` from earlier versions still works (same as `openai()` with `baseUrl`).
- `inkeep()` is ungrounded and has no `reasoning` option. Setting one is a config error.

### Options every adapter takes

| Option | Description |
| --- | --- |
| `model` | Model id. |
| `reasoning` | `"none"`, `"minimal"`, `"low"`, `"medium"`, `"high"`, `"xhigh"`. Not on `inkeep()`. |
| `apiKeyEnv` | Env var name for the key. Overrides the default. The missing-secret warning at `blume dev`/`build` checks it. |
| `headers` | Static request headers on every call. Inlined into the route as-is, so no secrets. The key's `Authorization` header is applied first and cannot be displaced. |
| `providerOptions` | Passed verbatim to AI SDK `providerOptions`. Must be JSON and keyed by the provider the SDK expects. |

```ts
gateway({ apiKeyEnv: "DOCS_GATEWAY_KEY" });
openai({ baseUrl: "https://llm.internal.example.com/v1", apiKeyEnv: "INTERNAL_LLM_API_KEY", model: "gpt-4o", headers: { "X-Caller-Id": "docs" } });
gateway({ model: "openai/gpt-5.5", providerOptions: { openai: { textVerbosity: "low" } } });
```

`providerOptions` keys: `openai` (for `openai()` or an OpenAI model behind the gateway), `anthropic`, `google` (for `gemini()`), `xai` (for `grok()`), `openrouter`, and the adapter's `name` for an OpenAI-compatible endpoint.

Until the key env var is set, the deployed route answers `503` naming the variable.

### Reasoning

Leave `reasoning` unset to keep the model default. Lower levels cut time-to-first-token. The model must support the level (OpenAI rejects unsupported ones; `"none"` and `"xhigh"` exist only on some).

```ts
provider: gateway({ model: "openai/gpt-5.5", reasoning: "none" }),
```

| Adapter | What the level becomes |
| --- | --- |
| `openai()` | OpenAI `reasoning_effort`. With a `baseUrl` it is sent as `reasoning_effort` in the request, so the endpoint must accept it. |
| `anthropic()` | Effort level on adaptive-thinking models, thinking budget on older ones, thinking off for `"none"`. |
| `gemini()` | Thinking level, or thinking budget on models that take one. |
| `grok()` | xAI reasoning effort, on models that offer one. |
| `gateway()` | AI SDK `reasoning` call option, mapped by the gateway to the model's own setting. |
| `openrouter()` | OpenRouter `reasoning.effort`, set on the model. |
| `llmgateway()` | `reasoning_effort` in the request via the AI SDK call option. |
| `inkeep()` | Not available. |

### External endpoint

Point the panel at your own backend. The docs build stays static.

```ts
ai: { assistant: { enabled: true, endpoint: "https://api.example.com/v1/docs/ask" } }
```

Blume sends the same `POST` body as the built-in route:

```json
{
  "messages": [{ "role": "user", "content": "How do I deploy?" }],
  "page": { "path": "/deployment" }
}
```

- `messages` ends with the new question. The built-in route accepts at most 40 messages and 24,000 characters as JSON. The panel sends the latest turns that fit.
- Return a successful response whose body is a plain UTF-8 text stream.
- Cross-origin backend: accept `OPTIONS` and `POST`, permit the `content-type` request header, return CORS headers on preflight and streamed response.
- No server route, grounding snapshot, provider dependency, or secret warning is generated. Your backend owns retrieval, auth, rate limiting, model access, citations. An adapter set alongside is ignored.
- With a captcha configured, the panel sends the token as `captcha` in the request body.

### Cross-origin callers (`cors`)

Let another site call the generated route:

```ts
ai: { assistant: { enabled: true, cors: ["https://www.example.com"] } } // or ["*"]
```

- The route answers `OPTIONS` preflight and names a listed origin on every response, error statuses included. Responses expose `Retry-After` so callers can read the wait after a `429`.
- Entries are reduced to origin (`https://www.example.com/docs/` equals `https://www.example.com`). Unlisted origins get no header.
- The caller must send JSON with `content-type: application/json`:

```ts
await fetch("https://docs.example.com/api/ask", {
  body: JSON.stringify({ messages: [{ role: "user", content: "How do I deploy?" }] }),
  headers: { "content-type": "application/json" },
  method: "POST",
});
```

- Astro rejects a cross-origin `POST` with no content type or a form-like one (`text/plain`) with a 403 before the route runs. That response has no CORS headers, so browsers report a network error.
- `cors` affects only the generated route. With an external `endpoint`, CORS is your backend's job, and setting both is a config error.
- The endpoint stays unauthenticated. Rate limit cross-origin traffic too.

### Ask about code and opening the assistant

- With the assistant on, every code block gets an **Ask** button beside copy. It opens the assistant with the block attached as a chip above the input. Sent without a question, it asks the assistant to explain the code. The code goes to the model as a fenced block after the question, up to 6,000 characters.
- A custom chat UI built on `useAssistant` (from `blume/hooks`) can listen for `blume:open-assistant` on `window`. `detail.code` holds the block's `language`, `source`, and `title`.

```ts
window.addEventListener("blume:open-assistant", (event) => {
  const { language, source, title } = (event as CustomEvent).detail.code;
});
```

### Bot protection (`blume/captcha`)

Rate limiting counts by IP, so a script spread over many addresses slips past. A bot check gets a token in the panel before each question, and the route verifies it with the provider before the model runs. Readers rarely see a challenge.

```ts
import { defineConfig } from "blume";
import { turnstile } from "blume/captcha";

export default defineConfig({
  ai: { assistant: { enabled: true, captcha: turnstile({ siteKey: "0x4AAAAAAA…" }) } },
});
```

| Adapter | Provider | Secret key env var |
| --- | --- | --- |
| `turnstile()` | Cloudflare Turnstile | `TURNSTILE_SECRET_KEY` |
| `hcaptcha()` | hCaptcha, run invisibly | `HCAPTCHA_SECRET_KEY` |

- `siteKey` goes to the browser and is safe to commit. The secret stays on the server.
- Turnstile: create a widget in the Cloudflare dashboard, choose **Managed** or **Invisible**.
- Until the secret is set, the assistant answers that it is not configured and `blume build` warns.
- The provider script loads with the first question, not the page.
- A failed check shows a translated "we couldn't check that you're human" notice. The route answers `403`.
- Test keys that always pass: Turnstile site key `1x00000000000000000000BB`, secret `1x0000000000000000000000000000000AA`. hCaptcha site key `10000000-ffff-ffff-ffff-000000000001`, secret `0x0000000000000000000000000000000000000000`.

### Assistant analytics events

Sent through the same `track()` as the feedback widget.

| Event | When | Properties |
| --- | --- | --- |
| `ask` | Question sent | `path`, `questionChars`, `thread` |
| `ask_answer` | Answer finishes streaming | `path`, `questionChars`, `thread`, `ms`, `chars` |
| `ask_error` | Request fails, breaks, or returns empty | `path`, `questionChars`, `thread`, `ms`, `status` |

- `path` is the served pathname (matches pageviews under a `base`). `thread` is the conversation id (new when the reader clears the conversation).
- `status` is the HTTP status. `0` means no response arrived (offline, DNS, CORS). `200` means the response was fine but the stream broke mid-answer (how provider or credential errors surface) or delivered nothing.
- Clearing the conversation mid-answer reports neither outcome.
- Question text never goes to a provider. It travels only on the `blume:track` DOM event as `detail.props.question`.
- A custom UI built on `useAssistant` reports the same events. With no analytics provider, provider calls are no-ops but `blume:track` still fires.

## Rate limiting

Covers three server routes: the assistant, the API playground proxy, and Mixedbread server-side search. Readers are identified by IP. Each route keeps its own count.

- On by default: 30 requests per reader per route every 10 minutes.
- Over the limit: `429 Too Many Requests` with `Retry-After`. The assistant tells the reader to try again in a few minutes.
- Only matters for server builds. Static sites have no routes to limit.
- Search queries fire each time the reader pauses typing, so steady searching can hit the limit. With Mixedbread search, raise `requests` (applies to every route).

Shared options: `requests`, `window` (seconds), shown on `memory()`, `upstash()`, and `cloudflare()`. Example: `rateLimit: upstash({ requests: 30, window: 600 })`.

| Adapter | Count kept in | Limit holds |
| --- | --- | --- |
| `memory()` (default) | Server memory | Exact on one server. Per instance on serverless hosts. |
| `upstash()` | Upstash Redis | Exact on every host. |
| `cloudflare()` | Cloudflare Workers rate limiting | Per Cloudflare location. |
| `unkey()` | Unkey | Every host. Regions catch up within moments. |

```ts
import { cloudflare as cloudflareRateLimit, memory, unkey, upstash } from "blume/ratelimit"; // alias: `cloudflare` clashes with blume/deploy

rateLimit: memory({ requests: 60, window: 600 }),
rateLimit: upstash(),
rateLimit: upstash({ urlEnv: "KV_REST_API_URL", tokenEnv: "KV_REST_API_TOKEN" }),
rateLimit: cloudflareRateLimit({ requests: 10, window: 60 }), // with deployment: cloudflare()
rateLimit: unkey({ namespace: "acme-docs", rootKeyEnv: "DOCS_UNKEY_ROOT_KEY" }),
rateLimit: false, // off
```

- `memory()`: needs nothing. Exact with `deployment: node()` (one process). On Vercel, Netlify, Cloudflare it only stops bursts from one reader per instance.
- `upstash()`: env `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Vercel Marketplace databases set `KV_REST_API_URL` and `KV_REST_API_TOKEN` (with any prefix you chose). Name them via `urlEnv` and `tokenEnv`. Uses the REST API, nothing to install. Until both are set, routes count in memory and `blume build` warns.
- `cloudflare()`: for `deployment: cloudflare()` (from `blume/deploy`). Blume declares the binding in the Worker config at build. Window must be 10 or 60 seconds. Defaults: 10 requests per 60 seconds. Namespace comes from the Worker name. Set `namespaceId` to choose it.
- `unkey()`: env `UNKEY_ROOT_KEY` (rename with `rootKeyEnv`). Namespace defaults to `docs` (`namespace` overrides). Root key needs `ratelimit.*.limit` and `ratelimit.*.create_namespace`. Uses the REST API, nothing to install. Until the key is set, routes count in memory and `blume build` warns. A key Unkey refuses makes every count fail. If the server logs `Rate limiting failed`, check the key. Short bursts split across regions can exceed the limit slightly.
- `rateLimit: false` lets every request through. A request with an unknown address, or one a shared store fails to count, is always let through (failure is logged), so a store outage never locks readers out.

### Behind a reverse proxy

Vercel, Netlify, and Cloudflare tell Blume each reader's address. A `node()` server behind nginx or Caddy sees every request from the proxy, so all readers share one count. List the proxy host in `allowedDomains`:

```ts
import { node } from "blume/deploy";

deployment: node({
  site: "https://docs.example.com",
  allowedDomains: [{ hostname: "docs.example.com" }],
}),
```

- This is Astro `security.allowedDomains`. For a matching `Host` or `X-Forwarded-Host`, Astro takes the address from the first entry of `X-Forwarded-For`.
- The proxy must pass the site host through and replace any reader-sent `X-Forwarded-For` (nginx: `proxy_set_header X-Forwarded-For $remote_addr;`). A proxy that appends lets readers pick their own address and get a fresh count each request.
- Leave `allowedDomains` unset when readers reach the server directly.

## Narration

A **Listen to this page** player under each page description. It reads the page aloud from the title down, highlights the current sentence, and keeps it in view. Opt-in.

```ts
export default defineConfig({ narration: true }); // browser voices
```

- `true`: Web Speech API with the reader's device voices. No key, no build step, works on any host (static or not). The player stays hidden on a browser with no voice for the page language. Quality varies by device.
- `{ provider }`: neural voices generated at build time.

**What it reads:** title, description, headings, paragraphs, list items, card text, in order. Spoken cues: callouts ("Note.", "Tip.", "Warning."), steps ("Step 1."), tabs ("macOS tab.", every tab is read), accordions and expandable ("Expandable section."). It opens closed sections and hidden tabs as it reaches them. It skips code blocks, tables, images, video, diagrams, math, type tables, file trees, and live component previews. The player appears only on pages with roughly 50 words of prose or more.

**Player:** pinned under the header with play/pause, previous/next sentence, progress slider, time, speed 0.8x to 2x (remembered). Scrolling away stops following. Scrolling back or **Follow along** resumes. Opening another page stops narration.

### Generated voices

```ts
import { defineConfig } from "blume";
import { gateway } from "blume/ai";

export default defineConfig({
  narration: { provider: gateway({ model: "openai/tts-1-hd", voice: "alloy" }) },
});
```

- The provider is an assistant adapter pointed at a speech model: `gateway()` or `openai()`.
- `blume build` splits each page into sentences and generates one clip per sentence. Clips and a per-page manifest are static files under `/blume-narration/`. Nothing runs on a server.
- The build logs the cost first, for example `Generating narration: 214 new clip(s), 15,880 characters, with openai/tts-1-hd`.

`gateway()` narration options:

| Option | Default | Description |
| --- | --- | --- |
| `model` | `openai/tts-1-hd` | Gateway speech model: `openai/tts-1`, `openai/tts-1-hd`, `fish-audio/s2.1-pro`, `spacexai/grok-tts`, others the gateway lists. |
| `voice` | `alloy` | Model voice. |
| `instructions` | none | How the voice should sound, for models that take instructions. |
| `apiKeyEnv` | `AI_GATEWAY_API_KEY` | Env var with the key. On Vercel the build OIDC token also works. |
| `headers` | none | Static headers on every request. |
| `providerOptions` | none | Passed as-is to AI SDK `generateSpeech`. |

`openai()` narration (OpenAI speech API, or any server with `POST /audio/speech`, such as Kokoro-FastAPI, Speaches, or a LiteLLM proxy):

```ts
import { openai } from "blume/ai";

narration: {
  provider: openai({ baseUrl: "http://localhost:8880/v1", model: "kokoro", voice: "af_heart" }),
},
```

| Option | Default | Description |
| --- | --- | --- |
| `model` | none, required | Speech model: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` on OpenAI, or the id your server serves. |
| `baseUrl` | none | OpenAI-compatible base URL including `/v1`. Without it, clips come from OpenAI, or from the server `OPENAI_BASE_URL` names when set. |
| `voice` | `alloy` | Model voice. |
| `instructions` | none | Voice style, for models that take instructions (`gpt-4o-mini-tts`). |
| `apiKeyEnv` | `OPENAI_API_KEY` without a `baseUrl` | Env var with the key, sent as bearer token. With a `baseUrl`, only a key named here is sent. Name none and requests go without a bearer token (an `Authorization` in `headers` is still sent). |
| `headers` | none | Static headers on every request. |
| `providerOptions` | none | Passed as-is to `generateSpeech`. OpenAI reads `speed`: `{ openai: { speed: 1.1 } }`. |

- Install `@ai-sdk/openai` (`bun add @ai-sdk/openai`) with or without a `baseUrl`. If missing, `blume build` stops before Vite runs and names the package.
- Keyed server such as LiteLLM: `openai({ baseUrl, apiKeyEnv: "LITELLM_API_KEY", model })`.
- A non-MP3 response (proxy sign-in page, or WAV from a server that ignores the format) counts as a failed clip and is not cached.
- OpenAI speech takes no language, so `openai()` does not send the page's, and a sentence in several languages is generated once. Many self-hosted servers pick language by voice. Choose a voice for your content language.

**Caching:** `node_modules/.cache/blume/narration`, keyed by sentence, language (for `gateway()`, which sends it), model, voice, instructions, `providerOptions`, and for `openai()` the server it calls. Changing `baseUrl` regenerates every clip. Rebuilds pay only for changed sentences, and a sentence shared across pages is generated once. Vercel and Netlify restore `node_modules` from build caches. On other CI, cache that directory.

**Fallbacks to browser voices:**
- `blume dev` never generates audio. Use `bunx blume build` then `bunx blume preview` to hear generated voices.
- Key not set at build time: warns and generates nothing new. Pages whose clips are all cached still get them. `openai()` with a `baseUrl` and no `apiKeyEnv` sends no key, so it proceeds.
- Generation failure (including an unreachable server): stops at the first failed clip, warns, keeps cached clips.

### Languages, per-page off, skip content

- Each page is read in its content language, so i18n sites use a voice per locale. Cues and labels are translated in all built-in UI languages. Override under `narration` in `i18n.ui`.
- Turn off per page in frontmatter: `narration: false`.
- Exclude an element and its children: `<div data-blume-narration="skip"><PricingCalculator /></div>`.
- Events: `narration_play` (`engine`: `audio` or `browser`, plus `path`) and `narration_complete`. Both go through analytics adapters.

## Analytics

Set `analytics` to a list of adapters from `blume/analytics`: one per provider, plus `script()` for anything else.

```ts
import { defineConfig } from "blume";
import { googleAnalytics, plausible, posthog, vercel } from "blume/analytics";

export default defineConfig({
  analytics: [
    posthog({ key: "phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }),
    vercel(),
    googleAnalytics({ id: "G-XXXXXXXXXX" }),
    plausible({ domain: "docs.example.com" }),
  ],
});
```

- Adapters emit into `<head>` in listed order. Combine as many as you like.
- Adapters are plain data, validated with config and inlined into the build. JSON values only. A function, `undefined`, or bigint fails validation with its path.
- Loads in production builds only (`blume build`, never `blume dev`).
- No `analytics` list, or an empty one, injects nothing.
- Identifiers are public browser-side ones from each provider's install snippet. Safe to commit. Blume never asks for a secret.
- Set `consent` to make every adapter wait for the reader.
- The docs use a client-side router. Every adapter counts in-page navigations as pageviews. Providers that follow history changes need nothing. For PostHog, Segment, Hightouch Blume sends the pageview itself. Tag managers (`googleTagManager()`, `adobe()`) need a history-change trigger or rule.

### Adapter options

"Anything else" means extra options pass through as described. Defaults shown in the Default column.

| Adapter | Option | Default | Description |
| --- | --- | --- | --- |
| `adobe()` | `url` | none | Launch environment embed script URL. Required. |
| `amplitude()` | `key` | none | Project API key. Required. |
| | anything else | `autocapture: true`, `fetchRemoteConfig: true` | Merged into `amplitude.init` options verbatim. |
| `clarity()` | `id` | none | Project ID. Required. |
| `clearbit()` | `key` | none | Publishable API key (`pk_…`). Required. |
| `clics()` | `projectId` | none | Public project ID. Required. |
| | `allowLocalhost` | `false` | Emits `data-allow-localhost`. |
| | `disableOutboundLinks` | `false` | Emits `data-disable-outbound-links`. |
| `cloudflare()` | `token` | none | Web Analytics site token (manual setup). Required. |
| | anything else | none | Forwarded in the beacon `data-cf-beacon` JSON verbatim. |
| `databuddy()` | `clientId` | none | Client ID. Required. |
| | anything else | none | Rendered as a `data-` attribute. |
| `fathom()` | `site` | none | Site ID. Required. |
| | `spa` | `"auto"` | History-change tracking (`data-spa`). |
| | anything else | none | Rendered as a `data-` attribute. |
| `googleAnalytics()` | `id` | none | GA4 measurement ID (`G-…`). Required. |
| | anything else | none | Forwarded on the `gtag('config', …)` call verbatim. |
| `googleTagManager()` | `id` | none | Container ID (`GTM-…`). Required. |
| | `dataLayer` | `dataLayer` | Data layer global name. |
| `heap()` | `id` | none | App ID. Required. |
| | anything else | none | Forwarded as `heap.load` config verbatim. |
| `hightouch()` | `key` | none | Event source write key. Required. |
| | `host` | `us-east-1.hightouch-events.com` | Events API host, no scheme (becomes `apiHost`). |
| | anything else | none | Forwarded as `htevents.load` options verbatim. |
| `hotjar()` | `id` | none | Site ID (`hjid`). Required. |
| | `version` | `6` | Tracking-code version (`hjsv`). Nothing else accepted. |
| `logrocket()` | `id` | none | App ID (`org/app`). Required. |
| | anything else | none | Forwarded to `LogRocket.init` verbatim. |
| `mixpanel()` | `token` | none | Project token. Required. |
| | `region` | `us` | `us`, `eu`, or `in` (becomes `api_host`). |
| | anything else | `track_pageview: "url-with-path-and-query-string"` | Merged into `mixpanel.init` verbatim. |
| `oneDollarStats()` | `hostname` | none | Bare host name events are reported under, on every host. |
| | anything else | none | Rendered as a `data-` attribute (`"hash-routing": "false"` is left off). |
| `pirsch()` | `code` | none | Identification code. Required. |
| | anything else | none | Rendered as a `data-` attribute. |
| `plausible()` | `domain` | none | Site domain in Plausible. Required. |
| | `host` | `https://plausible.io` | Origin of a self-hosted or proxied instance. |
| | anything else | none | Rendered as a `data-` attribute. |
| `posthog()` | `key` | none | Project API key. Required. |
| | `host` | `https://us.i.posthog.com` | Ingestion host (becomes `api_host`). EU Cloud: `https://eu.i.posthog.com`. |
| | anything else | none | Forwarded to `posthog.init` verbatim. |
| `segment()` | `key` | none | Source write key. Required. |
| | `cdn` | `https://cdn.segment.com` | Custom domain proxying Segment CDN. Also used to fetch integrations. |
| | anything else | none | Forwarded as `analytics.load` options verbatim. |
| `vercel()` | `mode`, `debug`, `endpoint`, `scriptSrc`, … | none | Forwarded to the official Astro component as props. No key needed. |
| `script()` | `src` | none | External script URL. Exclusive with `content`. |
| | `content` | none | Inline script body. Exclusive with `src`. |
| | `strategy` | none | `async` or `defer` for an external script. |
| | `attributes` | none | Extra HTML attributes spread onto the tag. |

### Adapter notes

- `posthog()`: Blume sends `$pageview` per client navigation only while PostHog captures page loads alone (neither `capture_pageview` nor `defaults` set). With `capture_pageview: "history_change"` or a `defaults` date (for example `"2025-05-24"`) PostHog captures navigations itself. With `capture_pageview: false` no pageviews are sent.
- `vercel()`: enable Web Analytics in the Vercel dashboard. Collects only on Vercel deployments (`/_vercel/insights` must exist). `beforeSend` is a function and cannot pass through config. Assign `window.webAnalyticsBeforeSend` from a `script()` adapter.
- `cloudflare()`: only for sites Cloudflare does not proxy. On a proxied zone (Worker with custom domain, Pages, orange-cloud zone), enable Web Analytics in the dashboard and leave `cloudflare()` out. Listing both counts every pageview twice. For other hosts, copy `token` from `data-cf-beacon` in the dashboard snippet.
- `googleTagManager()`: renders the `<head>` half only. Fire pageview tags from a **History Change** trigger, not the page-load one. Cookie banners are yours to set up in the container.
- `clics()`: tracks page loads, client navigations, and outbound links by default. Do not add a second pageview hook. For a production build previewed on localhost set `allowLocalhost: true`. Blume custom events do not reach Clics. Use `track()` from `@clicsdev/tracker` in your own code.
- `databuddy()`: name options in kebab-case (`track-web-vitals`, `track-errors`, `track-outgoing-links`, `api-url`). camelCase is ignored. Values are strings (`"true"`/`"false"`). `skip-patterns` and `mask-patterns` take a JSON array string like `'["/admin/*"]'`. Other list values read as empty.
- `oneDollarStats()`: values are strings. `hostname` is a bare host (no `https://`, no path) and makes preview and staging count as that site, so leave it unset unless every build should report under it. `devmode: "true"` plus `hostname` lets a local `blume preview` send events (on `localhost` nothing sends without both, so keep them out of committed config). `url` is the collector endpoint (default `https://collector.onedollarstats.com/events`), not the site URL. `autocollect: "false"` turns off automatic page views. `"hash-routing": "true"` sends a page view on every navigation including `#fragment`-only changes.
- `mixpanel()`: set `region` to match EU or India data residency, or events are dropped.
- `logrocket()`: sanitizers are functions and cannot pass through config. Drop the adapter and call `LogRocket.init` from a `script()` adapter.
- `adobe()`: loads the embed script asynchronously. Add a history-change rule in the property, or call `_satellite.track` from a `script()` adapter.

### Custom scripts

`script()` renders one `<script>` tag. Set exactly one of `src` or `content`.

```ts
analytics: [
  script({
    src: "https://cloud.umami.is/script.js",
    strategy: "defer",
    attributes: { "data-website-id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
  }),
  script({ content: "console.log('analytics ready')" }),
],
```

- A root-relative `src` points at a file in `public/` and gets `deployment.base`. With `base: "/docs"`, `src: "/js/redirects.js"` loads `/docs/js/redirects.js`. A `src` already starting with the base is left as written. Absolute and protocol-relative URLs pass through.

### Custom events and `blume:track`

| Source | Events |
| --- | --- |
| Page feedback | `feedback`, and `feedback_comment` when written feedback is on |
| Search | `search`, `search_select` |
| Assistant | `ask`, `ask_answer`, `ask_error` |
| Narration | `narration_play`, `narration_complete` |

- Sent through every configured adapter with a client API: PostHog, Mixpanel, Heap, Segment, Hightouch, Amplitude, LogRocket, Adobe, Google Analytics, Google Tag Manager (as a `{ event }` push on `window.dataLayer`), Plausible, Databuddy, Fathom, OneDollarStats (each property value as a string), Pirsch, Clarity, Hotjar, Vercel.
- Fathom, Clarity, and Hotjar take only the event name, so they count events without properties.
- Cloudflare and Clearbit have no event API. Clics has no global one for Blume to call.
- Every event also fires as a `blume:track` `CustomEvent` on `window` with `{ event, props }` in `detail`. Forward events anywhere with a `script()` adapter whose `content` adds `window.addEventListener("blume:track", (e) => { const { event, props } = e.detail; })`.
- Assistant question text never goes to a provider, only to `blume:track` as `detail.props.question`.
- Search sends queries as typed unless `search.analytics.queries` is `false`, which sends each query's length instead. Text still reaches `blume:track` either way.

## Cookie consent

Set `consent` to one adapter from `blume/consent` to ask readers before analytics runs.

```ts
import { defineConfig } from "blume";
import { googleAnalytics, posthog } from "blume/analytics";
import { native } from "blume/consent";

export default defineConfig({
  analytics: [
    googleAnalytics({ id: "G-XXXXXXXXXX" }),
    posthog({ key: "phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }),
  ],
  consent: native({ policy: "/privacy" }),
});
```

- With `consent` set, every analytics adapter waits. Tags are in the page but run only after the reader allows analytics, then in listed order.
- A reader who declines never loads them. The page rating and its comment box are hidden too.
- Vercel Web Analytics loads either way but sends nothing until the reader allows analytics.
- Without `consent`, analytics runs as the page loads.

| Adapter | Consent manager | Required |
| --- | --- | --- |
| `native()` | Blume's own banner | none |
| `osano()` | Osano | `customerId`, `configId` |
| `ethyca()` | Ethyca (Fides) | `privacyCenter` |

```ts
import { ethyca, native, osano } from "blume/consent";

consent: native({ policy: "/privacy" }), // policy optional: page route or full URL
consent: osano({ customerId: "AzZdRbSIoEzZU2", configId: "7b9e2f4a-…" }),
consent: ethyca({
  privacyCenter: "https://privacy.example.com",
  propertyId: "FDS-XXXXXX", // optional: Fides property to load
  notice: "analytics", // optional: notice key covering analytics (default "analytics")
}),
```

- `native()`: card at the foot of the page with **Accept** and **Decline** side by side. The answer is stored in the reader's browser and the banner does not return. Text is translated in all built-in languages. Override the `consent` UI strings `message`, `accept`, `decline`, `policy`, `settings` via `i18n.ui`. The banner also works in `blume dev`.
- `osano()`: loads Osano Cookie Consent. Both IDs come from the script URL `https://cmp.osano.com/<customerId>/<configId>/osano.js`. Analytics runs once Osano reports analytics consent and again when it changes. Osano's dashboard compliance mode decides what counts as consent per region.
- `ethyca()`: loads Fides from your privacy center. Analytics runs once the analytics notice is on: opted in, not opted out of, or an acknowledge-only notice.
- Osano and Fides load in production builds only. `blume dev` creates no consent records. Preview with `bunx blume build` and `bunx blume preview`.

### Changing an answer and your own scripts

- With `consent` set, the footer shows a **Cookie settings** link that reopens Blume's banner or the hosted manager's preferences.
- If you replace the footer with your own `Footer` layout slot, give any element `data-blume-consent-open`:

```html
<button data-blume-consent-open type="button">Cookie settings</button>
```

- A reader who allows analytics and later withdraws gets a page reload (the only way to stop running scripts). Analytics stays off after.
- Hold your own script until consent with `type="text/plain"` and `data-blume-consent="analytics"`.
- Listen for answers with the `blume:consent` event on `window` (`detail.analytics`). `window.blumeConsent.analytics` is `null` until the manager answers, then `true` or `false`.

```js
window.addEventListener("blume:consent", (event) => {
  if (event.detail.analytics) {
    // start something that needs consent
  }
});
```

## Env var cheat sheet

| Variable | Used by |
| --- | --- |
| `AI_GATEWAY_API_KEY` | `gateway()` (assistant and narration) |
| `OPENAI_API_KEY` | `openai()` (narration: only without `baseUrl`) |
| `OPENAI_BASE_URL` | `openai()` narration when no `baseUrl` is set |
| `ANTHROPIC_API_KEY` | `anthropic()` |
| `GEMINI_API_KEY` | `gemini()` |
| `XAI_API_KEY` | `grok()` |
| `OPENROUTER_API_KEY` | `openrouter()` |
| `LLMGATEWAY_API_KEY` | `llmgateway()` |
| `INKEEP_API_KEY` | `inkeep()` |
| `TURNSTILE_SECRET_KEY` | `turnstile()` |
| `HCAPTCHA_SECRET_KEY` | `hcaptcha()` |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | `upstash()` (rename with `urlEnv`, `tokenEnv`) |
| `UNKEY_ROOT_KEY` | `unkey()` (rename with `rootKeyEnv`) |

Override any adapter key variable with `apiKeyEnv`. The source docs list no `BLUME_*` error codes for these features.

## Gotchas

- Assistant needs server output. Enabled with no `endpoint` on a static build fails fast. Set a `deployment` host adapter from `blume/deploy`, or an external `endpoint`.
- External `endpoint` skips the route, snapshot, provider dependency, and secret warning, and ignores `provider`. `endpoint` plus `cors` is a config error.
- Provider SDKs are optional peer dependencies (`bun add`). A compatible `baseUrl` needs `@ai-sdk/openai-compatible`, not `@ai-sdk/openai`. Narration `openai()` always needs `@ai-sdk/openai`.
- Status codes: missing key `503`, body over 64 KB `413`, failed captcha `403`, rate limited `429` with `Retry-After`.
- `instructions` is appended, never replacing the grounding prompt. `inkeep()` is ungrounded: `retrieval` has no effect, `reasoning` is a config error.
- OpenAI-compatible endpoints default to `tools` off. `providerOptions` must be JSON and keyed by the underlying provider. `headers` are inlined into the route, so keep secrets in `apiKeyEnv`.
- Small self-hosted context windows silently truncate the start of the prompt (instructions and excerpts).
- Cross-origin `POST` to the assistant needs `content-type: application/json`, or Astro answers 403 without CORS headers (browser shows a network error).
- `memory()` rate limit is per instance on Vercel, Netlify, Cloudflare. Use `upstash()` or `unkey()` for exact limits. Missing store credentials silently fall back to memory (build warns). Store failures let requests through.
- Search can hit the default 30 per 10 minutes. Raise `requests` for Mixedbread search.
- Behind nginx or Caddy with `node()`, all readers share one count unless `allowedDomains` is set and the proxy overwrites `X-Forwarded-For`.
- `cloudflare()` rate limit window must be 10 or 60 seconds. `cloudflare` is exported by `blume/deploy`, `blume/ratelimit`, and `blume/analytics`. Alias on import.
- Rate limiting does not stop multi-IP scripts. Add `captcha`. Without its secret the assistant answers "not configured".
- Generated narration voices exist only after `blume build`. `blume dev`, a keyless build, or a failed build fall back to browser voices. Changing `model`, `voice`, `instructions`, `providerOptions`, or `baseUrl` regenerates clips (cost). Cache `node_modules/.cache/blume/narration` on CI.
- Narration `openai()` with a `baseUrl` sends no key unless `apiKeyEnv` is set.
- Analytics and Osano/Fides load in production builds only. Test with `bunx blume build` and `bunx blume preview`. `native()` consent works in `blume dev`.
- Analytics config must be JSON. Use `script()` for `beforeSend`, LogRocket sanitizers, or other callbacks.
- Do not add `cloudflare()` analytics on a Cloudflare-proxied zone with Web Analytics on (double count). Databuddy options are kebab-case strings. Mixpanel EU/India needs `region`. Tag managers need a history-change trigger. Clics gets no Blume custom events.
- With `consent`, a decline also hides the page rating and comment box. `vercel()` still loads but stays silent until consent. Withdrawing consent reloads the page.
