# Better Auth Plugins & Ecosystem

Align scoped packages with **`better-auth@1.7.5`** unless noted. Always dual-register **server + client** plugins (except Generic OAuth), then regenerate schema.

## Built-in plugins (`better-auth/plugins` + `better-auth/client/plugins`)

| Plugin | Adds / notes |
|---|---|
| `organization` / `organizationClient` | Orgs, members, invitations, optional teams + ACL (`createAccessControl`). `getOrganization()` metadata-only; server `listUserTeams`. Tables: `organization`, `member`, `invitation` (+ team tables); session `activeOrganizationId` |
| `admin` / `adminClient` | Roles, ban, impersonate, user admin APIs. Bootstrap: `bunx auth@latest create-admin` |
| `twoFactor` / `twoFactorClient` | TOTP, OTP, backup codes. `enableTwoFactor({ method: "otp" \| "totp" })` — branch on returned `method` before reading `totpURI` / backup codes |
| `magicLink` / `magicLinkClient` | Email magic links. Requires `sendMagicLink`; uses `verification` |
| `emailOTP` / `emailOTPClient` | OTP sign-in / verify / reset. Requires `sendVerificationOTP` |
| `phoneNumber` / `phoneNumberClient` | SMS OTP. `user.phoneNumber`; requires `sendOTP`. Server-only `consumePhoneNumberOTP` |
| `username` / `usernameClient` | Username + password. Optional immutable usernames; `displayUsername` can be omitted |
| `anonymous` / `anonymousClient` | Guest → link. `user.isAnonymous`. Linking works in Expo / in-app browsers |
| `bearer` | `Authorization: Bearer <session-token>`. Cookies unavailable only |
| `jwt` / `jwtClient` | JWTs + JWKS for other services. Table `jwks`. **Not** a cookie-session replacement. Required by OAuth provider / MCP. `sessionCookieCache: true` for JWKS-backed `session_data` cookies |
| `multiSession` / `multiSessionClient` | Multi-account on device |
| `oneTimeToken` / `oneTimeTokenClient` | One-shot handoff tokens |
| `openAPI` | OpenAPI for auth routes. No client; guard exposure in prod |
| `genericOAuth` | Custom OAuth2/OIDC IdPs as first-class social providers. **No client plugin.** `signIn.social` / `linkSocial`; PKCE default `true`; callback `/api/auth/callback/:id`. Discovery verifies `id_token`. Helpers for Auth0/Keycloak/Entra in docs |
| `oneTap` | Google One Tap. Requires `clientId` on `oneTap()` or Google social provider |
| `siwe` | Ethereum wallets. Address/chain from the signed message — do not send them on nonce calls |
| `haveIBeenPwned` | Block breached passwords. Server helper `isPasswordCompromised` |
| `captcha` | Turnstile / reCAPTCHA / hCaptcha / …. Rules match **full paths** or explicit wildcards (`/sign-in/*`), not prefixes |
| `lastLoginMethod` + client | UI hint for last method |
| `customSession` | Customize session payload |
| `deviceAuthorization` / `deviceAuthorizationClient` | RFC 8628 for **Better Auth session** tokens at `/device/token`. Unique `deviceCode`/`userCode` (max 191 chars) |
| `oauthProxy` | Cross-domain OAuth proxy. Legacy `/oauth-proxy-callback` is deprecated |
| `testUtils` | Test login / OTP capture. **Never ship in production auth** |

Access control helpers: `better-auth/plugins/access`, `.../organization/access`, `.../admin/access`.

**Removed:** `oidcProvider` from `better-auth/plugins`. **Moved:** in-core `mcp` → `@better-auth/mcp`.

## Scoped official plugins (`@better-auth/*` @ 1.7.5)

| Package | Import | Purpose |
|---|---|---|
| `@better-auth/passkey` | `passkey` / `passkeyClient` | WebAuthn; table `passkey`; HTTPS/localhost; match `rpID`. Registration can create a session |
| `@better-auth/api-key` | `apiKey` / `apiKeyClient` | API keys (user/org); hashed storage; raw key once |
| `@better-auth/sso` | `sso` (+ client) | Enterprise OIDC + SAML. Subjects: OIDC `sub`, SAML signed `NameID`. IdP-initiated SAML **off** by default (`allowIdpInitiated`). Certificate lists for rotation |
| `@better-auth/scim` | `scim` | SCIM 2.0 Users **and Groups**, role projections, three connection modes. **Reprovision** from 1.6 — no in-place convert. Needs native DB transactions (not D1) |
| `@better-auth/oauth-provider` | `oauthProvider`, `oauthDeviceAuthorization` | OAuth 2.1 / OIDC **provider**. Requires `jwt()`. Protected resources, DPoP, back-channel logout, client auth methods. `validAudiences` → `resources` |
| `@better-auth/mcp` | `mcp`, `requireMcpAuth`, `createMcpProtectedRequestHandler` | MCP 2026-07-28 authorization on the OAuth provider. Compose with `cimd()` + `jwt()`. Do **not** also add `oauthProvider()`. Official SDK v2 owns transport (`legacy: "reject"`, POST only) |
| `@better-auth/cimd` | `cimd` | Client ID Metadata Document (stable on 1.7.5). Node: `fetchClientMetadataResource` from `@better-auth/cimd/node`. MCP profile: `metadataProfile: "mcp-2026-07-28"` |
| `@better-auth/stripe` | `stripe` / `stripeClient` | Customers + subscriptions; webhook secret. Org-scoped subs need `organization: { enabled: true }` in `stripe()` **and** the org plugin |
| `@better-auth/i18n` | i18n plugin | Auth errors; **22** built-in languages |

```ts
import { passkey } from "@better-auth/passkey"
import { passkeyClient } from "@better-auth/passkey/client"
import { apiKey } from "@better-auth/api-key"
import { apiKeyClient } from "@better-auth/api-key/client"
```

### MCP + CIMD sketch

```ts
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { mcp } from "@better-auth/mcp"
import { cimd } from "@better-auth/cimd"
import { fetchClientMetadataResource } from "@better-auth/cimd/node"

export const auth = betterAuth({
  plugins: [
    jwt(),
    mcp({
      loginPage: "/sign-in",
      consentPage: "/consent",
      resource: "https://api.example.com/mcp", // HTTPS, no query/fragment
    }),
    cimd({
      fetchClientMetadataResource,
      metadataProfile: "mcp-2026-07-28",
    }),
  ],
})
```

DCR is **off** unless both `allowDynamicClientRegistration` and `allowUnauthenticatedClientRegistration` are set. OAuth endpoints are `/oauth2/*`, not `/mcp/*`.

### OAuth device grant (API tokens, not app session)

```ts
import { jwt } from "better-auth/plugins"
import { oauthProvider, oauthDeviceAuthorization } from "@better-auth/oauth-provider"

plugins: [
  jwt(),
  oauthProvider({
    loginPage: "/sign-in",
    consentPage: "/consent",
    scopes: ["openid", "profile", "offline_access", "api:read"],
    resources: ["https://api.example.com"],
  }),
  oauthDeviceAuthorization({ verificationUri: "/device" }),
]
```

Poll `/oauth2/token`, not `authClient.device.token` (that path is the first-party session flow). Client: `oauthDeviceAuthorizationClient` from `@better-auth/oauth-provider/client`.

## Adapters & storage packages

| Package | Role |
|---|---|
| `@better-auth/drizzle-adapter` | Drizzle (also `better-auth/adapters/drizzle`). Relations v2 |
| `@better-auth/prisma-adapter` | Prisma (5–7) |
| `@better-auth/kysely-adapter` | Kysely |
| `@better-auth/mongo-adapter` | MongoDB |
| `@better-auth/memory-adapter` | In-memory (tests) |
| `@better-auth/redis-storage` | Official Redis secondary storage (`ioredis`) |

## Framework / client packages

| Package | Role |
|---|---|
| `@better-auth/expo` | Expo / React Native — async SecureStore (`await getCookie()`) |
| `@better-auth/electron` | Electron; S256 PKCE required; scheme in `trustedOrigins` |

Web helpers live on `better-auth` (`/next-js`, `/tanstack-start`, `/svelte-kit`, `/solid-start`, `/node`, `/react`, …).

## CLI & infra

| Package | Role | Note |
|---|---|---|
| `auth` | Current CLI | **`bunx auth@latest`** — generate, migrate, init, secret, info, upgrade, create-admin |
| `@better-auth/cli` | Old CLI | **1.4.x — do not use** |
| `@better-auth/core` | Internal engine | Peer of scoped pkgs |
| `@better-auth/telemetry` | Telemetry | 1.7.x |
| `@better-auth/test-utils` | Adapter tests | Vitest 5 supported |
| `@better-auth/utils` | Shared utils | **0.5.x** separate |
| `@better-auth/infra` | Dashboard / email-SMS infra | **0.4.x** separate |
| `@better-auth/dash` | Legacy dash package | **0.1.x** — prefer infra docs |
| `@better-auth/agent-auth` | Agent Auth Protocol | **0.6.x** separate line |
| Docs MCP | Remote docs | `https://mcp.better-auth.com/mcp` |

## Documented partner plugins (not `@better-auth/*`)

Vendor-owned; do not force-equal versions to 1.7.5:

- `@polar-sh/better-auth` — Polar
- `@creem_io/better-auth` — Creem
- `@chargebee/better-auth` — Chargebee
- `@dub/better-auth` — Dub
- Autumn / Dodo / Commet — see plugins index

No first-party Lemon Squeezy package under `@better-auth/`.

## Organization sketch

```ts
import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins"
import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

export const auth = betterAuth({
  plugins: [
    organization({
      async sendInvitationEmail(data) {
        /* send invite */
      },
    }),
  ],
})

export const authClient = createAuthClient({
  plugins: [organizationClient()],
})
```

## Two-factor sketch

```ts
import { twoFactor } from "better-auth/plugins"
import { twoFactorClient } from "better-auth/client/plugins"

plugins: [
  twoFactor({
    otpOptions: {
      async sendOTP({ user, otp }) {
        /* email/SMS */
      },
    },
  }),
]
// client: twoFactorClient({ twoFactorPage: "/2fa" })
// enableTwoFactor now returns { method: "otp" | "totp", ... }
```

## Version alignment rules

1. Same **1.7.x patch** for `better-auth` + installed `@better-auth/{passkey,api-key,sso,scim,oauth-provider,mcp,cimd,stripe,expo,electron,i18n,*-adapter,redis-storage,telemetry,test-utils,core}`.
2. Update **all** scoped packages on security advisories — not only core.
3. Do **not** force-equal: `utils` (0.5), `infra` (0.4), `agent-auth` (0.6), `dash` (0.1), partner pkgs.
4. Prefer `auth@latest` CLI over `@better-auth/cli`.
