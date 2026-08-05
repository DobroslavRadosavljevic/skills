# Extension: session auth (server)

Load when the API mounts a session auth library (e.g. Better Auth) and exposes an opt-in Elysia macro for “has session.”

## Stance

Auth **configuration** lives in a shared package factory (`createAuth(options)`). The session API app wires options from validated env and mounts the handler. Packages do not read `process.env`.

## Tree

```text
packages/<auth>/
  src/…                      # createAuth(options) — no process.env

apps/<session-api>/src/
  modules/authentication/    # wire createAuth(env…); export auth instance
  plugins/session/plugin.ts  # Elysia macro { auth: true } → user/session or 401
  main.ts                    # .mount(auth.handler) + .use(sessionPlugin)
```

## MUST

1. **One auth factory** in a package; apps pass secrets/URLs/email hooks from `env`.
2. Mount the auth HTTP handler on the session/control-plane API (not on a jobs-only API unless intentional).
3. **Session macro** (`{ auth: true }` or equivalent) for routes that need a logged-in user but not full product identity.
4. Keep auth routes out of noisy logs/OpenAPI when the repo already excludes them.
5. Trusted origins / cookie SameSite come from env at the app edge.

## MUST NOT

1. Re-configure `betterAuth()` / equivalent in multiple apps.
2. Put auth table SQL ownership in random feature modules — keep schema with the database package (or auth’s documented home).
3. Treat session-only as full product authorization (see capability / identity extensions).

## Checklist

```text
Session auth overlay:
- [ ] createAuth(options) in package; app wires env
- [ ] Handler mounted once on the session API
- [ ] session plugin macro for { auth: true } routes
- [ ] No duplicate auth configs
```
