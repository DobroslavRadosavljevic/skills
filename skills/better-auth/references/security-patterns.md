# Security & Patterns

## Must-configure production

1. **`BETTER_AUTH_SECRET`** ≥32 chars (or `secret` option). Rotate with `BETTER_AUTH_SECRETS` / `secrets` when needed.
2. Explicit **`baseURL`** / `BETTER_AUTH_URL` (no ambiguous origin).
3. **`trustedOrigins`**: every web origin, preview URL, and mobile scheme. Support wildcards carefully (`https://*.example.com`). Never leave loose localhost entries in prod.
4. HTTPS → Secure cookies; default `SameSite=Lax`, `httpOnly`.
5. Rate-limit **storage**: memory breaks on multi-instance/serverless — use Redis (`@better-auth/redis-storage`) or database.
6. Keep **`better-auth` and all `@better-auth/*`** patched together (advisories hit scoped packages too).

## CSRF / origin

- Prefer non-simple requests; Origin checks; OAuth state + PKCE.
- `advanced.disableCSRFCheck` / `disableOriginCheck` — dangerous; don’t use to paper over CORS mistakes.
- `account.skipStateCookieCheck` weakens OAuth CSRF — avoid.

## Sessions

| Mode | When |
|---|---|
| Cookie + DB (default) | Most web apps |
| + `cookieCache` | Perf; shorten `maxAge` if revoke must be fast |
| + Redis secondary | Horizontal scale |
| `bearer` | Native/API clients without cookies |
| `jwt` plugin | Other services validating JWKS — not a full session substitute |
| Stateless (no DB) | Limited; most plugins need DB |

`freshAge` gates sensitive operations. Revoke via `revokeSession` / `revokeSessions` APIs.

## AuthZ gotchas

- **`additionalFields` default `input: true`** — users can set them on sign-up. Roles/flags → `input: false`.
- Middleware cookie sniff ≠ authenticated. Always `auth.api.getSession` (or equivalent) for protected data.
- Admin plugin: enforce your own authorization on admin UI/API; impersonation leaves `impersonatedBy`.
- Organization ACL: keep server `roles`/`ac` in sync with `organizationClient({ ac, roles })`.

## Email / OTP / magic link

- Implement senders; don’t await external mail/SMS inside the critical path when docs warn about timing.
- Prefer hashed/encrypted OTP storage over plain.
- Email enumeration: use `customSyntheticUser` when admin/extra fields exist.
- Sign-in OTP on password accounts can strip password + revoke sessions (emailOTP behavior) — read current plugin docs before enabling.

## Proxies & IP

Configure `advanced.ipAddress.ipAddressHeaders` / `trustedProxies` — don’t blindly trust `X-Forwarded-For`. Optional `trustedProxyHeaders` for dynamic base URL behind proxies.

## Cross-subdomain cookies

`advanced.crossSubDomainCookies` when sharing sessions across subdomains — set domain carefully.

## Good patterns

- Singleton `export const auth = betterAuth(...)` in `lib/auth.ts`.
- Matching client module; same plugin set.
- Server actions: cookie helper plugin **last** (`nextCookies`, `tanstackStartCookies`).
- After every plugin: generate + migrate schema; typecheck.
- Tests: memory adapter + `testUtils` only in test auth instance (don’t conditional-spread plugins in a way that breaks `$Infer` in app code).
- Bundle: `better-auth/minimal` + scoped ORM adapter.

## Bad patterns

- New `betterAuth()` per request.
- Client sign-in from RSC expecting Set-Cookie without a proper route/action path.
- Security via cookie existence middleware only.
- Disabling CSRF/origin checks.
- Shipping `testUtils()` in production config.
- Using `@better-auth/cli@1.4` or npm `next` tag.
- Claiming EOS/JWT sessions incorrectly; mixing bearer + cookie mental models without care.
- Dual-writing user tables outside Better Auth schema without hooks/adapters.

## Hooks (extension points)

```ts
import { createAuthMiddleware } from "better-auth/api"

hooks: {
  before: createAuthMiddleware(async (ctx) => { /* ... */ }),
  after: createAuthMiddleware(async (ctx) => { /* ... */ }),
},
databaseHooks: {
  user: { create: { before, after }, /* ... */ },
  session: { /* ... */ },
}
```

## Rate limits

- Production default window typically ~100 / 60s; stricter on sign-in / 2FA verify (~3 / 10s).
- Often **disabled in development** unless `rateLimit.enabled: true`.
- Direct `auth.api.*` server calls are **not** rate-limited like HTTP routes — protect your own callers.
