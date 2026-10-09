# Schema, Types, and Constraints

Table of contents: keys, time, numbers, text, JSONB, enums vs lookup tables, generated columns, constraints, modeling habits.

Version tags: PG18 features are marked. Offer the older fallback when the project is on 14-17.

## Primary keys

| Choice | Use when | Notes |
|---|---|---|
| `bigint GENERATED ALWAYS AS IDENTITY` | Default for internal tables | Compact, ordered, fast. Sequence gaps are normal (rollbacks, crashes). Not gapless. |
| `uuid DEFAULT uuidv7()` (PG18) | IDs created by clients or exposed in URLs, multi-writer, sharding later | Time-ordered: good index locality, like a sequence. Leaks creation time (ms). `uuid_extract_timestamp(id)` reads it. `uuidv7(interval '-1 day')` shifts the timestamp (tests, backfills). |
| `uuid DEFAULT gen_random_uuid()` / `uuidv4()` (PG18 alias) | Unguessable tokens, small tables | Random order scatters inserts across the index, bloats it, and adds WAL for full-page writes on big tables. |
| `serial` / `bigserial` | Legacy only | Use identity in new schemas. Identity owns its sequence and is SQL-standard. |

```sql
CREATE TABLE orders (
  id          uuid PRIMARY KEY DEFAULT uuidv7(),
  customer_id bigint NOT NULL REFERENCES customers (id),
  total       numeric(12,2) NOT NULL CHECK (total >= 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

- Before PG18, generate UUIDv7 in the app (library) or use an extension; do not hand-roll bit-twiddling SQL in migrations.
- Use the native `uuid` type (16 bytes), never `text`, for UUIDs.
- `GENERATED ALWAYS` rejects explicit values unless `OVERRIDING SYSTEM VALUE`. After bulk-loading explicit ids, run `SELECT setval(pg_get_serial_sequence('t','id'), max(id)) FROM t;`.
- Natural keys: fine as `UNIQUE`, rarely as the PK that other tables reference.
- Composite PKs for join tables (`PRIMARY KEY (a_id, b_id)`) and an index on the reverse order if queried that way.

## Time

- `timestamptz` for every instant. It stores UTC; the session `TimeZone` only affects display and input parsing. `timestamp` (no tz) silently drops zone intent.
- `date` for calendar dates, `interval` for durations, `tstzrange` / `daterange` for periods.
- `now()` is the transaction start time (constant inside a transaction). `clock_timestamp()` moves. `statement_timestamp()` is per statement.
- Store user timezone as an IANA name (`text`), not an offset. Convert at the edge: `ts AT TIME ZONE 'Europe/Berlin'`.
- Do not use `timetz`.
- Update stamps: use a trigger or `SET updated_at = now()` in the app layer consistently. ORM `$onUpdate` hooks do not fire for raw SQL.

## Numbers

- `numeric(p,s)` for money and exact decimals; or `bigint` minor units plus a currency code. `real`/`double precision` only for measurements.
- `integer` vs `bigint`: pick `bigint` for ids and counters that can pass 2.1 billion. Changing `int` to `bigint` later rewrites the table.
- JS: `numeric` and `int8` arrive as strings by default in `pg` and `Bun.SQL`. Parse with a decimal library, not `Number()`, for money.

## Text

- `text` for strings. Enforce length with `CHECK (char_length(name) <= 200)` (cheap to change with `NOT VALID`). `varchar(n)` and `char(n)` offer no performance gain.
- Case-insensitive uniqueness: `CREATE UNIQUE INDEX ON users (lower(email));` or `citext`. Normalize at write time.
- Collation matters for index order and `LIKE`. PG17 added the `builtin` provider (`C.UTF-8`) for stable, fast, locale-independent ordering. Changing collation versions requires `REINDEX`.
- PG18: full-text search and `pg_trgm` use the cluster default collation provider. After `pg_upgrade` with ICU/builtin collations, reindex those indexes.

## JSONB

- Use `jsonb` (not `json`) for sparse attributes, webhooks payloads, and user-defined fields. Keep keys you filter, join, sort, or constrain as real columns.
- Query: `data->>'k'` (text), `data->'k'` (jsonb), `data @> '{"k":"v"}'` (containment, GIN-friendly), `jsonb_path_exists`. PG17 added SQL/JSON `JSON_TABLE`, `JSON_VALUE`, `JSON_QUERY`.
- Index: GIN `(data)` for `@>`/`?`; `jsonb_path_ops` is smaller and faster for `@>` only; a btree expression index `((data->>'k'))` for a hot equality or sort key.
- Updating one key rewrites the whole value (and TOAST). Wide, hot-updated JSONB bloats.
- Validate shape with `CHECK (jsonb_typeof(data) = 'object')` and app-side schemas (Zod, Valibot). Add constraints for required keys when they matter.
- Do not store arrays of foreign keys in JSONB when you need referential integrity. Use a join table.
- PG19 beta: `json_array()` over zero rows returns `[]`, not `NULL`.

## Enums vs lookup tables vs CHECK

| Option | Good for | Costs |
|---|---|---|
| `CREATE TYPE ... AS ENUM` | Small, stable, ordered sets (`status`) | `ALTER TYPE ... ADD VALUE` is easy (new value usable after commit); you cannot drop or reorder values; app/ORM sync needed. |
| `text` + `CHECK (col IN (...))` | Sets that change occasionally | Change = add new check `NOT VALID`, validate, drop old. No extra join. |
| Lookup table + FK | Values with attributes, i18n labels, or runtime-editable sets | Extra join or app cache; strongest integrity. |

Default: lookup table for business-owned sets, `text + CHECK` for small internal states, enum when the set is truly stable. Mirror values in TS as a `const` union derived from one source.

## Generated columns

- `GENERATED ALWAYS AS (expr) STORED`: computed on write, takes space, can be indexed, usable for FTS `tsvector`.
- PG18 `VIRTUAL` (the PG18 default when unspecified): computed on read, no storage, **cannot be indexed**, built-in types and immutable functions only. Always write `STORED` or `VIRTUAL` explicitly.
- Generated columns cannot have defaults, cannot be partition keys, and cannot reference other generated columns or other tables.
- `GENERATED ALWAYS AS IDENTITY` is a different feature (sequences).

```sql
ALTER TABLE articles ADD COLUMN search tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,''))) STORED;
```

Adding a `STORED` generated column rewrites the table. Use an expand step (plain column + trigger/app write + backfill) on big tables.

## Constraints

- `NOT NULL` by default on new columns; use `DEFAULT` for safe adds. PG18 stores not-null in `pg_constraint` (named, can be `NOT VALID`).
- `CHECK` for row-level rules (`CHECK (ends_at > starts_at)`). PG18 allows `NOT ENFORCED` for `CHECK`/FK (documentation use; not validated).
- `UNIQUE` with `NULLS NOT DISTINCT` (PG15) when NULL should collide. Partial unique indexes for soft delete: `CREATE UNIQUE INDEX ON users (email) WHERE deleted_at IS NULL;`.
- Foreign keys: pick `ON DELETE` deliberately (`NO ACTION` is the default, `RESTRICT`, `CASCADE` for owned children, `SET NULL` for optional links). Index the referencing column. `DEFERRABLE INITIALLY DEFERRED` for circular inserts.
- Exclusion constraints stop overlaps: `EXCLUDE USING gist (room_id WITH =, during WITH &&)` (needs `btree_gist` for `=` on scalars). PG18 adds temporal keys:

```sql
CREATE TABLE booking (
  room_id int NOT NULL,
  during  tstzrange NOT NULL,
  PRIMARY KEY (room_id, during WITHOUT OVERLAPS)
);
```

- Map SQLSTATE in code: `23505` unique, `23503` foreign key, `23502` not null, `23514` check, `23P01` exclusion. Return domain errors, not raw messages.

## Modeling habits

- `snake_case`, lowercase, unquoted identifiers. Avoid reserved words and quoted mixed case.
- One schema per concern when helpful (`app`, `audit`); keep `public` free of app objects if roles are strict.
- Soft delete (`deleted_at`) forces partial indexes and filters everywhere; prefer hard delete plus an archive/audit table unless the product needs undelete.
- Multi-tenant: `tenant_id` on every table, composite indexes start with `tenant_id`, composite FKs `(tenant_id, parent_id)` prevent cross-tenant links; add RLS as defense in depth.
- Audit/history: trigger-written audit table or temporal ranges, not overloaded JSONB on the main row.
- Use `RETURNING` (PG18 also `RETURNING OLD.col, NEW.col`) instead of a second SELECT.
- Document intent with `COMMENT ON` for non-obvious columns.
