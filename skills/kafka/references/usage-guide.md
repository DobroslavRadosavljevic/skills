# Kafka Usage Guide (TypeScript)

Day-to-day produce/consume/admin with **`@platformatic/kafka`** (snapshot **2.8.0**). Canonical docs: GitHub README + `docs/` (no separate docs site).

## Install

```sh
bun add @platformatic/kafka
```

Runtime: Node **`>=22.22` or `>=24.6`**. Brokers: Apache Kafka **3.5.0–4.2.0** (CI vs Confluent Platform 7.5–8.2). Pure JS — no native addon. Bun may run it, but engines/CI are Node-only.

Prefer this package for new TS apps. Do not start greenfield on `kafkajs`.

## Mental model (not KafkaJS)

| KafkaJS | `@platformatic/kafka` |
|---|---|
| `new Kafka().producer()` | `new Producer({})` |
| `brokers` | `bootstrapBrokers` |
| `connect` / `disconnect` | lazy connect + `close()` |
| `subscribe` + `run` | `consume()` → `MessagesStream` |
| `fromBeginning: true` | `mode: MessagesStreamModes.EARLIEST` |
| string offsets | `bigint` |
| headers as object | consume: **`Map`** |

## Producer

```ts
import { Producer, stringSerializers, ProduceAcks } from "@platformatic/kafka"

const producer = new Producer({
  clientId: "orders-api",
  bootstrapBrokers: ["localhost:9092"],
  serializers: stringSerializers,
  acks: ProduceAcks.ALL,
  compression: "lz4",
  idempotent: true,
})

await producer.send({
  messages: [
    {
      topic: "orders.created",
      key: "order-123",
      value: JSON.stringify({ id: "order-123", total: 42 }),
      headers: { "correlation-id": "abc" },
    },
  ],
})

await producer.close()
```

- One long-lived producer per process (or pipeline), not per request.
- Without `serializers`, key/value/headers must be `Buffer`.
- Multi-topic batches: pass many items in `messages`.
- Optional `compatibilityPartitioner` for KafkaJS/Java key→partition parity.
- Writable stream: `producer.asStream({ ... })` then close streams before `close()`, or `close(true)`.

## Consumer

```ts
import {
  Consumer,
  stringDeserializers,
  MessagesStreamModes,
} from "@platformatic/kafka"

const consumer = new Consumer({
  groupId: "orders-worker",
  clientId: "orders-worker-1",
  bootstrapBrokers: ["localhost:9092"],
  deserializers: stringDeserializers,
})

const stream = await consumer.consume({
  topics: ["orders.created"],
  mode: MessagesStreamModes.COMMITTED, // or EARLIEST / LATEST / MANUAL
  fallbackMode: MessagesStreamModes.EARLIEST,
  autocommit: false,
})

for await (const message of stream) {
  // message.offset is bigint; message.headers is Map
  await handle(message)
  await message.commit()
}

await stream.close()
await consumer.close()
```

Other consume styles: `stream.on("data", ...)`, or concurrent `forEach` from `hwp`.

| Mode | Meaning |
|---|---|
| `LATEST` | New messages only (default) |
| `EARLIEST` | From earliest available |
| `COMMITTED` | Resume group offsets |
| `MANUAL` | Explicit `offsets: [{ topic, partition, offset: 10n }]` |

- `autocommit: true` | `false` | interval ms.
- Manual commit after successful processing = at-least-once.
- Keep handlers fast relative to session/heartbeat; raise timeouts carefully rather than blocking forever.
- `highWaterMark` default is aggressive (1024) — lower for large payloads.
- Optional `groupProtocol: "consumer"` for KIP-848 (Kafka 4.0+); `"classic"` otherwise. Static membership: `groupInstanceId`.

## Admin

```ts
import { Admin } from "@platformatic/kafka"

const admin = new Admin({
  clientId: "orders-admin",
  bootstrapBrokers: ["localhost:9092"],
})

await admin.createTopics({
  topics: ["orders.created"],
  partitions: 6,
  replicas: 1, // local; use 3 in multi-broker prod
})

await admin.close()
```

Also: list/delete topics, partitions, groups, offsets, configs, ACLs, delete records, quotas, etc.

## Security sketch

```ts
const producer = new Producer({
  clientId: "secure-producer",
  bootstrapBrokers: ["broker.example:9093"],
  serializers: stringSerializers,
  tls: { /* Node TLS options */ },
  sasl: {
    mechanism: "SCRAM-SHA-256", // PLAIN | SCRAM-SHA-256 | SCRAM-SHA-512 | OAUTHBEARER
    username: process.env.KAFKA_USER!,
    password: process.env.KAFKA_PASSWORD!,
  },
})
```

Prefer TLS + SCRAM/OAUTH over PLAINTEXT. ACLs: least privilege per principal (topic, group, transactional-id).

## Transactions (EOS Kafka↔Kafka)

```ts
import {
  Producer,
  Consumer,
  stringSerializers,
  stringDeserializers,
  FetchIsolationLevels,
} from "@platformatic/kafka"

const producer = new Producer({
  clientId: "txn-producer",
  bootstrapBrokers: ["localhost:9092"],
  serializers: stringSerializers,
  idempotent: true,
  transactionalId: "orders-worker-txn", // stable across restarts
})

const transaction = await producer.beginTransaction()
try {
  await transaction.send({
    messages: [{ topic: "orders.processed", key: "order-123", value: "ok" }],
  })
  // When consuming: transaction.addOffset(...) — not message.commit()
  await transaction.commit()
} catch {
  await transaction.abort()
}
```

Consumers reading transactional topics: `isolationLevel: FetchIsolationLevels.READ_COMMITTED` and usually `autocommit: false`.

## Local / tests

- Prefer **KRaft** single-node images (`apache/kafka` / Confluent CP) — no ZooKeeper.
- Fix **`advertised.listeners`** for host vs Docker network.
- Single broker: RF=1 for topics / internal topics as required.
- Integration tests: `@testcontainers/kafka` (KRaft when available) or Compose for shared stacks.
- Create topics via Admin in setup; do not rely on autocreate in shared envs.

## Graceful shutdown

1. Stop accepting work; close consumer streams (`stream.close()`).
2. `consumer.close()` (or `close(true)` to force-close open streams).
3. Flush/close producer; close admin.
4. Handle SIGTERM — missing leave-group → long rebalance on next start.

## Errors

- Codes prefix `PLT_KFK_*` (`NetworkError`, `ProtocolError`, `AuthenticationError`, `TimeoutError`, …).
- KafkaJS `error.retriable` → `error.canRetry`.
- After exhausted retries, recreate the consume stream (do not leave a dead stream hanging).

## Checklist (ship)

- [ ] `@platformatic/kafka` + matching Node engine
- [ ] Stable `clientId` / `groupId`; keys for ordered entities
- [ ] `ProduceAcks.ALL` for durable writes; compression on
- [ ] Idempotent handlers (or real transactions when required)
- [ ] Commit after process when manual; DLQ for poison pills
- [ ] Lag alerts; `close()` on shutdown
- [ ] TLS/SASL + ACLs in non-dev
