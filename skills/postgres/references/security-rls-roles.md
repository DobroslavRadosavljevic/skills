# Roles, Least Privilege, Row-Level Security, and Auth

Table of contents: role model, grants, defaults, authentication and TLS, row-level security, multi-tenant patterns, secrets and injection.

## Role model

Use separate roles with the least privilege each needs:

| Role | Purpose | Privileges |
|---|---|---|
| `app_owner` (NOLOGIN or deploy-only) | Owns schemas/tables, runs migrations | `CREATE` on schema, owns objects |
| `app_rw` | Runtime app connections | `SELECT/INSERT/UPDATE/DELETE` on tables, `USAGE` on sequences |
| `app_ro` | Reporting, read replicas, BI | `SELECT` only |
| `app_worker` | Background jobs | Only the tables they touch |
| `monitor` | Metrics | `pg_monitor` (or `pg_read_all_stats`) |
| `admin` (human, MFA'd access) | Break-glass | Superuser-like, audited, not used by apps |

```sql
CREATE ROLE app_owner NOLOGIN;
CREATE ROLE app_rw LOGIN PASSWORD NULL;           -- set via secret manager, or use IAM/cert auth
CREATE SCHEMA app AUTHORIZATION app_owner;

REVOKE ALL ON DATABASE appdb FROM PUBLIC;
GRANT CONNECT ON DATABASE appdb TO app_rw;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;       -- default since PG15 for new clusters, still audit it
GRANT USAGE ON SCHEMA app TO app_rw;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO app_rw;

-- Future objects created by the owner get the same grants
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_rw;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
  GRANT USAGE, SELECT ON SEQUENCES TO app_rw;
```

- The runtime role must not own tables, must not be `SUPERUSER`, `CREATEDB`, `CREATEROLE`, or `BYPASSRLS`. Owners bypass RLS unless forced and can alter any table property.
- Grant per column (`GRANT UPDATE (status) ON orders TO ...`) when roles should edit only some fields.
- Per-role limits: `ALTER ROLE app_rw SET statement_timeout = '10s'; ALTER ROLE app_rw SET idle_in_transaction_session_timeout = '30s'; ALTER ROLE app_rw CONNECTION LIMIT 50;`. Use higher limits only for batch/report roles.
- Pin `search_path` on roles/functions (`ALTER ROLE app_rw SET search_path = app, public`). `SECURITY DEFINER` functions must set `search_path` and revoke `EXECUTE` from `PUBLIC`.
- PG17 added the `MAINTAIN` privilege and `pg_maintain` role (VACUUM/ANALYZE/REINDEX without ownership). Predefined roles: `pg_read_all_data`, `pg_write_all_data`, `pg_monitor`, `pg_read_all_stats`, `pg_signal_backend`.
- Audit with `\du+`, `\dp`, `information_schema.role_table_grants`, `pg_default_acl`.

## Authentication and transport

- `password_encryption = scram-sha-256`. MD5 passwords are deprecated (PG18 warns on `CREATE/ALTER ROLE`; PG19 beta warns on md5 login). Re-set passwords to migrate.
- `pg_hba.conf`: `hostssl` only, narrow CIDRs, `scram-sha-256` or `cert`. Managed services expose this through provider settings.
- Client TLS: `sslmode=verify-full` with CA, not `require`/`prefer`. PG18 adds `oauth` auth in `pg_hba.conf` (needs libcurl build); PG19 beta adds server-side SNI config.
- Rotate credentials via secret manager; avoid long-lived superuser URLs in env files. Do not log connection strings (they embed passwords).
- Block public access: private networking or allowlists, no `0.0.0.0/0`.
- Prevent connection exhaustion by a hostile or buggy client: per-role `CONNECTION LIMIT`, pooler quotas.

## Row-level security (RLS)

RLS filters rows per query using policies. It is defense in depth for multi-tenant data, not a replacement for app authorization and not a performance feature.

```sql
ALTER TABLE app.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.invoices FORCE ROW LEVEL SECURITY;      -- apply to the table owner too

CREATE POLICY tenant_isolation ON app.invoices
  USING      (tenant_id = (SELECT current_setting('app.tenant_id')::bigint))
  WITH CHECK (tenant_id = (SELECT current_setting('app.tenant_id')::bigint));
```

Set the tenant per transaction (works with transaction-mode pooling because it is transaction-local):

```ts
await sql.begin(async (tx) => {
  await tx`SELECT set_config('app.tenant_id', ${String(tenantId)}, true)`; // true = local to this transaction
  return tx`SELECT * FROM app.invoices ORDER BY id DESC LIMIT 20`;
});
```

Rules:
- Without a policy, RLS denies all rows (default deny) for non-owners. Superusers and roles with `BYPASSRLS` skip RLS. Table owners skip it unless `FORCE`d.
- `USING` filters visible rows (SELECT/UPDATE/DELETE targets). `WITH CHECK` validates new/updated rows (INSERT/UPDATE). Specify both for `ALL` policies.
- Missing setting: `current_setting('app.tenant_id', true)` returns NULL and the comparison matches nothing (fails closed). Without `true`, it errors if unset. Pick one deliberately.
- Wrap `current_setting()` and function calls in `(SELECT ...)` so the planner evaluates it once per query instead of per row.
- Index the policy columns (`tenant_id` first). Policies run on every query; complex subqueries in policies kill performance.
- Unique and foreign-key checks bypass RLS internally (they can leak existence via errors). Use composite keys including `tenant_id`.
- Views run with the view owner's rights by default and bypass RLS for the caller. Use `CREATE VIEW ... WITH (security_invoker = true)` (PG15+) so the caller's policies apply.
- Functions marked `SECURITY DEFINER` run as owner and skip policies if owner is exempt; keep them minimal.
- `pg_dump` runs as a role that bypasses RLS or uses `--enable-row-security`. Backup roles need `BYPASSRLS`.
- Test as the real app role with and without tenant context, including INSERT/UPDATE attempts that cross tenants. Add a CI test that fails if a new table in the tenant schema lacks RLS.
- For per-user policies, set `app.user_id` the same way; do not trust a role per end user at scale.
- Do not rely on RLS if an ORM or tool connects with an owner/BYPASSRLS role, or if the pooler reuses sessions with session-level `SET`.

## Multi-tenant patterns

| Pattern | Isolation | Cost |
|---|---|---|
| Shared tables + `tenant_id` + RLS | Logical | Cheapest ops; noisy neighbors; careful indexes |
| Schema per tenant | Stronger | Migration fan-out; catalog bloat at thousands of tenants |
| Database per tenant | Strongest | Connection and ops overhead |

Pick shared tables + RLS by default; escalate for compliance or very large tenants.

## SQL injection, secrets, and data

- Parameterize every value. Identifiers: allowlist or `format('%I')`; never concatenate request data.
- Dynamic SQL in PL/pgSQL: `EXECUTE format('... %I ...', ident) USING value`.
- Restrict `COPY ... PROGRAM`, `pg_read_server_files`, and `lo_import` to admin roles only.
- Encrypt sensitive columns in the app (or use provider KMS); `pgcrypto` keys in SQL end up in logs and `pg_stat_statements`. Passwords hashed in the app with argon2/scrypt, not `crypt()` in queries.
- Set `log_statement` carefully; `log_min_duration_statement` can log literals in slow statements; prefer parameterized logging and `auto_explain` with `log_parameter_max_length`.
- Backups, replicas, and dumps contain the same sensitive data. Apply the same access controls and encryption at rest.
