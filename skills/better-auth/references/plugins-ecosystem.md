# Better Auth Plugins & Ecosystem

Align scoped packages with **`better-auth@1.6.25`** unless noted. Always dual-register **server + client** plugins, then regenerate schema.

## Built-in plugins (`better-auth/plugins` + `better-auth/client/plugins`)

| Plugin | Server / client | Adds / notes |
|---|---|---|
| `organization` / `organizationClient` | Orgs, members, invitations, optional teams + ACL (`createAccessControl`) | Tables: `organization`, `member`, `invitation` (+ team tables); session `activeOrganizationId` |
| `admin` / `adminClient` | Roles, ban, impersonate, user admin APIs | `user.role`, ban fields; `session.impersonatedBy` |
| `twoFactor` / `twoFactorClient` | TOTP, OTP, backup codes | `user.twoFactorEnabled`; table `twoFactor`; strict rate limit on `/two-factor/*` |
| `magicLink` / `magicLinkClient` | Email magic links | Requires `sendMagicLink`; uses `verification` |
| `emailOTP` / `emailOTPClient` | OTP sign-in / verify / reset | Requires `sendVerificationOTP`; prefer hashed/encrypted OTP store |
| `phoneNumber` / `phoneNumberClient` | SMS OTP | `user.phoneNumber` (+ verified); requires `sendOTP` |
| `username` / `usernameClient` | Username + password | `user.username`, `displayUsername` |
| `anonymous` / `anonymousClient` | Guest → link | `user.isAnonymous` |
| `bearer` | `Authorization: Bearer <session-token>` | No schema; cookies unavailable only |
| `jwt` / `jwtClient` | JWTs + JWKS for other services | Table `jwks`; **not** a cookie-session replacement |
| `multiSession` / `multiSessionClient` | Multi-account on device | Cookie/session list limits |
| `oneTimeToken` / `oneTimeTokenClient` | One-shot handoff tokens | Verification store |
| `openAPI` | OpenAPI for auth routes | No client; guard exposure in prod |
| `genericOAuth` | Custom OAuth2/OIDC IdPs | Auth0/Keycloak helpers in docs |
| `oneTap` | Google One Tap | Client needs Google `clientId` |
| `siwe` | Ethereum wallets | `walletAddress` table |
| `haveIBeenPwned` | Block breached passwords | Sign-up / change password |
| `captcha` | Turnstile / reCAPTCHA / hCaptcha / … | Bot protection |
| `lastLoginMethod` + client | UI hint for last method | |
| `customSession` | Customize session payload | |
| `deviceAuthorization` | RFC 8628 device flow | `deviceCode` |
| `oauthProxy` | Cross-domain OAuth proxy | Previews / multi-domain |
| `oauthPopup` | Popup OAuth UX | |
| `mcp` (built-in) | MCP OAuth resource/provider helpers | Distinct from docs MCP |
| `testUtils` | Test login / OTP capture | **Never ship in production auth** |
| `oidcProvider` / `oidcClient` | Legacy OIDC IdP | **Prefer** `@better-auth/oauth-provider` |

Access control helpers: `better-auth/plugins/access`, `.../organization/access`, `.../admin/access`.

## Scoped official plugins (`@better-auth/*`)

| Package | Import | Purpose |
|---|---|---|
| `@better-auth/passkey` | `passkey` / `passkeyClient` | WebAuthn; table `passkey`; HTTPS/localhost; match `rpID` |
| `@better-auth/api-key` | `apiKey` / `apiKeyClient` | API keys (user/org); hashed storage; raw key once |
| `@better-auth/sso` | `sso` (+ client) | Enterprise OIDC + SAML; `ssoProvider` |
| `@better-auth/scim` | `scim` | SCIM 2.0 provisioning; often with SSO |
| `@better-auth/oauth-provider` | `oauthProvider` (+ client / resource-client) | OAuth 2.1 / OIDC **provider**; requires `jwt()`; prefer over legacy oidc |
| `@better-auth/stripe` | `stripe` / `stripeClient` | Customers + subscriptions; webhook secret |
| `@better-auth/i18n` | i18n plugin | Translate auth errors |
| `@better-auth/cimd` | CIMD | Client ID Metadata Document — **1.7 beta** |
| `@better-auth/agent-auth` | Agent Auth Protocol | **0.6.x** separate line |

```ts
import { passkey } from "@better-auth/passkey"
import { passkeyClient } from "@better-auth/passkey/client"
import { apiKey } from "@better-auth/api-key"
import { apiKeyClient } from "@better-auth/api-key/client"
```

## Adapters & storage packages

| Package | Role |
|---|---|
| `@better-auth/drizzle-adapter` | Drizzle (also `better-auth/adapters/drizzle`) |
| `@better-auth/prisma-adapter` | Prisma |
| `@better-auth/kysely-adapter` | Kysely |
| `@better-auth/mongo-adapter` | MongoDB |
| `@better-auth/memory-adapter` | In-memory (tests) |
| `@better-auth/redis-storage` | Official Redis secondary storage (`ioredis`) |

## Framework / client packages

| Package | Role |
|---|---|
| `@better-auth/expo` | Expo / React Native |
| `@better-auth/electron` | Electron (proxy/preload/storage) |

Web framework helpers mostly live on `better-auth` entry points (`/next-js`, `/tanstack-start`, `/svelte-kit`, `/solid-start`, `/node`, `/react`, …).

## CLI & infra

| Package | Role | Note |
|---|---|---|
| `auth` | Current CLI | **`bunx auth@latest`** |
| `@better-auth/cli` | Old CLI | **1.4.x — do not use** |
| `@better-auth/core` | Internal engine | Peer of scoped pkgs |
| `@better-auth/telemetry` | Telemetry | 1.6.x |
| `@better-auth/test-utils` | Adapter tests | |
| `@better-auth/utils` | Shared utils | **0.5.x** separate |
| `@better-auth/infra` | Dashboard / email-SMS infra | **0.3.x** separate (`dash` legacy) |
| `@better-auth/mcp` | Local MCP tooling | Version may lag; docs MCP: `https://mcp.better-auth.com/mcp` |

## Documented partner plugins (not `@better-auth/*`)

Listed on the official plugins page; vendor-owned:

- `@polar-sh/better-auth` — Polar
- `@creem_io/better-auth` — Creem
- `@dub/better-auth` — Dub
- Autumn / Dodo / Commet / Chargebee — see plugins index

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
```

## Version alignment rules

1. Same **1.6.x patch** for `better-auth` + installed `@better-auth/{passkey,api-key,sso,scim,oauth-provider,stripe,expo,electron,i18n,*-adapter,redis-storage,telemetry,test-utils,core}`.
2. Update **all** scoped packages on security advisories — not only core.
3. Do **not** force-equal: `utils` (0.5), `infra` (0.3), `agent-auth` (0.6), `cimd` (1.7-beta), partner pkgs.
4. Prefer `auth@latest` CLI over `@better-auth/cli`.
