# Queries, Transactions, and Locking

Table of contents: N+1, pagination, writes (upsert, MERGE, RETURNING, bulk), transactions and isolation, retries, locks and deadlocks, SKIP LOCKED queues, advisory locks, observing waits.

## Fix N+1 in SQL

```sql
-- Batch by key instead of one query per parent
SELECT * FROM order_items WHERE order_id = ANY($1::bigint[]);

-- Parent + children in one round trip
SELECT o.id, o.total,
       coalesce(json_agg(json_build_object('sku', i.sku, 'qty', i.qty)) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
FROM orders o LEFT JOIN order_items i ON i.order_id = o.id
WHERE o.customer_id = $1
GROUP BY o.id;

-- Top-N per group
SELECT c.id, r.* FROM customers c
CROSS JOIN LATERAL (SELECT * FROM orders o WHERE o.customer_id = c.id ORDER BY created_at DESC LIMIT 3) r
WHERE c.id = ANY($1);
```

- Detect N+1 in `pg_stat_statements`: huge `calls`, tiny `mean_exec_time`, same normalized query.
- ORM eager-loading is fine if it issues one batched query. Check the actual SQL (statement logging, driver debug hook).
- Pass arrays as one parameter (`$1::int[]`), not a variable-length `IN (...)` list; that keeps statement shape stable for the plan cache and `pg_stat_statements`.
- `SELECT *` over wide rows costs I/O and blocks index-only scans. Select the columns you use.

## Pagination

Keyset (seek) pagination:

```sql
SELECT id, created_at, title
FROM posts
WHERE (created_at, id) < ($1::timestamptz, $2::bigint)   -- cursor from last row
ORDER BY created_at DESC, id DESC
LIMIT 21;                                                 -- page size + 1 to detect next page
-- index: CREATE INDEX ON posts (created_at DESC, id DESC);
```

- Always end `ORDER BY` with a unique tiebreaker (`id`).
- The row comparison needs both columns sorted in the same direction. Mixed directions need an `OR` form or an index with matching mixed order.
- Encode the cursor opaque (base64url JSON); validate it; never trust it as SQL. Beware `timestamptz` microsecond precision lost in JS `Date` (ms): carry the cursor as an ISO string with microseconds or as text from `to_char`/`::text`, not via `Date`.
- `OFFSET n` scans and discards n rows, drifts under inserts/deletes. Acceptable only for small bounded sets or admin pages. Avoid `count(*)` per page; use an estimate (`reltuples`), a capped count (`SELECT count(*) FROM (SELECT 1 FROM t WHERE ... LIMIT 1001) s`), or cache it.

## Writes

```sql
-- Upsert (needs a unique index or constraint on the conflict target)
INSERT INTO counters (key, n) VALUES ($1, 1)
ON CONFLICT (key) DO UPDATE SET n = counters.n + 1
RETURNING n;

-- Insert-if-absent and get id either way
WITH ins AS (
  INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id
) SELECT id FROM ins UNION ALL SELECT id FROM tags WHERE name = $1 LIMIT 1;

-- Bulk insert from arrays (one statement, one round trip)
INSERT INTO events (user_id, kind) SELECT * FROM unnest($1::bigint[], $2::text[]);

-- PG18 old/new values in one round trip
UPDATE accounts SET balance = balance - $2 WHERE id = $1 RETURNING old.balance AS before, new.balance AS after;
```

- `MERGE` (PG15; `RETURNING` in PG17) for set-based sync with conditional insert/update/delete. It can raise unique violations under concurrency; `INSERT ... ON CONFLICT` is safer for simple upserts.
- `ON CONFLICT DO UPDATE` always writes a new row version when it matches; add `WHERE t.col IS DISTINCT FROM EXCLUDED.col` to skip no-op updates and bloat.
- Parameter limit: 65,535 bind parameters per statement. Chunk large inserts, or use `unnest`/`COPY`.
- `COPY ... FROM STDIN` is the fastest bulk path (PG17 `ON_ERROR ignore`). Load into a staging table, validate, then insert.
- `UPDATE`/`DELETE` of millions of rows: batch (see [migrations-zero-downtime.md](migrations-zero-downtime.md) backfills).
- Idempotency: unique key on `(source, external_id)` plus `ON CONFLICT DO NOTHING` beats check-then-insert.

## Transactions

- Default isolation is **Read Committed**: each statement sees data committed before it started. Lost updates happen on read-modify-write in app code. Fix with one atomic statement (`SET n = n + 1`), `SELECT ... FOR UPDATE`, optimistic version column, or a stricter isolation level.
- **Repeatable Read**: one snapshot per transaction; concurrent updates to rows you modify raise `40001`.
- **Serializable** (SSI): behaves as if serial; may abort with `40001` on dangerous structures. Use for invariants spanning several rows (booking, balances) when you can retry. Make transactions short and use indexes to limit predicate locks.
- `READ UNCOMMITTED` behaves as Read Committed. `READ ONLY` / `DEFERRABLE` help long reports.
- DDL is transactional (except `CONCURRENTLY` commands, `VACUUM`, `CREATE DATABASE`).
- A failed statement aborts the whole transaction (`25P02`) until `ROLLBACK` or `ROLLBACK TO SAVEPOINT`. Savepoints (and driver `sql.savepoint`) cost subtransactions; thousands per transaction hurt.
- Timeouts: `statement_timeout`, `lock_timeout`, `idle_in_transaction_session_timeout`, and PG17 `transaction_timeout`. Set them per role or `SET LOCAL` per transaction.
- `now()` is fixed at transaction start.

Retry wrapper (retry the whole unit of work, not one statement):

```ts
const RETRYABLE = new Set(["40001", "40P01"]); // serialization_failure, deadlock_detected

export async function withRetry<T>(run: () => Promise<T>, attempts = 5): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await run();
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (!code || !RETRYABLE.has(code) || i >= attempts) throw err;
      await new Promise((r) => setTimeout(r, Math.min(1000, 25 * 2 ** i) * (0.5 + Math.random())));
    }
  }
}
```

The callback must be idempotent in its side effects: do not send emails or call external APIs inside it. Use an outbox table written in the same transaction, then publish after commit.

## Locks and deadlocks

- Row locks: `FOR UPDATE` (blocks updates/deletes/other locks), `FOR NO KEY UPDATE` (what `UPDATE` takes when not changing key columns; does not block FK inserts), `FOR SHARE`, `FOR KEY SHARE` (taken by FK checks). Prefer `FOR NO KEY UPDATE` when you will not change keys.
- Table locks: ordinary `SELECT` takes `ACCESS SHARE`; DML takes `ROW EXCLUSIVE`; most `ALTER TABLE` takes `ACCESS EXCLUSIVE`, which conflicts with everything including reads. See [migrations-zero-downtime.md](migrations-zero-downtime.md).
- Lock queue effect: a waiting `ACCESS EXCLUSIVE` request blocks later readers and writers behind it. Short `lock_timeout` plus retry is the defense.
- Deadlocks: two transactions wait on each other. Postgres detects after `deadlock_timeout` (1s) and aborts one with `40P01`. Prevent by locking rows in a consistent order (`ORDER BY id FOR UPDATE`), keeping transactions short, and updating parents/children in a fixed order. FK checks on the same parent row can deadlock inserts; batch by parent.
- `NOWAIT` fails immediately (`55P03`); `SKIP LOCKED` skips locked rows (inconsistent view by design, only for queue-like access); `lock_timeout` bounds the wait.
- Unlocked read-then-write is a race. Examples to fix: "check balance then debit", "check stock then insert order", "get-or-create without unique constraint".

## Queue with SKIP LOCKED

```sql
CREATE INDEX CONCURRENTLY jobs_ready_idx ON jobs (priority DESC, id) WHERE status = 'queued';

WITH next AS (
  SELECT id FROM jobs
  WHERE status = 'queued' AND run_at <= now()
  ORDER BY priority DESC, id
  LIMIT 10
  FOR UPDATE SKIP LOCKED
)
UPDATE jobs j
SET status = 'running', locked_at = now(), attempts = j.attempts + 1
FROM next WHERE j.id = next.id
RETURNING j.*;
```

- Claim in a short transaction, work **outside** it, then mark `done`/`failed` in a second statement. A visibility-timeout reaper requeues `running` rows with old `locked_at` and bumps `attempts`; cap attempts and move poison jobs to `dead`.
- Make handlers idempotent: at-least-once is the default.
- Delete or partition finished rows; huge dead `done` rows slow the claim index and bloat. Autovacuum per-table tuning matters for queue tables.
- Wake workers with `LISTEN/NOTIFY` (needs session connections, not transaction pooling) or poll with backoff. `NOTIFY` payload max about 8000 bytes; it is a hint, not a durable queue.
- Throughput ceiling is one database's write rate; move to a broker (Redis/Kafka-based queue) when fan-out, rate limits, or delays outgrow it.

## Advisory locks

- `pg_try_advisory_xact_lock(key)` for single-flight jobs and cron guards; released at transaction end, safe with transaction pooling.
- Session-level `pg_advisory_lock` leaks across pooled connections. Avoid behind PgBouncer transaction mode.
- Derive keys with `hashtextextended('name', 0)` or two int4 keys; namespace them.

## Observing locks and waits

```sql
SELECT pid, state, wait_event_type, wait_event, now() - xact_start AS xact_age,
       now() - state_change AS in_state, pg_blocking_pids(pid) AS blocked_by, left(query, 100) AS query
FROM pg_stat_activity
WHERE datname = current_database() AND pid <> pg_backend_pid()
ORDER BY xact_start NULLS LAST;

-- Who blocks whom
SELECT a.pid AS waiting, b.pid AS blocking, a.query AS waiting_query, b.query AS blocking_query
FROM pg_stat_activity a JOIN LATERAL unnest(pg_blocking_pids(a.pid)) AS bp(pid) ON true
JOIN pg_stat_activity b ON b.pid = bp.pid;
```

- `state = 'idle in transaction'` with old `xact_start` is the classic cause of blocking, bloat, and stuck DDL. Fix the app; guard with `idle_in_transaction_session_timeout`.
- `pg_cancel_backend(pid)` cancels the current statement; `pg_terminate_backend(pid)` closes the connection. Prefer cancel first.
- Enable `log_lock_waits = on` (default on in PG19 beta) with `deadlock_timeout` to log waits and deadlock detail.
