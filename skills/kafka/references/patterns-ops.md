# Kafka Patterns & Operations

## Topic design

**Good**

- Names: `{domain}.{entity}.{event}` or `{env}.{service}.{topic}` — lowercase, `.` or `-`.
- Partition count sized for **peak parallelism / throughput**, with headroom. Increasing later is possible but **reshuffles keys**.
- Keys: stable entity ids when order or co-location matters.

**Bad**

- One mega-topic for unrelated domains.
- Random high-cardinality keys when per-entity order is required.
- Thousands of idle partitions (metadata/rebalance cost).

## Compaction vs retention

| Use | Policy |
|---|---|
| Audit / temporal event log | `delete` + retention window |
| CQRS changelog / latest state per key | `compact` (keys required) |
| Bounded state history | `compact,delete` |

Tombstones (`null` value) delete keys under compaction.

## Hot partitions & poison pills

- **Hot partition:** skewed keys (one tenant dominates). Mitigate: better keys, sub-sharding (`tenantId:shard`), or redistribute in a processor.
- **Poison pill:** record always fails → blocks the partition if you retry forever.
  - Catch → retry count header → **retry topic / DLQ** → **commit** original offset.
  - Alert on DLQ depth.

## Outbox / CDC vs dual-write

**Dual-write (DB + Kafka in app request) is bad** — no shared transaction → lost or duplicate events.

| Pattern | When |
|---|---|
| **Transactional outbox** | Curated business events; DB txn writes row + outbox |
| **CDC (e.g. Debezium)** | Table replication / lakes; watch schema leakage |
| **Outbox + CDC EventRouter** | Curated events + log-tail relay |
| **Kafka transactions** | Kafka↔Kafka only — **does not** fix DB+Kafka |

Outbox/CDC ⇒ **at-least-once** ⇒ consumers must be idempotent.

## Delivery defaults for apps

1. Default: **at-least-once** + idempotent handlers (dedupe by business id or topic-partition-offset).
2. Producer: `ProduceAcks.ALL`, retries, compression, keys when needed.
3. Consumer: commit **after** successful process (or carefully tuned autocommit).
4. EOS: only when Kafka↔Kafka atomicity is required — `idempotent` + `transactionalId` + `READ_COMMITTED`.

## Monitoring signals

- **Consumer lag** (group × partition) — primary app SLO.
- Under-replicated partitions / ISR shrink — durability risk.
- Produce error rate, request latency, rebalance rate.
- Disk / controller (KRaft) health on self-managed clusters.
- Connect/CDC: connector lag, replication slots.

## Failure modes (debug checklist)

1. Can’t connect → `bootstrapBrokers` / `advertised.listeners` (Docker classic).
2. `UNKNOWN_TOPIC_OR_PARTITION` → missing topic / autocreate off.
3. `NOT_ENOUGH_REPLICAS` → ISR &lt; `min.insync.replicas`.
4. Rebalance storm → processing too slow; short-lived members; missing static membership.
5. Duplicates → at-least-once without idempotent consumer; producer restart without txn.
6. Missing messages → commit-before-process; retention elapsed; wrong `groupId`.
7. Skewed lag → hot key.
8. Auth failures → SASL/TLS/ACL mismatch.
9. Schema errors → incompatible evolution / wrong subject strategy.
10. Slow consume → fetch settings, heavy deserialize, sync I/O in poll/stream loop.

Tools: `kafka-topics.sh --describe`, `kafka-consumer-groups.sh --describe`, broker logs, UI lag views, console produce/consume to isolate app vs cluster. Popular CLIs: bundled Kafka scripts, **kafkactl** (deviceinsight — not the Michelin GitOps tool of the same name). UIs: Redpanda Console, Kafbat UI, Conduktor.

## Production checklists

### Producer

- [ ] `ProduceAcks.ALL`; idempotence on when supported
- [ ] Bound delivery/request timeouts; handle send errors
- [ ] linger/batch + compression tuned
- [ ] Keys + tracing headers
- [ ] Schema/compat policy if using a registry
- [ ] Stable `transactionalId` if using EOS

### Consumer

- [ ] Distinct `groupId` per logical subscriber
- [ ] Commit after success (or intentional autocommit)
- [ ] Idempotent handlers + DLQ policy
- [ ] Session/heartbeat / processing time coherent
- [ ] Cooperative rebalance or KIP-848 when available
- [ ] Static membership for K8s rolling deploys
- [ ] Lag alerts; `READ_COMMITTED` if producers use transactions

### Security

- [ ] No public PLAINTEXT
- [ ] TLS + validated certs
- [ ] SCRAM/OAUTH/IAM (avoid long-lived PLAIN where possible)
- [ ] ACLs least privilege (topic, group, transactional-id)
- [ ] Secrets not baked into images
- [ ] Registry auth locked down
