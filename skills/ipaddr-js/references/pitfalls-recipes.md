# ipaddr.js Pitfalls and Recipes

Behavior below was checked against ipaddr.js 2.5.0.

## Verified edge cases

| Call | Result |
| :-- | :-- |
| `isValid('1')` | `true` (inet_aton: `0.0.0.1`) |
| `isValid('127.1')` | `true` (`127.0.0.1`) |
| `parse('0x7f.1').toString()` | `'127.0.0.1'` |
| `parse('010.1.1.1').toString()` | `'8.1.1.1'` (leading zero = octal) |
| `IPv4.isValidFourPartDecimal('010.1.1.1')` | `false` |
| `isValid('192.168.1.1 ')` | `false` (no trimming) |
| `isValid('[::1]')` | `false` (no brackets) |
| `isValidCIDR('10.0.0.0')` | `false` (prefix required) |
| `parse('::ffff:127.0.0.1').range()` | `'ipv4Mapped'` |
| `process('::ffff:127.0.0.1').range()` | `'loopback'` |
| `parse('::ffff:1.2.3.4').toString()` | `'::ffff:102:304'` |
| `parse('1.2.3.4').match(parseCIDR('::/0'))` | throws: cannot match ipv4 with non-ipv4 |
| `subnetMatch(parse('::1'), { a: [v4, 8], b: [parse('::1'), 128] })` | `'b'` (other family skipped) |
| `parseCIDR('10.1.2.3/8')[0].toString()` | `'10.1.2.3'` (host bits kept) |
| `parse('fe80::1%eth0').toString()` | `'fe80::1%eth0'` |
| `parse('100.64.0.1').range()` | `'carrierGradeNat'` |
| `IPv6.parse('1.2.3.4')` | throws |

## Recipe: strict parse of untrusted text

```ts
import ipaddr from 'ipaddr.js';

export function parseStrictIp(input: string): ipaddr.IPv4 | ipaddr.IPv6 | null {
  const s = input.trim();
  if (ipaddr.IPv4.isValidFourPartDecimal(s)) return ipaddr.IPv4.parse(s);
  if (ipaddr.IPv6.isValid(s)) return ipaddr.process(s); // unwrap ::ffff:a.b.c.d
  return null;
}
```

## Recipe: SSRF guard

Allow only global unicast. Blocking a short list (`private`, `loopback`) misses `linkLocal` (cloud metadata at 169.254.169.254), `unspecified` (0.0.0.0), `carrierGradeNat`, `uniqueLocal`, NAT64, 6to4, and Teredo.

```ts
export function isPublicAddress(addr: ipaddr.IPv4 | ipaddr.IPv6): boolean {
  const a = addr.kind() === 'ipv6' && (addr as ipaddr.IPv6).isIPv4MappedAddress()
    ? (addr as ipaddr.IPv6).toIPv4Address()
    : addr;
  return a.range() === 'unicast';
}
```

Then:

1. Resolve the hostname (all A and AAAA records).
2. Reject if **any** address fails `isPublicAddress`.
3. Connect to the address you checked (pin it), so a second DNS answer cannot swap in an internal IP.
4. Repeat on every redirect.

## Recipe: CIDR allowlist (trusted proxies, admin IPs)

```ts
const ALLOW = ['10.0.0.0/8', '2001:db8::/32'].map((c) => ipaddr.parseCIDR(c)); // once, at startup

export function isAllowed(raw: string): boolean {
  if (!ipaddr.isValid(raw)) return false;
  const addr = ipaddr.process(raw);
  return ALLOW.some(([net, bits]) => net.kind() === addr.kind() && addr.match(net, bits));
}
```

- Validate config with `isValidCIDR` and fail at startup, not per request.
- For `X-Forwarded-For`, walk the list from the right. Skip hops that match trusted proxies. The first untrusted hop is the client. Never trust the leftmost value.

## Recipe: rate-limit key

One IPv6 user often owns a whole /64. Key IPv6 by its /64 network and IPv4 by the full address:

```ts
export function rateLimitKey(raw: string): string {
  const addr = ipaddr.process(raw);
  return addr.kind() === 'ipv6'
    ? `${ipaddr.IPv6.networkAddressFromCIDR(`${addr.toString()}/64`).toString()}/64`
    : addr.toString();
}
```

## Canonical storage

- Store `toString()` output (dotted decimal or RFC 5952). Do not store raw input: `'2001:0DB8::1'` and `'2001:db8::1'` are the same address.
- Store after `process()`, so dual-stack IPv4 clients do not appear in two forms.
- For a fixed-width sort key, use `toByteArray()` or `toFixedLengthString()`.
