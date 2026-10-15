---
name: ipaddr-js
description: "Build, review, debug, or plan IPv4/IPv6 address handling with ipaddr.js v2 (npm package ipaddr.js). Use for ipaddr.parse, isValid, isValidCIDR, parseCIDR, process, IPv4-mapped IPv6 (::ffff:), match, subnetMatch, range() names (private, loopback, linkLocal, uniqueLocal, carrierGradeNat, reserved, multicast, unspecified), CIDR allowlists and blocklists, SSRF guards, trusted proxy / X-Forwarded-For checks, rate-limit keys by /64, network and broadcast addresses, subnet masks, byte arrays, RFC 5952 output, zone IDs, inet_aton hex/octal parsing traps, and TypeScript types."
---

# ipaddr.js

Use this skill for **ipaddr.js v2** IPv4 and IPv6 parsing, validation, CIDR matching, and range classification. Snapshot **2.5.0** (2026-08). MIT license. CommonJS with bundled types; Node.js 10+ and browsers. Express (`proxy-addr`) depends on it.

## Workflow

1. Inspect the local surface: `ipaddr.js` version (2.x; 1.x is for Node < 10), import style, and whether input comes from sockets, headers, or user text.
2. Pick the entry point:
   - Untrusted text, strict: `ipaddr.IPv4.isValidFourPartDecimal(s)` or `ipaddr.IPv6.isValid(s)`, then `ipaddr.parse(s)`.
   - Socket / dual-stack address: `ipaddr.process(s)` to unwrap `::ffff:a.b.c.d` to IPv4.
   - CIDR config: `ipaddr.parseCIDR(s)` once at startup, then `addr.match(range)` or `ipaddr.subnetMatch`.
3. Route detail:
   - Full API, range names, TypeScript notes: [api.md](references/api.md)
   - Verified edge cases, SSRF and proxy recipes: [pitfalls-recipes.md](references/pitfalls-recipes.md)
4. Prefer `bun` / `bunx` in command examples. Import as `import ipaddr from 'ipaddr.js'` (ESM interop with `esModuleInterop`) or `const ipaddr = require('ipaddr.js')`. Match the project.

## Quick Reference

```ts
import ipaddr from 'ipaddr.js';

ipaddr.isValid('2001:db8::1');                       // true, never throws
const addr = ipaddr.process('::ffff:10.1.2.3');      // IPv4 10.1.2.3
addr.range();                                        // 'private'
addr.match(ipaddr.parseCIDR('10.0.0.0/8'));          // true
ipaddr.IPv4.networkAddressFromCIDR('10.1.2.3/8').toString(); // '10.0.0.0'
ipaddr.parse('2001:0db8::0001').toString();          // '2001:db8::1' (RFC 5952)
```

## Core Judgment

- **`parse` / `parseCIDR` / `toIPv4Address` throw.** Guard with `isValid` / `isValidCIDR`, or wrap in try/catch and return a typed error.
- **IPv4 parsing follows `inet_aton`.** `'1'`, `'127.1'`, `'0x7f.1'`, and `'010.1.1.1'` (octal, gives `8.1.1.1`) are all valid. For user input and allowlists, require `IPv4.isValidFourPartDecimal` first.
- **Unwrap IPv4-mapped IPv6 before classifying.** `parse('::ffff:127.0.0.1').range()` is `'ipv4Mapped'`, not `'loopback'`. Use `process()`.
- **`match` throws across families.** An IPv4 address against an IPv6 CIDR throws. Check `addr.kind()` first, or use `subnetMatch`, which skips entries of the other family.
- **`parseCIDR` keeps host bits.** `parseCIDR('10.1.2.3/8')[0]` is `10.1.2.3`. Use `networkAddressFromCIDR` to normalize.
- **Strings are strict.** No brackets (`[::1]`), no ports, no whitespace. Strip them before parsing.
- **`range()` is not "public vs private".** Anything other than `'unicast'` is special-purpose. For SSRF guards, allow only `'unicast'` instead of blocking a hand-picked list.
- **Parsing only; no DNS.** Resolve hostnames yourself, then check every resolved address, and connect to the checked address.

## Verification

- `bun pm ls ipaddr.js`
- Tests: dotted-decimal vs inet_aton forms, IPv4-mapped loopback, mixed-family CIDR lists, zone IDs (`fe80::1%eth0`), invalid input on every `parse` path, `/0` and `/32` / `/128` edges.

Report which checks ran and whether IPv4 input is strict four-part decimal.
