# tldts Pitfalls and Migrations

Behavior below was checked against tldts 7.4.18.

## Verified edge cases

| Input | Call | Result |
| :-- | :-- | :-- |
| `'localhost'` | `getDomain` | `null` |
| `'vhost.localhost'`, `{ validHosts: ['localhost'] }` | `getSubdomain` | `'vhost'` |
| `'co.uk'` | `getDomain` | `null` (bare suffix) |
| `'foo.unknowntld'` | `parse` | domain `'foo.unknowntld'`, `isIcann: false`, `isPrivate: false` |
| `'a.b.github.io'` | `getDomain` | `'github.io'` |
| `'a.b.github.io'`, `{ allowPrivateDomains: true }` | `getDomain` | `'b.github.io'` |
| `'WWW.Example.CO.UK.'` | `getDomain` | `'example.co.uk'` (lowercased, dot stripped) |
| `'example.com:8080'` | `getHostname` | `'example.com'` |
| `'//example.com/x'` | `getHostname` | `'example.com'` |
| `'mailto:a@b.com'` | `getHostname` | `'b.com'` |
| `'http://127.0.0.1:3000'` | `parse` | `isIp: true`, `domain: null` |
| `'www.münchen.de'` | `getDomain` | `'münchen.de'` (no punycode conversion) |
| `'www.xn--mnchen-3ya.de'` | `getDomain` | `'xn--mnchen-3ya.de'` |
| `'exa_mple.com'` | `getHostname` | `'exa_mple.com'` (underscores allowed) |
| `'http://exa mple.com'` | `getHostname` | `null` (invalid) |
| `'https://www.example.com/'`, `{ extractHostname: false }` | `getDomain` | `'example.com/'` (garbage: wrong option for URLs) |

## Security traps

- **Private suffixes decide ownership.** `alice.github.io` and `bob.github.io` belong to different people. With the default options both give `github.io`. For same-site, cookie scope, CORS allowlists, or rate-limit keys, use `allowPrivateDomains: true`.
- **Unknown TLD is not "invalid".** Check `isIcann || isPrivate` when only real suffixes are allowed.
- **Do not build an allowlist with `endsWith`.** Compare `getDomain(host, opts) === 'example.com'`, or compare full hostnames.
- **Parse once, compare normalized.** For hostile input (open-redirect, SSRF checks), get the host with WHATWG `new URL(input).hostname` first, then pass it with `{ extractHostname: false }`. This keeps one parser as the source of truth for the host the HTTP client will really contact.
- **IP hosts have no domain.** Branch on `isIp` and hand IPs to an IP library for range checks.

## Migrations

- **tld.js → tldts:** same author line. `tldjs.getDomain` → `getDomain`, `tldjs.tldExists` → check `isIcann || isPrivate` from `parse`. `fromUserSettings({ validHosts })` → pass `{ validHosts }` per call.
- **psl → tldts:** `psl.get(host)` → `getDomain(host)`; `psl.parse(host)` → `parse(host)` (`sld` → `domainWithoutSuffix`, `tld` → `publicSuffix`, `listed` → `isIcann || isPrivate`). psl includes private suffixes by default, so pass `{ allowPrivateDomains: true }` to keep results the same.
- **parse-domain → tldts:** replace `parseDomain(fromUrl(url))` with `parse(url)`. Map `ParseResultType.Listed` to a non-null `domain`, `Ip` to `isIp`, `Reserved` to `detectSpecialUse`.
