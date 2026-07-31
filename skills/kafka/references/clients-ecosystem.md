# Kafka Clients & Ecosystem

## TypeScript clients (preference order)

| Client | Use when | Avoid when |
|---|---|---|
| **`@platformatic/kafka`** (**preferred**) | New Node/TS apps; pure JS; Kafka 3.5–4.2; streams; strong Admin | Node &lt;22.22; need vendor-supported librdkafka client |
| **`@confluentinc/kafka-javascript`** | Need librdkafka fidelity + Confluent support; KafkaJS-compatible API | Pure-JS-only policy; unsupported native prebuild targets |
| **`node-rdkafka`** | Raw librdkafka control | Can’t compile natives; want idiomatic TS |
| **`kafkajs`** | Existing stable apps short-term | **Greenfield** — last stable **2.2.4** (2023), effectively unmaintained |

### Why prefer Platformatic

- Active maintenance; Kafka **4.x** / KIP-848 / transactions in scope.
- Pure TypeScript wire protocol — no native addon; predictable deploys.
- Direct `Producer` / `Consumer` / `Admin`; stream-based consume; `bigint` offsets.
- Migration guide from KafkaJS; published benches claim wins vs KafkaJS and competitive vs rdkafka (lab numbers — verify in your workload).

Community KafkaJS forks (e.g. Charon / `@ousia/kafkajs`) may appear — treat as low-adoption until proven.

## Brokers / platforms (app-code impact)

For simple produce/consume, vendor rarely changes TypeScript code if the Kafka protocol is intact. Feature-test: compaction, transactions, admin APIs, auth, Connect.

| Offering | Notes |
|---|---|
| **Apache Kafka** | Reference; self-manage; KRaft-only on 4.0+ |
| **Confluent Cloud/Platform** | Kafka + Schema Registry, Connect, ksqlDB, support |
| **Amazon MSK** | Real Apache Kafka; IAM auth; MSK Connect |
| **Aiven** | Managed; Karapace SR common |
| **Redpanda** | Kafka API compatible; validate edge admin/Connect |
| **WarpStream** | Kafka protocol clients; check current matrix for compaction/txns limits |

## Connect / Streams / ksqlDB

| Component | Use | Avoid |
|---|---|---|
| **Kafka Connect** | DB/S3/HTTP/CDC connectors | Simple app produce/consume |
| **Kafka Streams** | JVM stateful stream processing | Pulling into Node/TS |
| **ksqlDB** | SQL over streams (Confluent-centric) | When app already owns processing |

**TS apps:** client produce/consume + app logic; Connect as sidecar for integrations.

## Local & CI

- KRaft single-node Docker (`apache/kafka` or Confluent CP) — no ZooKeeper.
- Fix `advertised.listeners` for host vs compose network.
- Dev RF=1; prod RF=3 + `min.insync.replicas=2`.
- Tests: `@testcontainers/kafka` (prefer KRaft) or shared Compose.
- Create topics via Admin in setup.

## Schema registries (pick for the cluster)

- Confluent Schema Registry — largest client ecosystem (license not Apache).
- Karapace — Apache-2.0, Confluent-API-compatible.
- Apicurio — broader artifacts + Confluent compat layer.
- Cloud registries (Glue, etc.) — may diverge on wire/API.

`@platformatic/kafka` experimental Confluent SR support is **non-semver**.
