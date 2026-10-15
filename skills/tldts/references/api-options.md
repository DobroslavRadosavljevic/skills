# tldts API and Options

Snapshot: tldts 7.4.18. Source: package README and `tldts-core/src` (`options.ts`, `factory.ts`).

## Packages

| Package | Contents | When |
| :-- | :-- | :-- |
| `tldts` | Full PSL (ICANN + private), trie lookup | Default choice |
| `tldts-icann` | ICANN section only | Smaller bundle; never need private suffixes |
| `tldts-experimental` | Full PSL, packed-hash lookup | Same API; try only for measured size/speed needs |
| `tldts-core` | Shared parser, no list | Internal; do not import directly |

All export the same functions. Install: `bun add tldts`.

## Functions

Every function takes `(urlOrHostname: string, options?: Partial<IOptions>)`.

| Function | Returns |
| :-- | :-- |
| `parse` | `IResult` (new object per call) |
| `getHostname` | Lowercased host, no port, no brackets, trailing dot stripped |
| `getDomain` | Registrable domain (eTLD+1), or `null` |
| `getFullDomain` | Whole hostname when a registrable domain exists, else `null` |
| `getSubdomain` | Labels left of the domain (`''` when none), or `null` |
| `getPublicSuffix` | Matched suffix; unknown TLDs return the last label |
| `getDomainWithoutSuffix` | Domain minus suffix (`'google'` for `google.co.uk`) |

Getters reuse one internal result object. Do not hold references between calls; only the returned primitive is safe.

## `IResult`

```ts
interface IResult {
  hostname: string | null;
  isIp: boolean | null;          // IPv4 or IPv6 (brackets stripped)
  subdomain: string | null;
  domain: string | null;
  publicSuffix: string | null;
  domainWithoutSuffix: string | null;
  isIcann: boolean | null;       // suffix came from ICANN section
  isPrivate: boolean | null;     // suffix came from private section
  isSpecialUse: boolean | null;  // null unless detectSpecialUse: true
}
```

For an IP host, only `hostname` and `isIp` are set; the rest stay `null`.

## Options (defaults)

```ts
{
  allowIcannDomains: true,    // use ICANN suffixes
  allowPrivateDomains: false, // use private suffixes (github.io, s3.amazonaws.com, ...)
  extractHostname: true,      // false: input is already a hostname, skip URL parsing
  validateHostname: true,     // false: skip hostname validation
  detectIp: true,             // false: skip IP detection
  detectSpecialUse: false,    // true: fill isSpecialUse (localhost, *.test, *.local, *.onion, home.arpa, ...)
  mixedInputs: true,          // false: inputs are always URLs (faster)
  validHosts: null,           // extra valid "suffixes", e.g. ['localhost', 'corp.internal']
}
```

Performance tuning, safest first:

- Only URLs in: `{ mixedInputs: false }`.
- Only clean hostnames in: `{ extractHostname: false }` (and `validateHostname: false` when already validated).
- No IPs possible: `{ detectIp: false }`.

Hoist the options object to a module constant so it is not rebuilt per call.

## Special-use names

`detectSpecialUse: true` follows the IANA Special-Use Domain Names registry. `isIcann` / `isPrivate` do not mark these: most are not in the PSL, and `onion` / `home.arpa` show up as plain ICANN suffixes.

## CLI

```bash
bunx tldts 'http://www.writethedocs.org/conf/eu/2017/'
```

Prints the `parse` result as JSON.
