# Source Map

Snapshot date: 2026-10-01.

This reference records the official documentation and package evidence used to create the skill. Refresh sources for latest fingerprints, binding options, or version mismatches.

## Research Snapshot

- Context7 library: `/apify/impit`
- Repository: https://github.com/apify/impit
- Homepage / JS docs: https://apify.github.io/impit/js/
- Python docs: https://apify.github.io/impit/python/
- Versions observed on 2026-10-01:
  - npm `impit`: `0.14.5` (`latest`, released 2026-09-07; engines: `node >= 20`)
  - PyPI `impit`: `0.14.1` (released 2026-09-07)
- Recent release highlights:
  - JS `0.14.4` / Python `0.14.0`: `chrome151` fingerprint (adds ML-DSA codepoints to `signature_algorithms`, so current-Chrome JA4 differs from `chrome142`); streamed request bodies (Node: `ReadableStream`, Node streams, async iterables; Python: sync/async iterables of bytes via `content=`).
  - JS `0.14.5` / Python `0.14.1`: cached Alt-Svc fix and hot-path allocation/copy cuts.
  - Python `0.13.2`: httpx-style `Response.headers` (`Headers` object with `.raw`), `raise_for_status` in stubs, malformed server cookies ignored instead of panicking, `Browser` literal aligned with runtime fingerprints.
- GitHub releases are tagged per binding: `js-<version>` and `py-<version>`.
- Native Node optional packages (matched version): `impit-darwin-arm64`, `impit-darwin-x64`, `impit-linux-{x64,arm64}-{gnu,musl}`, `impit-win32-{x64,arm64}-msvc`
- Ecosystem: Crawlee `@crawlee/impit-client` / `ImpitHttpClient` (successor path to `got-scraping`)

## Refresh Procedure

1. Resolve docs with documentation tooling (`/apify/impit`) before answering "latest" questions.
2. Check registry metadata:

   ```sh
   bun info impit
   ```

   For Python:

   ```sh
   pip index versions impit
   ```

   For release notes:

   ```sh
   gh release list -R apify/impit -L 20
   ```

3. Prefer official Typedoc/Python docs and the monorepo README over third-party summaries.
4. Re-check the `Browser` union in `impit-node/index.d.ts` when fingerprint lists change.
5. If docs and installed types disagree, trust the installed `index.d.ts` / `.pyi` and report the mismatch.

## Official Pages

### Core

- GitHub: https://github.com/apify/impit
- Root README: https://github.com/apify/impit/blob/master/README.md
- Node README: https://github.com/apify/impit/blob/master/impit-node/README.md
- Python README: https://github.com/apify/impit/blob/master/impit-python/README.md
- JS Typedoc: https://apify.github.io/impit/js/
- JS `Impit`: https://apify.github.io/impit/js/classes/Impit.html
- JS `ImpitOptions`: https://apify.github.io/impit/js/interfaces/ImpitOptions.html
- JS `Browser`: https://apify.github.io/impit/js/types/Browser.html
- Python docs: https://apify.github.io/impit/python/
- npm: https://www.npmjs.com/package/impit

### Ecosystem

- Crawlee Impit HTTP client: https://crawlee.dev/js/docs/guides/impit-http-client

### Source files often consulted

- `impit-node/index.d.ts` — Node public types
- `impit-python/python/impit/impit.pyi` — Python stubs
- `impit-python/python/impit/__init__.py` — Python `Browser` literal
- `impit/src/fingerprint/database.rs` — Rust fingerprint module exports
- `_autodocs/` — Rust configuration / fingerprints / quick start (in repo)
