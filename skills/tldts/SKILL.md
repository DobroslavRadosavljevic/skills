---
name: tldts
description: "Build, review, debug, or plan URL and hostname parsing with tldts v7 (tldts, tldts-icann, tldts-experimental, tldts-core) and the bundled Public Suffix List. Use for parse, getHostname, getDomain, getFullDomain, getSubdomain, getPublicSuffix, getDomainWithoutSuffix, registrable domain / eTLD+1, same-site checks, cookie domain scope, ICANN vs private suffixes (github.io, s3.amazonaws.com), allowPrivateDomains, validHosts for localhost, detectSpecialUse (.test, .local, .onion), detectIp, extractHostname, mixedInputs, IDN/punycode hosts, email domains, the tldts CLI, and migrations from tld.js, psl, or parse-domain."
---

# tldts

Use this skill for **tldts v7** hostname and domain extraction backed by the Public Suffix List (PSL). Snapshot **7.4.18** (2026-10). MIT license. Ships ESM, CJS, UMD, and types.

## Workflow

1. Inspect the local surface:
   - Package: `tldts` (ICANN + private PSL sections), `tldts-icann` (ICANN section only, smaller), or `tldts-experimental` (packed hash lookup, same API).
   - Version: prefer **7.x**. `getFullDomain` and `detectSpecialUse` / `isSpecialUse` are recent 7.x additions; check the installed version before using them.
   - Input shape: full URLs, bare hostnames, emails, or a mix. This drives the options.
2. Pick the narrowest function. Single-purpose getters are faster than `parse` and do not allocate a result object.
3. Decide the PSL section **on purpose**. `allowPrivateDomains` defaults to `false`, so `a.b.github.io` gives domain `github.io`. For cookie scope, same-site, or tenant isolation on shared hosts, set `allowPrivateDomains: true`.
4. Route detail:
   - Full API, result fields, options, CLI, package variants: [api-options.md](references/api-options.md)
   - Verified edge cases, security traps, migrations: [pitfalls.md](references/pitfalls.md)
5. Prefer `bun` / `bunx` in command examples. Match the project's import style (`import { getDomain } from 'tldts'` or `require`).

## Quick Reference

```ts
import { parse, getDomain, getHostname, getSubdomain, getPublicSuffix, getFullDomain } from 'tldts';

getDomain('https://user:pw@www.example.co.uk:8080/p?q#h'); // 'example.co.uk'
getSubdomain('moar.foo.google.co.uk');                       // 'moar.foo'
getPublicSuffix('google.co.uk');                             // 'co.uk'
getDomain('a.b.github.io', { allowPrivateDomains: true });   // 'b.github.io'
getDomain('vhost.localhost', { validHosts: ['localhost'] }); // 'localhost'
parse('http://printer.local/', { detectSpecialUse: true }).isSpecialUse; // true
```

## Core Judgment

- **Every result field can be `null`.** IPs give `isIp: true` and `domain: null`. A bare suffix (`co.uk`), `localhost`, or an invalid host gives `domain: null`. Handle `null` at every call site.
- **Unknown TLDs still parse.** `foo.unknowntld` gives domain `foo.unknowntld` with `isIcann: false, isPrivate: false`. To reject unknown suffixes, check `isIcann || isPrivate` from `parse`.
- **Private section is off by default.** Shared hosting (`github.io`, `vercel.app`, `s3.amazonaws.com`, `pages.dev`) collapses to the platform domain unless `allowPrivateDomains: true`. Security decisions about "same owner" need the private section.
- **`extractHostname: false` trusts the input fully.** Pass only clean hostnames then; a URL gives garbage (`'example.com/'`).
- **Use `validHosts` for dev hosts** (`localhost`, internal zones), not string hacks.
- **No IDNA conversion.** Unicode and punycode inputs come back in the form you passed. Normalize with `new URL()` or `domainToASCII` before comparing.
- **The PSL ships in the bundle.** There is no runtime update. Keep `tldts` current (Renovate / `bun update tldts`) to get new suffixes.
- **Not a URL parser.** tldts reads only the host. Use WHATWG `URL` for scheme, path, query, and port. Where host extraction differs from `URL` on hostile input, trust `URL` for security checks.

## Verification

- `bun pm ls tldts tldts-icann tldts-experimental tldts-core`: confirm one variant is in use.
- Tests: multi-label suffix (`co.uk`), private suffix on and off, IPv4 and bracketed IPv6, `localhost` with and without `validHosts`, unknown TLD, uppercase and trailing dot, email input, `null` paths.
- CLI smoke: `bunx tldts 'https://www.example.co.uk/x'`.

Report which checks ran and which PSL section the code relies on.
