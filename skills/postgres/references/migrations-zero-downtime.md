# Zero-Downtime Migrations

Table of contents: ground rules, lock cheat sheet, safe recipes, backfills, expand/contract, tooling in TS, rollout checklist.

## Ground rules

1. **Every DDL session sets timeouts**, then retries on failure:

```sql
SET lock_timeout = '3s';          -- fail fast instead of queueing everyone behind you
SET statement_timeout = '15min';  -- bound long operations like VALIDATE or index builds
```

   A statement that waits for `ACCESS EXCLUSIVE` blocks all later queries on the table, so a "fast" `ALTER` behind one long-running query becomes an outage. Retry the DDL with backoff outside peak.
2. Know each statement's **lock level** and whether it **rewrites** the table.
3. One risky change per migration. Keep migrations idempotent-ish (`IF NOT EXISTS`) where the runner may re-run.
4. Never combine DDL and a big backfill in one transaction.
5. Old and new app versions both run during deploy. Schema must work for both (expand/contract).
6. Test on production-shaped data volume. Measure lock time and WAL.
7. Check whether the migration runner wraps files in a transaction. `CREATE INDEX CONCURRENTLY`, `DROP INDEX CONCURRENTLY`, `REINDEX CONCURRENTLY`, `VACUUM`, and `CREATE DATABASE` need a no-transaction mode or a separate script. `ALTER TYPE ... ADD VALUE` may run in a transaction (PG12+), but the new value is unusable until commit.

## Lock and rewrite cheat sheet

| Operation | Lock | Rewrite / scan | Safe approach |
|---|---|---|---|
| `ADD COLUMN` nullable, no default | `ACCESS EXCLUSIVE` (brief) | No | Fine with `lock_timeout` |
| `ADD COLUMN ... DEFAULT <constant>` (PG11+) | brief `ACCESS EXCLUSIVE` | No | Fine |
| `ADD COLUMN ... DEFAULT <volatile>` (`uuidv7()`, `random()`, `clock_timestamp()`), or `STORED` generated | `ACCESS EXCLUSIVE` | **Full rewrite** | Add nullable, set default after, backfill in batches |
| `ADD COLUMN ... NOT NULL` without default | fails if rows exist | - | Add nullable, backfill, then enforce |
| `SET NOT NULL` | `ACCESS EXCLUSIVE` | Scan unless a valid `CHECK (col IS NOT NULL)` exists | `ADD CONSTRAINT c CHECK (col IS NOT NULL) NOT VALID`; `VALIDATE`; `SET NOT NULL`; drop check. PG18: `ADD CONSTRAINT nn NOT NULL col NOT VALID` then `VALIDATE CONSTRAINT` |
| `ADD CHECK` | `ACCESS EXCLUSIVE` + scan | Scan | `NOT VALID`, then `VALIDATE CONSTRAINT` (`SHARE UPDATE EXCLUSIVE`, writes continue) |
| `ADD FOREIGN KEY` | `SHARE ROW EXCLUSIVE` on both tables + scan | Scan | `NOT VALID`, then `VALIDATE` (index the referencing column first) |
| `ADD UNIQUE` / `PRIMARY KEY` | `ACCESS EXCLUSIVE` + index build | Build | `CREATE UNIQUE INDEX CONCURRENTLY`, then `ADD CONSTRAINT ... UNIQUE USING INDEX idx` (fast) |
| `CREATE INDEX` | `SHARE` (blocks writes) | Build | `CREATE INDEX CONCURRENTLY` |
| `CREATE INDEX CONCURRENTLY` | `SHARE UPDATE EXCLUSIVE`; two scans; not in a transaction | Build | Failure leaves an `INVALID` index: `DROP INDEX CONCURRENTLY` then retry |
| `DROP INDEX` | `ACCESS EXCLUSIVE` | - | `DROP INDEX CONCURRENTLY` |
| `REINDEX` | blocks writes | Build | `REINDEX INDEX CONCURRENTLY` |
| `ALTER COLUMN TYPE` | `ACCESS EXCLUSIVE` | Rewrite unless binary-coercible (e.g. `varchar(n)` -> larger or `text`, `numeric` precision increase with same scale) | Expand/contract with new column |
| `ALTER COLUMN SET DEFAULT` | brief | No | Fine |
| `DROP COLUMN` | brief `ACCESS EXCLUSIVE` | No (space reclaimed later) | Stop app writes/reads first |
| `RENAME COLUMN/TABLE` | brief `ACCESS EXCLUSIVE` | No | Breaks old app code: expand/contract (or a view) |
| `ALTER TYPE enum ADD VALUE` | brief | No | Cannot use new value in same transaction; cannot remove values |
| `ATTACH PARTITION` | `SHARE UPDATE EXCLUSIVE` on parent, `ACCESS EXCLUSIVE` on partition | Scan unless a matching `CHECK` exists | Add `CHECK (...)` `NOT VALID`+`VALIDATE` on the new table first |
| `DETACH PARTITION CONCURRENTLY` | `SHARE UPDATE EXCLUSIVE` | No | Use it; not allowed with a default partition |
| `VACUUM FULL` / `CLUSTER` | `ACCESS EXCLUSIVE` | Rewrite | `pg_repack`; PG19 beta `REPACK CONCURRENTLY` |

Verify lock levels for your exact version in the "Explicit Locking" and `ALTER TABLE` pages.

## Recipes

**Add a NOT NULL column with a default (big table)**

```sql
ALTER TABLE orders ADD COLUMN source text;                         -- instant
-- app starts writing source; backfill in batches (below)
ALTER TABLE orders ADD CONSTRAINT orders_source_nn CHECK (source IS NOT NULL) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT orders_source_nn;           -- no write block
ALTER TABLE orders ALTER COLUMN source SET NOT NULL;               -- skips scan thanks to the valid CHECK
ALTER TABLE orders DROP CONSTRAINT orders_source_nn;
```

**Add a foreign key**

```sql
CREATE INDEX CONCURRENTLY order_items_order_id_idx ON order_items (order_id);
ALTER TABLE order_items ADD CONSTRAINT order_items_order_fk
  FOREIGN KEY (order_id) REFERENCES orders (id) NOT VALID;
ALTER TABLE order_items VALIDATE CONSTRAINT order_items_order_fk;
```

**Add a unique constraint / swap a primary key**

```sql
CREATE UNIQUE INDEX CONCURRENTLY users_email_key ON users (email);
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE USING INDEX users_email_key;
```

**Change a column type** (expand/contract): add `new_col`, dual-write (trigger or app), backfill in batches, validate equality, switch reads, stop writes to old, drop old in a later release. Keep the old column until rollback is no longer needed.

**Rename**: add new column, dual-write, backfill, switch reads, drop old. For tables, create a view with the old name only as a temporary bridge.

**Drop a column**: release 1 stops reading and writing it; release 2 `DROP COLUMN` (check ORMs that `SELECT *` or list columns explicitly).

**Enum**: `ALTER TYPE status ADD VALUE IF NOT EXISTS 'archived';` in its own migration; deploy code that uses it afterwards. To remove or reorder, migrate to a new type or lookup table.

## Backfills

```sql
-- Batch by primary-key range; each batch is its own short transaction.
UPDATE orders SET source = 'web'
WHERE id > $1 AND id <= $2 AND source IS NULL;
```

- Drive batches from app code or a script: read `min(id)`/`max(id)`, iterate ranges (5k-50k rows), commit per batch, sleep between batches, stop on replication lag (`pg_stat_replication.replay_lag`) or lock waits.
- Do not `UPDATE` the whole table at once: long locks on rows, table bloat (2x), WAL spike, replica lag. Run VACUUM or let autovacuum catch up after large backfills; raise autovacuum aggressiveness for the table temporarily.
- Make the backfill idempotent and resumable (`WHERE col IS NULL`, persisted cursor).
- Use `NOT VALID` constraints and triggers so new rows are already correct while old rows are fixed.

## Expand / contract flow

1. **Expand**: additive, backward-compatible schema (new nullable column/table/index).
2. **Dual-write / read-old**: deploy app that writes both.
3. **Backfill** old rows.
4. **Verify** parity (counts, checksum queries) and flip reads to new.
5. **Contract**: after at least one full deploy cycle with no readers, drop old objects.

Each step is its own release. Rollback is simply redeploying the previous app version.

## TypeScript tooling notes

- Generators (for example Drizzle Kit) emit schema diffs; review the SQL for lock level and add `CONCURRENTLY`, `NOT VALID`, batching by hand. Do not trust an auto-generated `ALTER ... TYPE` or `SET NOT NULL` on large tables.
- Run migrations from a dedicated deploy step with the owner role, not at app boot across N replicas. Guard with `pg_advisory_lock` or the tool's lock table (session lock on a direct connection, not a transaction pooler).
- Connect migrations directly to the primary, bypassing transaction-mode poolers, so session `SET lock_timeout` sticks.
- Keep a `schema_migrations` record; never edit applied migrations.

## Rollout checklist

- [ ] `lock_timeout` + retry; `statement_timeout` set.
- [ ] No table rewrite on a large table (or explicit plan).
- [ ] Indexes built `CONCURRENTLY`; no `INVALID` leftovers.
- [ ] Constraints added `NOT VALID` then validated.
- [ ] Backfill batched, resumable, throttled.
- [ ] Old and new app versions both work with the intermediate schema.
- [ ] Rollback plan; migration tested on a restored production-sized copy.
