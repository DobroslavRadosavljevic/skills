# Kafka Fundamentals

Agent-actionable broker semantics for TypeScript apps. Prefer current Apache Kafka docs for version-specific defaults (Kafka **4.0+** is KRaft-only).

## Core objects

| Concept | Meaning |
|---|---|
| **Topic** | Named durable append-only log; multi-producer / multi-subscriber |
| **Partition** | Ordered sequence within a topic; unit of parallelism and ordering |
| **Offset** | Monotonic position in a partition (logical message id) |
| **Broker** | Server storing replicas and serving produce/fetch |
| **Cluster** | Brokers + controllers (KRaft) |
| **Leader** | Replica that accepts writes/reads for a partition |
| **ISR** | In-sync replicas eligible for leadership / `acks=all` durability |
| **Replication factor (RF)** | Copies per partition; production default **3** |

**Durability triad:** RF=3, `min.insync.replicas=2`, producer `acks=all` / `ProduceAcks.ALL`. If ISR size &lt; `min.insync.replicas`, produces fail (`NotEnoughReplicas*`).

**Parallelism:** max useful members in a consumer group ≈ partition count. Extra members idle.

## Produce / consume / groups

- **Producer** writes records: key, value, headers, timestamp → partition.
- **Consumer** reads partitions; usually joins a **consumer group**.
- Within a group, each partition is assigned to **one** member (competing consumers).
- Separate groups independently read the same topic (fan-out).
- **Rebalance** on membership/subscription/metadata change.

**Rebalance protocols:**

- **Classic / cooperative sticky** — prefer cooperative over eager stop-the-world.
- **KIP-848** (`group.protocol=consumer`, GA Kafka 4.0): server-side assignors; incremental. Enable when client + brokers support it (`groupProtocol: "consumer"` in `@platformatic/kafka`).
- **Static membership** (`group.instance.id` / `groupInstanceId`): fewer rebalances on rolling restarts.

## Keys, partitioning, order

- Same key → same partition (default hash) → **strict order per key**.
- No key → spread across partitions → **no cross-partition order**.
- **Guarantee:** order is **per partition only**, never topic-wide.
- Changing partition count **reshuffles** key→partition mapping for new produces. Size partitions early.

## Delivery semantics

| Semantic | How | Use |
|---|---|---|
| **At-most-once** | No retries / `acks=0`, or commit before process | Loss OK |
| **At-least-once** | Retries + commit after process | **Default**; handlers must be idempotent |
| **Exactly-once (EOS)** | Idempotent producer + **transactions** + `read_committed` consumers | Kafka↔Kafka pipelines |

**Idempotent producer:** PID + per-partition sequences; broker dedupes retries. Needs `acks=all`, retries enabled. Scope = producer session (restart → new PID → possible dups across restarts without transactions).

**Transactions:** atomic multi-partition produce + offset commit. Consumers with `isolation.level=read_committed` / `FetchIsolationLevels.READ_COMMITTED` skip aborted txns.

App-level “resend on timeout” can defeat idempotence — prefer client retries.

## Acks, batching, compression

| Setting | Meaning |
|---|---|
| `acks=0` / `NO_RESPONSE` | Fire-and-forget |
| `acks=1` / `LEADER` | Leader only |
| `acks=all` / `ALL` | All ISR — durable default for important data |
| linger / batch size | Throughput ↑, latency ↑ |
| compression | `snappy` / `lz4` / `zstd` / `gzip` — usually worth enabling |

## Retention, compaction, tombstones

- Log stored in **segments**. Retention/deletion is segment-granular.
- **`cleanup.policy=delete`** (default): drop by `retention.ms` / `retention.bytes`.
- **`cleanup.policy=compact`**: keep latest value **per key** (changelog / CQRS). Requires keys.
- **`compact,delete`**: compact and age out.
- **Tombstone:** key + **null** value; retained for `delete.retention.ms` so consumers see deletes, then removed.

## Consumer commit & poll health

- **Auto-commit:** easy; risk of skip/dup on crash mid-batch.
- **Manual commit after success:** at-least-once.
- **`max.poll.interval.ms`** (classic): max gap between polls; slow processing → rebalance. Fix: faster handlers, smaller batches, pause/resume, or raise carefully.
- Heartbeat / session timeouts: liveness (classic protocol).

## Schemas (conceptual)

Central Schema Registry + compatibility checks; wire format often magic byte + schema id + payload.

| Format | Notes |
|---|---|
| Avro | Strong evolution; common in Kafka ecosystems |
| Protobuf | Compact; multi-lang |
| JSON Schema | Readable; larger |

Registries: Confluent Schema Registry (de facto API), Karapace (compatible), Apicurio, cloud variants. Match wire format to the registry. `@platformatic/kafka` has **experimental** Confluent SR helpers — treat as non-semver.

## KRaft vs ZooKeeper

- Kafka **4.0** (2025): **ZooKeeper removed**; **KRaft-only**.
- Migrate ZK→KRaft on a bridge release before 4.x.
- New clusters in 2026: assume KRaft. Do not treat ZooKeeper as current default.
- Protocol floors rose in 4.0 — verify old clients.

## Ports & security (convention)

| Port | Typical |
|---|---|
| 9092 | Client PLAINTEXT / primary (dev) |
| 9093+ | TLS / SASL / extra listeners |
| 8081 | Schema Registry |
| 8083 | Connect REST |

Layers: **TLS** → **SASL** (PLAIN, SCRAM, OAUTHBEARER, GSSAPI) and/or **mTLS** → **ACLs**. Prefer TLS 1.2+; no PLAINTEXT on public networks. Managed clouds often map IAM/API keys to SASL.
