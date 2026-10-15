# ipaddr.js API

Snapshot: ipaddr.js 2.5.0. Source: package README, `lib/ipaddr.js`, `lib/ipaddr.d.ts`.

## Top level

| Function | Notes |
| :-- | :-- |
| `isValid(s)` | IPv4 or IPv6; never throws |
| `isValidCIDR(s)` | Needs `/prefix`; never throws |
| `parse(s)` | `IPv4 \| IPv6`; throws |
| `parseCIDR(s)` | `[IPv4 \| IPv6, number]`; throws; keeps host bits |
| `process(s)` | Like `parse`, but IPv4-mapped IPv6 becomes IPv4 |
| `subnetMatch(addr, rangeList, default = 'unicast')` | First matching name; skips other family |
| `fromByteArray(bytes)` | 4 bytes → IPv4, 16 bytes → IPv6; else throws |

`RangeList<T> = { [name: string]: [T, number] | [T, number][] }`.

## IPv4

Static: `isValid`, `isValidCIDR`, `isValidFourPartDecimal`, `isValidCIDRFourPartDecimal`, `isIPv4` (regex shape only, no range check), `parse`, `parseCIDR`, `broadcastAddressFromCIDR`, `networkAddressFromCIDR`, `subnetMaskFromPrefixLength`, `new IPv4(octets)`.

Instance: `octets`, `kind()` → `'ipv4'`, `match(addr, bits)` / `match([addr, bits])`, `range()`, `subnetMatch(list, default?)`, `prefixLengthFromSubnetMask()` (`null` if not contiguous), `toByteArray()`, `toIPv4MappedAddress()`, `toNormalizedString()`, `toString()`.

## IPv6

Static: `isValid` (zone IDs allowed), `isValidCIDR`, `isIPv6` (regex shape only), `parse`, `parseCIDR`, `broadcastAddressFromCIDR` (last address), `networkAddressFromCIDR`, `subnetMaskFromPrefixLength`, `new IPv6(parts)`.

Instance: `parts` (8 × 16-bit), `zoneId?`, `kind()` → `'ipv6'`, `isIPv4MappedAddress()`, `toIPv4Address()` (throws unless mapped), `match`, `range()`, `subnetMatch`, `prefixLengthFromSubnetMask()`, `toByteArray()`, `toRFC5952String()` (= `toString()`), `toNormalizedString()` (no `::`, no leading zeros), `toFixedLengthString()` (every group 4 digits).

## `range()` names

IPv4:

| Name | CIDR |
| :-- | :-- |
| `unspecified` | 0.0.0.0/8 |
| `broadcast` | 255.255.255.255/32 |
| `multicast` | 224.0.0.0/4 |
| `linkLocal` | 169.254.0.0/16 |
| `loopback` | 127.0.0.0/8 |
| `carrierGradeNat` | 100.64.0.0/10 |
| `private` | 10/8, 172.16/12, 192.168/16 |
| `reserved` | 192.0.0/24, 192.0.2/24, 192.88.99/24, 198.18/15, 198.51.100/24, 203.0.113/24, 240/4 |
| `as112`, `amt` | AS112 and AMT anycast |
| `unicast` | Anything else |

IPv6: `unspecified` (::/128), `loopback` (::1/128), `linkLocal` (fe80::/10), `multicast` (ff00::/8), `uniqueLocal` (fc00::/7), `ipv4Mapped` (::ffff:0:0/96), `rfc6145`, `rfc6052` (64:ff9b::/96, 64:ff9b:1::/48), `6to4` (2002::/16), `teredo` (2001::/32), `benchmarking`, `amt`, `as112v6`, `orchid2`, `droneRemoteIdProtocolEntityTags`, `deprecatedSiteLocal` (fec0::/10), `discard` (100::/64), `deprecatedOrchid`, `reserved` (includes 2001:db8::/32), `unicast`.

Order matters: the first matching name wins.

## TypeScript

- Types ship in `lib/ipaddr.d.ts` as `export =`. Use `import ipaddr from 'ipaddr.js'` with `esModuleInterop`, or `import ipaddr = require('ipaddr.js')`.
- Narrow with `addr.kind() === 'ipv4'`; `IPv4` and `IPv6` are classes, so `instanceof ipaddr.IPv4` also works.
- `IPv6Range` in the types omits `deprecatedSiteLocal`, `discard`, and `deprecatedOrchid`, and `toFixedLengthString` is not typed. Widen to `string` in exhaustive switches.
