---
name: kafka
description: "Build, review, debug, configure, migrate, teach, or plan Apache Kafka work from TypeScript with current docs. Prefer @platformatic/kafka as the TS SDK (Producer, Consumer, Admin, bootstrapBrokers, consume streams, ProduceAcks, transactions). Use for topics, partitions, consumer groups, offsets, acks, idempotence, EOS, compaction, retention, SASL/TLS, Schema Registry concepts, KRaft, Kafka 4.x, kafkajs migration, DLQ/outbox patterns, and broker ops that affect app produce/consume."
---

# Apache Kafka (TypeScript)

Use this skill for Kafka produce/consume/admin work driven from TypeScript/Node: prefer **`@platformatic/kafka`**, plus broker semantics, topic design, delivery guarantees, and ops that change app code.

## Workflow

1. Inspect the local surface:
   - Package: **`@platformatic/kafka`** (snapshot **2.8.0**). Engines: Node **`>=22.22` or `>=24.6`**. Kafka brokers **3.5–4.2** (KRaft-only on Kafka **4.0+**).
   - Clients: `Producer` / `Consumer` / `Admin` with `bootstrapBrokers` (not KafkaJS `brokers`).
   - Topics: partitions, keys, RF / `min.insync.replicas`, cleanup policy.
   - Semantics: at-least-once vs EOS; auto vs manual commit; `ProduceAcks`.
2. For day-to-day how-to, follow [usage-guide.md](references/usage-guide.md) first.
3. Refresh docs when versions drift. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Concepts (partitions, groups, retention, EOS): [fundamentals.md](references/fundamentals.md).
   - `@platformatic/kafka` API, serializers, streams, txns, SASL: [platformatic-kafka.md](references/platformatic-kafka.md).
   - Design, DLQ, outbox, monitoring: [patterns-ops.md](references/patterns-ops.md).
   - Client landscape & brokers: [clients-ecosystem.md](references/clients-ecosystem.md).
5. Prefer **`@platformatic/kafka`** over `kafkajs` (unmaintained) and over native `node-rdkafka` unless librdkafka is required. Do not invent KafkaJS `connect`/`subscribe`/`run` APIs on Platformatic.
6. Verify with focused produce/consume smokes, Admin topic create when needed, lag awareness, and `close()` on shutdown.

## Core Judgment

- Kafka is an **append-only partitioned log**. Ordering is **per partition** only; parallelism ceiling for a group = partition count.
- Default app semantic: **at-least-once** + **idempotent handlers**. Use transactions/`READ_COMMITTED` only when you need Kafka↔Kafka EOS.
- Durability triad: RF=3, `min.insync.replicas=2`, producer **`ProduceAcks.ALL`** (+ idempotent producer when available).
- Keys: stable entity ids for order/partitioning. Compaction requires keys + tombstones (`null` value).
- Prefer **outbox/CDC** over dual-write (DB + Kafka in one request).
- Poison pills: retry/DLQ then commit — never block a partition forever.
- Platformatic: long-lived clients; lazy connect; **`close()`**; consume via **`consume()` → stream** (`for await` / `data` / concurrent `forEach`); offsets are **`bigint`**; headers on consume are a **`Map`**.
- Pass **`serializers` / `deserializers`** (e.g. `stringSerializers`) — default expects `Buffer`.
- Kafka **4.0+** is **KRaft-only** (no ZooKeeper). Local/dev: fix `advertised.listeners`.
- Prefer **`bun` / `bunx`** in command examples; runtime must still satisfy Node engines for `@platformatic/kafka`.

## Verification

Prefer repository-owned commands. For meaningful Kafka work, cover the relevant subset:

- `bun pm ls @platformatic/kafka` and Node ≥22.22 (or ≥24.6).
- Smoke: Admin `createTopics` (or existing topic), `Producer.send`, `Consumer.consume` + process + `close()`.
- Durability: `ProduceAcks.ALL`; idempotence/`transactionalId` when claiming EOS.
- Consumer: correct `groupId`, mode (`EARLIEST`/`LATEST`/`COMMITTED`), commit-after-process when `autocommit: false`.
- Security: TLS + SASL (or mTLS); no PLAINTEXT on public networks.
- Ops: consumer lag, under-replicated partitions, hot-key skew, rebalance storms (`max.poll` / processing time).

Report which checks ran, which did not, and broker/version assumptions that remain.
