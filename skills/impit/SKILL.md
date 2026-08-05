---
name: impit
description: "Build, review, debug, configure, or plan Apify Impit browser-impersonating HTTP clients with current docs. Use for impit, Impit.fetch, ImpitOptions, TLS/HTTP fingerprinting, Chrome/Firefox/OkHttp/iOS fingerprints, HTTP/3, proxies, cookieJar, tough-cookie, ignoreTlsErrors, Node/Python/Rust bindings, Crawlee ImpitHttpClient, and replacing got-scraping or plain fetch/axios when bot detection blocks non-browser TLS fingerprints."
---

# Impit

Use this skill when work touches [Apify Impit](https://github.com/apify/impit): browser-impersonating HTTP requests via TLS + HTTP fingerprints, without running a real browser.

## Workflow

1. Inspect the local Impit surface before changing code:
   - Language binding: Node `impit` (npm), Python `impit` (PyPI/conda), or Rust crate from git.
   - Package/native binary versions and platform (Node ≥ 20; platform-specific optional deps).
   - Client lifetime: shared `Impit` / `AsyncClient` / `Impit::<Jar>` vs one-shot clients.
   - Fingerprint choice: generic `chrome`/`firefox` vs versioned / `okhttp` / `ios18`.
   - Session needs: cookies, proxies, HTTP/3, redirects, default headers, timeouts.
2. Refresh docs when the user asks for latest fingerprints, option names, or binding differences. Start from [source-map.md](references/source-map.md).
3. For Node/TypeScript install, `ImpitOptions`, `fetch`, responses, and errors, use [nodejs.md](references/nodejs.md).
4. For Python and Rust APIs, patched deps, and builder patterns, use [python-rust.md](references/python-rust.md).
5. For fingerprints, HTTP/3 vs proxy constraints, cookies, headers precedence, multipart boundaries, and Crawlee `ImpitHttpClient`, use [fingerprints-ops.md](references/fingerprints-ops.md).
6. Implement in the existing project style:
   - Prefer `bun` / `bunx` in command examples for Node work.
   - Reuse one client instance per impersonated identity (pool + optional cookie jar).
   - Do not treat Impit as a headless browser — no page JS, DOM, or automation APIs.

## Judgment

- Impit mimics **TLS ClientHello** and **HTTP fingerprints** (headers, HTTP/2 settings, pseudo-headers). Plain `fetch` / `axios` / undici fail TLS JA3-style checks; Impit addresses that layer.
- Prefer Impit when bot detection blocks non-browser clients and a full browser is unnecessary. Prefer a real browser (Playwright/Puppeteer) when the site requires executed JavaScript or interactive flows.
- Default clients are **stateless for cookies** until you pass `cookieJar` (JS), `cookie_jar`/`cookies` (Python), or `with_cookie_store` (Rust).
- **HTTP/3 and proxies are mutually unsupported** in current docs — do not enable both.
- Header precedence (case-insensitive): per-request headers > instance `headers` > browser impersonation defaults. Empty-string values remove an impersonated header.
- Generic `chrome` / `firefox` auto-pick a version; use versioned fingerprints when detection tracks outdated signatures.
- One `Impit` instance = one user-agent identity sharing config, pool, and jar. Create separate instances for distinct identities.
- Response bodies are single-consume (Fetch-compatible). Do not call `text()`/`json()`/`arrayBuffer()` twice.
- Respect site ToS, robots, rate limits, and applicable law. Use impersonation for legitimate integrations, scraping within policy, and testing — not for unauthorized access or abuse.

## Verification

Prefer the repo's existing checks. For meaningful Impit work, include the relevant subset:

- Smoke request to a known endpoint; assert status and body parse once.
- Confirm negotiated protocol when `http3: true` (`response.http_version` in Python; inspect logs/headers where available).
- Proxy path: HTTP/HTTPS/SOCKS without HTTP/3; fail closed if both are configured.
- Cookie round-trip when a jar is configured (set on first response, sent on second).
- Platform install: native optional dependency resolves on the target OS/arch (glibc vs musl on Linux).
- Typecheck Node consumers against `ImpitOptions` / `RequestInit` / error classes.
- Crawlee: crawler runs with `ImpitHttpClient` and expected fingerprint option.
