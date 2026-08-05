# Python and Rust

## Python

Docs: https://apify.github.io/impit/python/

### Install

```sh
pip install impit
# or
conda install conda-forge::impit
```

Prebuilt wheels cover most desktop/server targets. **Linux arm64 + glibc** may lack a PyPI wheel (WIP) — build from source if needed. musl arm64 and other common combos are listed as available in the Python README.

### Usage

Implements a **partial HTTPX-like** interface (`Client` / `AsyncClient`). Not every httpx feature is supported — verify before drop-in replacement of complex httpx apps.

```python
import asyncio
from impit import AsyncClient

async def main():
    client = AsyncClient(http3=True, browser='firefox')
    response = await client.get('https://example.com')
    print(response.status_code)
    print(response.text)
    print(response.http_version)

asyncio.run(main())
```

### Constructor options (Client / AsyncClient)

Shared parameters (from stubs):

| Param | Role |
| --- | --- |
| `browser` | Impersonation profile |
| `http3` | Enable HTTP/3 |
| `proxy` | HTTP/HTTPS/SOCKS URL |
| `timeout` | Default timeout |
| `verify` | TLS verification (map to ignore-errors mindset carefully) |
| `follow_redirects` / `max_redirects` | Redirect policy |
| `cookie_jar` / `cookies` | Persist cookies across requests |
| `headers` | Client-wide defaults |
| `local_address` | Bind source address |
| `default_encoding` | Response decoding default |

Reuse one client for session semantics (pool + cookies + defaults).

Per-request: `headers`, `timeout`, `force_http3`, body via `content`/`data` as supported.

Top-level helpers (e.g. `impit.get(...)`) exist for one-shot calls; prefer a client for repeated work.

### Header / cookie behavior

- Client-wide headers override impersonation defaults; per-request headers override client-wide.
- `Cookies({...})` or `cookie_jar` enable session cookies; empty string can clear cookie values in tested paths.

## Rust

Core library: thin ergonomic layer over `reqwest` + patched `rustls` / related crates for browser-like TLS and HTTP behavior. Supports HTTP/1.1, HTTP/2, HTTP/3.

### Cargo requirements

```toml
[dependencies]
impit = { git = "https://github.com/apify/impit.git", branch = "master" }

[patch.crates-io]
rustls = { git = "https://github.com/apify/rustls.git" }
h2 = { git = "https://github.com/apify/h2.git" }
```

Build with:

```text
rustflags = "--cfg reqwest_unstable"
```

Without patched crates and `reqwest_unstable`, the project will not build (needed for HTTP/3 and impersonation patches).

### Builder example

```rust
use impit::cookie::Jar;
use impit::{impit::Impit, fingerprint::database as fingerprints};
use std::time::Duration;

#[tokio::main]
async fn main() {
    let impit = Impit::<Jar>::builder()
        .with_fingerprint(fingerprints::firefox_144::fingerprint())
        .with_http3()
        .with_proxy("http://localhost:8080".to_string())
        .with_default_timeout(Duration::from_secs(60))
        .build()
        .unwrap();

    let response = impit
        .get(String::from("https://example.com"), None, None)
        .await;

    match response {
        Ok(response) => println!("{}", response.text().await.unwrap()),
        Err(e) => println!("{e:#?}"),
    }
}
```

### Cookies (Rust)

```rust
use impit::cookie::Jar;

let jar = Jar::default();
let impit = Impit::<Jar>::builder()
    .with_fingerprint(fingerprints::firefox_144::fingerprint())
    .with_cookie_store(jar)
    .build()?;
```

Without a cookie store, the client is stateless regarding cookies.

### HTTP/3 (Rust)

Enable with `.with_http3()`. Negotiation uses HTTPS DNS / Alt-Svc; force per request via `RequestOptions { http3_prior_knowledge: true, ..Default::default() }`. On HTTP/3 DNS failure, behavior falls back toward HTTP/2 when appropriate.

### Fingerprints (Rust modules)

Import from `impit::fingerprint::database`, e.g.:

- Chrome: `chrome_100` … `chrome_142` (see fingerprints docs for full list)
- Firefox: `firefox_128`, `firefox_133`, `firefox_135`, `firefox_144`
- OkHttp: `okhttp3`, `okhttp4`, `okhttp5`

Always confirm module names against the installed crate — the database grows over time.
