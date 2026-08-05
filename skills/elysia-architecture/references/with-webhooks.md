# Extension: webhooks

Load when third-party providers POST signed webhooks into the API.

## Stance

Webhooks are **normal feature route files** (not cron plugins). No session/identity macros. Verify signatures in a domain service; map tagged failures to 4xx/5xx.

## Tree

```text
modules/<feature>/routes/webhooks.ts
  # raw body: request.text() / arrayBuffer as required by the provider
  # call service.verifyAndHandle(…)

# Optional top-level mounts from main for non-prefixed providers:
# .use(resendWebhooks) at /webhooks/…
```

## MUST

1. Disable cookie/session identity on webhook routes.
2. Verify signatures before mutating state.
3. Keep provider event switches in the **domain service** (or package), thin route edge.
4. Prefer control-plane API for billing/email provider webhooks.
5. Hide webhook routes from public OpenAPI when they are not customer-facing.

## MUST NOT

1. Parse JSON before signature checks when the provider signs the raw body.
2. Share webhook secrets via client env.
3. Implement provider verify logic inline in the route beyond calling the service.

## Checklist

```text
Webhooks overlay:
- [ ] routes/webhooks.ts (or clear mount) without identity
- [ ] Signature verify in service
- [ ] Tagged errors → HTTP at edge
- [ ] OpenAPI hidden if internal
```
