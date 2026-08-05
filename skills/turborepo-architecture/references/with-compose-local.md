# Extension: local compose infra

Load when Docker Compose at the repo root provides Redis/Postgres/etc. while apps run on the host with Bun/Node.

## Stance

**Infra in Docker; apps on host.** Root scripts wrap compose up/down/wipe/reset. DB migrate/push scripts typically read the session API (or database package) env file.

## MUST

1. Keep compose files and wipe/reset helpers at the **repo root** (or `scripts/`).
2. Document ports and default URLs in `.env.example` files — not only in chat.
3. Separate wipe (delete volumes) from reset (wipe → up → migrate) clearly.

## MUST NOT

1. Putting full app processes inside compose by default when the house style is host Bun.
2. Hard-coding product hostnames into this portable overlay — use placeholders in docs.

## Checklist

```text
Compose local overlay:
- [ ] Root compose + scripts
- [ ] Apps use host processes + env URLs
- [ ] Wipe vs reset documented
```
