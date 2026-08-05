# Node.js / TypeScript

Primary binding for this skills repo. Package: `impit` on npm. Docs: https://apify.github.io/impit/js/

## Install

```sh
bun add impit
```

Installing `impit` pulls the matching platform optional dependency (prebuilt native binary). Requires **Node ≥ 20**.

### Platform matrix (prebuilt)

| OS | Arch | libc | Binary |
| --- | --- | --- | --- |
| Linux | x86_64 / arm64 | glibc, musl | yes |
| macOS | x86_64 / arm64 | — | yes |
| Windows | x86_64 / arm64 | — | yes |

## Quick start

```ts
import { Impit } from 'impit';

const impit = new Impit({
  browser: 'chrome', // or 'firefox', versioned ids, 'okhttp', 'ios18', …
  proxyUrl: 'http://localhost:8080',
  ignoreTlsErrors: true,
});

const response = await impit.fetch('https://example.com');

console.log(response.status);
console.log(response.headers);
console.log(await response.text());
```

`impit.fetch` is designed to be API-compatible with the Fetch API `fetch`.

## `ImpitOptions`

| Option | Default | Notes |
| --- | --- | --- |
| `browser` | `undefined` (no emulation) | See `Browser` type |
| `ignoreTlsErrors` | `false` | Invalid / self-signed certs |
| `vanillaFallback` | `false` | Fallback UA if emulation unsupported by target |
| `proxyUrl` | none | HTTP, HTTPS, SOCKS4, SOCKS5. **Not with HTTP/3** |
| `timeout` | — | Default timeout in **ms** |
| `http3` | `false` | QUIC. **Not with proxies** |
| `followRedirects` | `true` | Instance default; override per request with `redirect` |
| `maxRedirects` | `10` | Exceed → error |
| `cookieJar` | none | `tough-cookie`-compatible `{ setCookie, getCookieString }` |
| `headers` | none | Sent on every request; override impersonation headers |
| `localAddress` | OS choice | Bind IPv4/IPv6 source address |

Constructor:

```ts
const impit = new Impit({
  timeout: 5_000,
  browser: 'chrome',
  headers: { Authorization: 'Bearer <token>' },
});
```

One instance = one identity (shared config, connection pool, cookie jar).

## `RequestInit` (per fetch)

| Field | Notes |
| --- | --- |
| `method` | `GET` \| `POST` \| `PUT` \| `DELETE` \| `PATCH` \| `HEAD` \| `OPTIONS` \| `TRACE` |
| `headers` | Override instance + impersonation headers |
| `body` | string, buffers, `Blob`, `File`, `URLSearchParams`, `FormData`, `ReadableStream`, … |
| `timeout` | Per-request ms override |
| `forceHttp3` | Force HTTP/3 for this request when client supports it |
| `signal` | `AbortSignal` |
| `redirect` | `'follow'` \| `'manual'` \| `'error'` (overrides instance follow behavior) |

```ts
const manual = await impit.fetch('https://example.com/login', {
  redirect: 'manual',
});

if (manual.status === 302) {
  console.log(manual.headers.get('location'));
}
```

## Response

`ImpitResponse` mirrors Fetch `Response`: `status`, `statusText`, `headers`, `ok`, `url` (final after redirects), plus `text()`, `json()`, `arrayBuffer()`, streaming helpers.

Body can be consumed **once**.

## Cookies

Default: no jar — cookies are not stored across requests.

```ts
import { CookieJar } from 'tough-cookie';
import { Impit } from 'impit';

const cookieJar = new CookieJar();
const impit = new Impit({ browser: 'firefox', cookieJar });
```

Custom jars need at least `setCookie(cookie, url)` and `getCookieString(url)` (sync or async).

## Errors

Typed hierarchy rooted at `ImpitError`, including among others:

- Timeouts: `TimeoutError`, `ConnectTimeout`, `ReadTimeout`, `WriteTimeout`, `PoolTimeout`
- Network: `ConnectError`, `ReadError`, `WriteError`, `CloseError`
- Proxy: `ProxyError`, `ProxyTunnelError`, `ProxyAuthRequired`
- Request: `TooManyRedirects`, `DecodingError`, `HTTPStatusError`
- Stream: `StreamConsumed`, `ResponseNotRead`, `RequestNotRead`, `StreamClosed`
- Other: `InvalidURL`, `CookieConflict`, `UnsupportedProtocol`

Catch narrowly when recovering; log `instanceof` checks against these classes.

## Headers precedence

1. Per-request `headers`
2. Instance `headers`
3. Browser impersonation defaults

Matching is case-insensitive. Pass `''` to clear an impersonated header.

## FormData / multipart

When body is `FormData`, Impit generates browser-matching multipart boundaries (Chrome WebKit-style, Firefox gecko-style, OkHttp UUID-style, or a generic Impit boundary without fingerprint). Prefer real `FormData` over hand-rolled multipart strings when impersonating.
