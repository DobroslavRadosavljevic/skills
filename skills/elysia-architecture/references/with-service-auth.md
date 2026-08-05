# Extension: service-to-service auth

Load when internal routes are called by trusted workers/edge functions with a shared secret (not end-user session or API keys).

## Stance

Internal mounts sit under a dedicated prefix, use a small `onBeforeHandle` / plugin for secret header checks, and stay **hidden from public OpenAPI**. They are not a substitute for customer API keys.

## Tree

```text
apps/<api>/src/
  plugins/internal-service-auth/   # or equivalent guard plugin
  modules/internal/
    routes/…
```

## MUST

1. Compare a server-only shared secret from env (constant-time when available).
2. Scope the guard to the internal prefix only.
3. Hide routes from the public OpenAPI document.
4. Keep payloads minimal; still validate with schemas.

## MUST NOT

1. Reuse customer API keys as the internal service secret.
2. Expose internal routes on the public customer hostname without the guard.
3. Log the secret or full privileged payloads.

## Checklist

```text
Service auth overlay:
- [ ] Internal prefix + secret guard
- [ ] Env-owned secret
- [ ] Hidden from public OpenAPI
```
