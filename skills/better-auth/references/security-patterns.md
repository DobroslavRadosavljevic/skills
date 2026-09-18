# Security & Patterns

## Must-configure production

1. **`BETTER_AUTH_SECRET`** ≥32 chars (or `secret` option). Rotate with `BETTER_AUTH_SECRETS` / `secrets` when needed.
2. Explicit **`baseURL`** / `BETTER_AUTH_URL` (no ambiguous origin).
3. **`trustedOrigins`**: every web origin, preview URL, and mobile scheme. Support wildcards carefully (`https://*.example.com`). Never leave loose localhost entries in prod.
4. HTTPS → Secure cookies; default `SameSite=Lax`, `httpOnly`.
5. Rate-limit **storage**: memory breaks on multi-instance/serverless — use Redis (`@better-auth/redis-storage`) or database.
6. Keep **`better-auth` and all `@better-auth/*`** patched together (advisories hit scoped packages too).
7. Leave schema validation on unless you have a documented reason to set `advanced.database.validateSchema: false`.

## CSRF / origin

- Prefer non-simple requests; Origin checks; Fetch Metadata on first-login email routes; OAuth state + PKCE.
- Same-origin form POST with `Referrer-Policy: no-referrer` (`Origin: null`) is allowed when `Sec-Fetch-Site` proves same-origin.
- `advanced.disableCSRFCheck` / `disableOriginCheck` — dangerous; don’t use to paper over CORS mistakes. `disableOriginCheck` also disables CSRF (compat).
- `account.skipStateCookieCheck` weakens OAuth CSRF — avoid.
- Relative callbacks must start with a single `/`. Protocol-relative and backslash URLs are rejected.

## Sessions

| Mode | When |
|---|---|
| Cookie + DB (default) | Most web apps |
| + `cookieCache` | Perf; shorten `maxAge` if revoke must be fast |
| + Redis secondary | Horizontal scale |
| `bearer` | Native/API clients without cookies |
| `jwt` plugin | Other services validating JWKS — not a full session substitute |
| Stateless (no DB) | Limited; most plugins need DB |

`freshAge` gates sensitive operations. Revoke via `revokeSession` / `revokeSessions` APIs. OAuth provider sign-out revokes session-bound access tokens and can send back-channel logout.

## 1.7 upgrade (security-sensitive)

Follow https://better-auth.com/docs/guides/1-7-upgrade-guide. Upgrade all packages together (`bunx auth@latest upgrade`), then generate/migrate. Extra manual work:

| If you use | Do |
|---|---|
| Any 1.6 app | Deduplicate `(providerId, accountId)` before unique lookups |
| Applied **1.7.0–1.7.2** issuer schema | Relax/drop `account.issuer` (1.7.3+ does not write it) |
| Microsoft social / Entra helper | Rewrite `accountId` from `sub` → directory **`oid`** before traffic |
| Generic OAuth | `signIn.social` / `linkSocial`; callback `/callback/:id`; drop `genericOAuthClient`; PKCE on |
| `oidcProvider` | Move to `@better-auth/oauth-provider` (plugin **removed**) |
| MCP | `@better-auth/mcp` + `@better-auth/cimd` + `jwt()`; rename `withMcpAuth` → `requireMcpAuth` |
| OAuth provider | `validAudiences` → `resources`; migrate `oauthApplication` → `oauthClient`; DPoP `htu` vs public `baseURL` |
| SCIM | Full cutover + directory **reprovision**. New secrets. `identity.resolveUser` — never email-match. Not D1 |
| SSO / SAML | Protocol subjects (`sub` / `NameID`); IdP-initiated off; ACS `/sso/saml2/sp/acs/:providerId` |
| Device codes | Unique indexes; MySQL/SQL Server bound strings ≤191. OAuth grant is opt-in via `oauthDeviceAuthorization()` |
| Expo | `await getCookie()`; async SecureStore methods |
| Captcha | Full paths / explicit wildcards, not `/sign-in` prefixes |
| Custom secondary storage | Implement `increment` + `getAndDelete` |
| Custom rate-limit store | `consume(key, rule)` only |
| Joins | `advanced.database.joins` (not `experimental.joins`) |
| Dynamic `baseURL` + proxy | `advanced.trustedProxyHeaders: true` only if the public host is solely in `x-forwarded-host` |

## AuthZ gotchas

- **`additionalFields` default `input: true`** — users can set them on sign-up. Roles/flags → `input: false`.
- Middleware cookie sniff ≠ authenticated. Always `auth.api.getSession` (or equivalent) for protected data.
- Admin plugin: enforce your own authorization on admin UI/API; impersonation leaves `impersonatedBy`.
- Organization ACL: keep server `roles`/`ac` in sync with `organizationClient({ ac, roles })`.
- `user.validateUserInfo` is the admission gate before create/link.

## Email / OTP / magic link

- Implement senders; don’t await external mail/SMS inside the critical path when docs warn about timing.
- Prefer hashed/encrypted OTP storage over plain.
- Email enumeration: use `customSyntheticUser` when admin/extra fields exist.
- **1.7:** magic-link / email-OTP sign-in on an account whose email was **never confirmed** can strip unproven passwords/linked accounts and revoke sessions. Users who signed up with password but first prove the mailbox via OTP/link must reset the password.

## Two-factor

`enableTwoFactor` returns a discriminated `{ method: "otp" | "totp" }`. `totpURI` and backup codes exist only for `"totp"`. OTP enrollment needs `otpOptions.sendOTP`. TOTP re-enrollment no longer silently replaces an active authenticator.

## Proxies & IP

Configure `advanced.ipAddress.ipAddressHeaders` / `trustedProxies` — don’t blindly trust `X-Forwarded-For`. IPv6 is rate-limited per `/64` by default (`ipv6Subnet`).

Dynamic `baseURL.allowedHosts` ignores forwarded headers unless `advanced.trustedProxyHeaders: true`. Canonicalize scheme/host to public `baseURL` at the route boundary for OAuth consent redirects and DPoP `htu`.

Server-side OAuth token/JWKS requests **do not follow redirects**.

## Cross-subdomain cookies

`advanced.crossSubDomainCookies` when sharing sessions across subdomains — set domain carefully.

## Good patterns

- Singleton `export const auth = betterAuth(...)` in `lib/auth.ts`.
- Matching client module; same plugin set (except Generic OAuth).
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
- Treating 1.7 as beta/rc, or mixing 1.6 scoped packages with 1.7 core.
- Importing MCP from `better-auth/plugins` or keeping `oidcProvider`.
- Claiming EOS/JWT sessions incorrectly; mixing bearer + cookie mental models without care.
- Dual-writing user tables outside Better Auth schema without hooks/adapters.
- Registering `oauthProvider()` **and** `mcp()` in the same app.

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

OAuth provider extensions: `extendOAuthProvider(ctx, …)` from a plugin `init(ctx)` — do not fork the provider.

## Rate limits

- Production default window typically ~100 / 60s; stricter on sign-in / 2FA verify (~3 / 10s).
- Often **disabled in development** unless `rateLimit.enabled: true`.
- Direct `auth.api.*` server calls are **not** rate-limited like HTTP routes — protect your own callers.
