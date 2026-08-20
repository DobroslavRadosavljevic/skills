# Custom Patterns

Default `isBot` is the right detector until a product needs to **add** tokens or **remove** pattern parts (Lighthouse, Cypress, in-house preview bots).

Build custom functions at **module scope**, once.

## Add a token

Official recipe: concatenate onto `list`.

```ts
import { createIsBotFromList, list } from "isbot";

export const isBot = createIsBotFromList(list.concat("shmulik"));
```

Escape regex metacharacters in tokens that are not intended as fragments:

```ts
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const isBot = createIsBotFromList(list.concat(escapeRegex("acme.bot")));
```

Alternatively pass a finished `RegExp` to `createIsBot` when the custom rule is a single expression (lookaheads, boundaries) rather than a fragment list.

## Remove Lighthouse (official recipe)

Chrome Lighthouse UAs include `chrome-lighthouse` and match as bots. Product analytics often want Lighthouse counted as a human (or as its own channel), while still treating Googlebot as a bot.

```ts
import { createIsBotFromList, findBotPatterns, list } from "isbot";

const chromeLighthouseUserAgentStrings = [
  "mozilla/5.0 (macintosh; intel mac os x 10_15_7) applewebkit/537.36 (khtml, like gecko) chrome/94.0.4590.2 safari/537.36 chrome-lighthouse",
  "mozilla/5.0 (linux; android 7.0; moto g (4)) applewebkit/537.36 (khtml, like gecko) chrome/94.0.4590.2 mobile safari/537.36 chrome-lighthouse",
];

const patternsToRemove = new Set(
  chromeLighthouseUserAgentStrings.flatMap((ua) => findBotPatterns(ua)),
);

export const isBot = createIsBotFromList(
  list.filter((record) => !patternsToRemove.has(record)),
);
```

### Side effect of fragment removal

`findBotPatterns` returns **shared fragments**, not “Lighthouse-only rules”. Removing `lighthouse` (or any generic token those UAs also hit) drops **every** UA that depended on those fragments.

After filtering:

1. Assert Lighthouse fixtures → `false`.
2. Assert Googlebot / generic crawler fixtures still → `true`.
3. Log `patternsToRemove` in a unit test so pattern-list updates fail loudly.

Keep a **second** detector if Lighthouse must be known but not mixed into “bot traffic”:

```ts
import { isBot as isCrawler } from "isbot";

const isLighthouse = createIsBot(/chrome-lighthouse/i);

export function trafficKind(ua: string | null): "lighthouse" | "bot" | "human" {
  if (isLighthouse(ua)) return "lighthouse";
  if (isCrawler(ua)) return "bot";
  return "human";
}
```

Prefer this split over deleting fragments when the only goal is to special-case one family.

## Cypress, Playwright, and synthetic monitors

These often self-identify and match `isBot === true` (changelog explicitly added Cypress). Decide per product:

| Goal | Approach |
| --- | --- |
| Exclude from business KPIs | Default `isBot` (leave Cypress as bot) |
| Include CI browser tests in “human” funnels | Separate `isCypress` / header (`x-test-run`) — do not strip broad fragments |
| Perf budgets (Lighthouse CI) | Treat as Lighthouse channel, not as Googlebot |

Do not remove `bot` or `http` fragments to “fix” Cypress — that wrecks crawler recall.

## In-house preview / health checks

Prefer an explicit header or UA suffix the org controls (`AcmeHealthCheck/1.0`) and `createIsBotFromList(list.concat("AcmeHealthCheck"))`, rather than matching `kube` / `curl` / `Go-http-client` globally if those also appear in developer traffic.

Kubernetes probes and many monitors are already in the default list (changelog: Kubernetes probe, uptime tools, Prometheus). Default `isBot` is usually enough to skip pixels on probes.

## `createIsBot` vs `createIsBotFromList`

| Need | API |
| --- | --- |
| Full upstream list ± a few fragments | `createIsBotFromList` |
| Tiny allow/deny regex, no upstream list | `createIsBot(/.../i)` |
| Same lookbehind accuracy as default | **Cannot** get that from `createIsBotFromList(list)` — use default `isBot` plus a **pre/post** predicate |

Composition without rebuilding the full list:

```ts
import { isBot as isKnownBot } from "isbot";

const extra = /acme-preview|acme-synth/i;

export function isBot(ua?: string | null): boolean {
  return isKnownBot(ua) || extra.test(ua ?? "");
}
```

Empty/null still false for `isKnownBot`. The extra arm should use the same empty guard if `""` must not match.

## Do not

- Call `createIsBotFromList(list.filter(...))` inside a request handler.
- Mutate exported `list` and expect `isBot` to change.
- Copy `getPattern()` source or `fullPattern` into the app — it churns every patch.
- Use naive `/bot/i` as a custom pattern (Cubot and similar false positives are why lookbehind exists).
