# TypeScript Clients, Pooling, and Serverless

Table of contents: choosing a client, postgres.js, node-postgres, Bun.SQL, common traps, pool sizing, PgBouncer, serverless, shutdown.

Snapshot (2026-10-09): `postgres` 3.4.9 (ESM, tagged templates), `pg` 8.23.1 (Node >= 16, optional `pg-native`), Bun 1.4.x `Bun.SQL`. ORMs and builders (Drizzle `1.0.0-rc.4` on the `rc` tag, Kysely 0.29.6) sit on these drivers; the pooling and transaction rules below still apply.

## Choosing

| Client | Fits | Notes |
|---|---|---|
| **postgres.js** (`postgres`) | Node, Bun, Deno, edge-ish runtimes; ergonomic tagged templates | Pipelining, auto-prepared statements, `LISTEN`, `COPY`. |
| **node-postgres** (`pg`) | Node; most ORMs/tools depend on it | `Pool`, explicit `client.release()`, cursors/streams via `pg-cursor`/`pg-query-stream`. |
| **Bun.SQL** (`import { sql, SQL } from "bun"`) | Bun-only services | Built in; no dependency; check behavior against docs for your Bun version. |

Keep one client/pool per process, created at module scope, not per request.

## postgres.js

```ts
import postgres from "postgres";

export const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,                 // pool size per process (default 10)
  idle_timeout: 20,        // seconds
  max_lifetime: 60 * 30,   // seconds; recycle connections (helps with failover/DNS)
  connect_timeout: 10,     // seconds (default 30)
  prepare: true,           // set false behind transaction-mode poolers lacking prepared-statement support
  connection: { application_name: "api", statement_timeout: 10_000 },
  onnotice: () => {},
});

const rows = await sql<{ id: string; email: string }[]>`
  SELECT id, email FROM users WHERE id = ANY(${sql.array(ids)}) AND active = ${true}
`;

await sql.begin(async (tx) => {
  const [o] = await tx`INSERT INTO orders ${tx({ customer_id: 1, total: "9.99" })} RETURNING id`;
  await tx`INSERT INTO order_items ${tx(items.map((i) => ({ order_id: o.id, ...i })))}`;
}); // commits on resolve, rolls back on throw

await sql.end({ timeout: 5 }); // on shutdown
```

- Interpolations become parameters (`$1`), never string concat. Dynamic identifiers: `sql(columnName)` helper, validated against an allowlist. `sql.unsafe(...)` is for trusted static SQL only.
- Dynamic fragments and conditionals: `` sql`... ${cond ? sql`AND x = ${x}` : sql``}` ``.
- `sql.json(value)` for jsonb params, `sql.array(arr)` for arrays, `sql.file(path)` for SQL files.
- Streaming large results: `await sql\`...\`.cursor(500, async (rows) => { ... })` or `for await`.
- `sql.reserve()` gives one dedicated connection (for session-level work); always `release()`.
- `sql.listen(channel, fn)` uses a dedicated connection and reconnects. Do not run it through a transaction-mode pooler.
- Errors expose SQLSTATE in `err.code` and, for constraints, `constraint_name`, `table_name`, `column_name`, `detail`. Library errors have their own codes (`CONNECT_TIMEOUT`, `CONNECTION_ENDED`, ...).
- Verify numeric parsing (`int8`, `numeric`, `date`) with a smoke test and configure `types` if you need `BigInt` or string dates.
- Transactions are scoped to the callback's `tx`; using the outer `sql` inside `begin` runs outside the transaction on another connection. A common bug.

## node-postgres

```ts
import { Pool, types } from "pg";

types.setTypeParser(1082, (v) => v);          // date as 'YYYY-MM-DD' string, not a local-time Date
// int8 (20) and numeric (1700) are strings by default; keep them strings for money.

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,     // default 0 = wait forever
  maxLifetimeSeconds: 1800,
  statement_timeout: 10_000,
  idle_in_transaction_session_timeout: 30_000,
  application_name: "api",
});
pool.on("error", (err) => logger.error({ err }, "idle pg client error")); // required: otherwise the process can crash

const { rows } = await pool.query("SELECT id FROM users WHERE id = ANY($1::bigint[])", [ids]);

const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("INSERT INTO orders (customer_id) VALUES ($1)", [1]);
  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();      // client.release(true) discards a suspect connection
}

await pool.end(); // shutdown
```

- Never use `pool.query` for transactions; each call can land on a different connection.
- Always release in `finally`. A leaked client starves the pool and surfaces as `connectionTimeoutMillis` errors.
- Parameters are `$1..$n`, never interpolated. Named prepared statements (`{ name, text, values }`) cache per connection and conflict with poolers that do not support them.
- Errors: `err.code` is SQLSTATE; `err.constraint`, `err.detail`, `err.table`, `err.column`.
- Use `pg-query-stream` or `pg-cursor` for large reads; `COPY` via a streaming add-on.
- `timestamptz` -> JS `Date` (ms precision). `date` -> local-time `Date` unless overridden (trap near DST). `json/jsonb` -> parsed objects. `bigint` -> string.

## Bun.SQL

```ts
import { SQL } from "bun";

const db = new SQL({
  url: process.env.DATABASE_URL!,
  max: 10,                // pool size
  idleTimeout: 30,        // seconds
  maxLifetime: 3600,      // seconds
  connectionTimeout: 10,  // seconds
  prepare: false,         // set false for transaction-mode poolers without prepared-statement support
  bigint: true,           // int8 as BigInt (default: string)
  tls: true,
});

const users = await db`SELECT * FROM users WHERE id = ANY(${db.array(ids)})`;
await db.begin(async (tx) => {
  await tx`INSERT INTO users ${tx(newUser, "name", "email")}`;
  await tx.savepoint(async (sp) => { await sp`UPDATE users SET status = 'active'`; });
});
await db.close({ timeout: 5 });
```

- Connects lazily on first query. Errors are `SQL.PostgresError` (documented fields: `code`, `detail`, `hint`); confirm in a test that `code` carries the SQLSTATE you branch on (for example `23505`) before relying on it.
- `db.unsafe(text, params)` and `db.file(path)` for raw SQL; `db.reserve()` for a dedicated connection (release in `finally`).
- Other limits (isolation options, JSONB parse behavior): test against your Bun version; docs are thin.

## Cross-client traps

- Unhandled pool errors crash Node (`pg`); attach listeners.
- Do not put `await fetch(...)` or user waits inside a transaction callback.
- `LIMIT`/`OFFSET` and `IN` lists: pass arrays as one parameter (`= ANY($1)`). With `pg`, cast (`$1::uuid[]`) to avoid "could not determine data type".
- Serialize dates explicitly as ISO strings or `Date`; know the driver's timezone behavior. Keep session `TimeZone` at UTC.
- Do not cache connections in globals under hot reload without guarding (dev servers leak pools); reuse via `globalThis`.
- Retries: only retry whole transactions on `40001`/`40P01`, and idempotent statements on connection errors (`57P01`, `08006`, ECONNRESET). See [queries-transactions-locking.md](queries-transactions-locking.md).

## Pool sizing

- Postgres processes are expensive (a few MB each plus `work_mem` per sort/hash node). Throughput peaks near `2-4 x CPU cores` of active connections; more just queues.
- Budget: `sum(pool max over all app instances and workers) + migrations + admin + monitoring < max_connections - superuser_reserved_connections` (and replicas have their own `max_connections`).
- Autoscaling apps multiply pools. Fix it with a smaller `max` per instance (often 3-10) or a pooler in front.
- A long query holds a connection; slow external calls inside transactions are the usual cause of exhaustion. Fix with timeouts, not bigger pools.
- Check: `SELECT state, count(*) FROM pg_stat_activity GROUP BY 1;` and `SHOW max_connections;`.

## PgBouncer

Latest: **1.26.0** (2026-09-23; security fixes in 1.25.x and 1.26). Pool modes: session, **transaction** (most common), statement.

Transaction mode returns the server connection after each transaction, so session state does not survive:

| Breaks or needs care | Use instead |
|---|---|
| `SET x = ...` (session) | `SET LOCAL` inside the transaction; pooler tracks some params (`client_encoding`, `search_path`, ... see `track_extra_parameters`; 1.26 tracks `search_path` and `default_transaction_read_only` by default) |
| Session advisory locks (`pg_advisory_lock`) | `pg_advisory_xact_lock` |
| `LISTEN/NOTIFY` | Dedicated direct (session) connection |
| Temp tables, `WITH HOLD` cursors, `DISCARD` assumptions | Avoid |
| SQL-level `PREPARE` / `DEALLOCATE` | Not supported |
| Protocol-level named prepared statements | Supported since 1.21 when `max_prepared_statements` > 0 (default 200 since 1.24); older PgBouncer: `prepare: false` in the client |
| Migrations with `lock_timeout`/advisory locks | Connect directly to the database |

Config highlights: `pool_mode = transaction`, `default_pool_size` (per user+db, keep well below `max_connections`), `max_client_conn` (thousands OK), `reserve_pool_size`, `server_idle_timeout`, `query_wait_timeout` (1.26: per-user/database), `server_lifetime`, `auth_type = scram-sha-256`, `ignore_startup_parameters = extra_float_digits`, TLS both sides (`client_tls_sslmode`, `server_tls_sslmode = verify-full`). Monitor with `SHOW POOLS; SHOW STATS;` (`cl_waiting` > 0 means clients queue).

Use `ALTER ROLE ... SET` for per-role defaults; they apply at connection start on the server, not per transaction.

Managed poolers (provider-run PgBouncer or other proxies) follow the same transaction-mode rules; read the provider's docs for prepared-statement support.

## Serverless and edge

- Each function instance opening its own pool of 10 exhausts the database. Use `max: 1` (or very small), a pooler endpoint (transaction mode), and short `idle_timeout`.
- Prefer HTTP/WebSocket drivers provided by your database vendor on runtimes without TCP (edge). They typically do not support all session features; test transactions and prepared statements.
- Freeze/thaw: connections can be killed while the function is frozen. Recycle with `max_lifetime`, handle `CONNECTION_ENDED`/`ECONNRESET` with one retry for idempotent reads.
- Cold starts: create the client at module scope for reuse across invocations; avoid per-request client creation.
- Long transactions and `LISTEN` belong on a long-lived worker, not on functions.

## Graceful shutdown

On `SIGTERM`: stop accepting requests, wait for in-flight work, then `sql.end({ timeout })` / `pool.end()` / `db.close({ timeout })`. Hard-killing mid-transaction is safe for data (rolls back) but leaves backends until TCP times out; set `tcp_keepalives_*` or `idle_session_timeout` on the server for stragglers.
