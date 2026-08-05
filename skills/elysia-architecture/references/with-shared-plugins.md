# Extension: shared vs app plugins

Load when more than one Elysia app exists, or when cross-cutting HTTP plugins are split between a shared package and `apps/<api>/src/plugins/`.

## Stance

Share plugins that have **no app-specific env/auth coupling**. Keep identity, CORS origins, OpenAPI titles, cron, and workbench-style ops in the **app**.

## Tree

```text
packages/<elysia>/src/plugins/<name>/
  # e.g. IP / request helpers — portable

apps/<api>/src/plugins/
  cors/
  openapi/
  session/ · identity/
  evlog/ · opentelemetry/
  cron/
  <ops>/
```

## MUST

1. Give every plugin a stable `name` (SCREAMING_SNAKE) for deduplication.
2. App plugins may import `env`, `runtime`, and auth instances; shared package plugins must accept options instead.
3. Prefer `apps/.../plugins/<name>/plugin.ts` as the export surface.

## Mount order (soft default)

1. OpenTelemetry / tracing  
2. CORS / security headers  
3. Shared request helpers (IP, …)  
4. Logging  
5. Session / identity  
6. Feature modules  
7. OpenAPI  
8. Cron / ops mounts  

Adjust to the app; keep tracing and auth before protected features.

## MUST NOT

1. Move identity/session plugins into the shared package while they close over one app’s `auth` singleton.
2. Register hooks in an order that silently skips later routes (respect Elysia scope/order).

## Checklist

```text
Plugins overlay:
- [ ] Shared vs app placement correct
- [ ] Named plugins
- [ ] Options in for shared plugins (no process.env)
- [ ] Mount order sensible (trace → auth → features → docs → cron)
```
