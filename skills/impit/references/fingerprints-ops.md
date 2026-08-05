# Fingerprints and Operations

## What Impit impersonates

1. **TLS** — patched `rustls` reproduces browser-like ClientHello (ciphers, extensions).
2. **HTTP** — header order, HTTP/2 SETTINGS / pseudo-header sequences, browser-matching multipart boundaries.

It does **not** execute page JavaScript or render DOM. For those needs, use a real browser automation stack.

## Node `Browser` values

From `impit` Typedoc / `index.d.ts` (refresh when upgrading):

- Generic: `chrome`, `firefox`, `okhttp`
- Chrome versions: `chrome100`, `chrome101`, `chrome104`, `chrome107`, `chrome110`, `chrome116`, `chrome124`, `chrome125`, `chrome131`, `chrome136`, `chrome142`
- Firefox versions: `firefox128`, `firefox133`, `firefox135`, `firefox144`
- OkHttp versions: `okhttp3`, `okhttp4`, `okhttp5`
- Other: `ios18`

Generic `chrome` / `firefox` pick an appropriate bundled version automatically. Prefer a **versioned** id when detectors flag stale generic fingerprints.

```ts
new Impit({ browser: 'chrome' });
new Impit({ browser: 'chrome131' });
new Impit({ browser: 'firefox144' });
```

## Proxies vs HTTP/3

| Feature | Constraint |
| --- | --- |
| `proxyUrl` / `proxy` | HTTP, HTTPS, SOCKS4, SOCKS5 |
| `http3: true` | Do **not** combine with proxies (unsupported) |

If both are needed operationally, use separate clients or disable HTTP/3 for proxied traffic.

HTTP/3 DNS discovery uses system resolvers in recent releases; failures can fall back so hosts are treated as non-h3 unless Alt-Svc says otherwise.

## Redirects

- Instance: `followRedirects` (default true), `maxRedirects` (default 10)
- Per request (JS): `redirect: 'follow' | 'manual' | 'error'`

Use `manual` when the caller must inspect `Location` (login flows, OAuth).

## Cookies and sessions

| Binding | Default | Enable persistence |
| --- | --- | --- |
| Node | Stateless | `cookieJar` (tough-cookie or compatible) |
| Python | Stateless unless passed | `cookie_jar` / `cookies` |
| Rust | Stateless unless passed | `with_cookie_store(Jar)` |

Redirects and cookies are handled in the JS layer for Node (avoids high-concurrency native segfaults in older designs).

## Local address binding

`localAddress` / `local_address` binds the outbound socket to a specific IPv4/IPv6 interface — useful for multi-homed hosts and tests.

## Crawlee integration

Impit powers `@crawlee/impit-client` `ImpitHttpClient` and is positioned as the successor to `got-scraping` (TLS + HTTP/3, native package, ARM Windows/macOS).

```ts
import { CheerioCrawler } from 'crawlee';
import { ImpitHttpClient, Browser } from '@crawlee/impit-client';

const crawler = new CheerioCrawler({
  httpClient: new ImpitHttpClient({
    browser: Browser.Chrome,
    http3: true,
  }),
  async requestHandler({ $ }) {
    console.log($('title').text());
  },
});

await crawler.run(['https://example.com']);
```

Pass `ImpitHttpClient` via crawler `httpClient`. Fingerprint strings like `'chrome131'` work the same idea as raw Impit.

When the project already uses Crawlee, prefer `@crawlee/impit-client` over wiring raw `impit` inside request handlers unless you need fetch-level control.

## Comparison snapshot (from Crawlee docs)

| | got-scraping | curl-impersonate | Impit |
| --- | --- | --- | --- |
| TLS fingerprinting | No | Yes | Yes |
| HTTP/3 | No | Yes | Yes |
| Native Node package | Yes | No (child process) | Yes |
| Windows/macOS ARM | Yes | No | Yes |

## Operational checklist

- [ ] Chosen fingerprint matches the intended client class (desktop Chrome vs Firefox vs OkHttp vs iOS)
- [ ] Proxy XOR HTTP/3 decided explicitly
- [ ] Cookie jar only if session continuity is required
- [ ] Instance-level auth/default headers set once; per-request overrides for one-offs
- [ ] Timeouts set at instance and/or request level
- [ ] `ignoreTlsErrors` / `verify=False` limited to controlled environments
- [ ] Rate limiting / retries / politeness handled by the caller (Impit is transport, not a crawler)
- [ ] Failure mode tested: TLS rejection, redirect loop, abort signal, proxy auth

## Anti-patterns

- Creating a new `Impit` per request (loses pooling; expensive native setup)
- Enabling HTTP/3 and a proxy on the same client
- Expecting SPA content without a browser
- Hand-editing User-Agent while leaving mismatched TLS/HTTP2 fingerprints inconsistent with the rest of the profile (prefer `browser` + deliberate header overrides)
- Double-reading response bodies
- Assuming Python is a complete httpx substitute without checking unsupported APIs
