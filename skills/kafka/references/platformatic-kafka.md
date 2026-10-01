# `@platformatic/kafka` API Reference

Pure TypeScript Kafka protocol client (not a KafkaJS fork, not librdkafka). Snapshot **2.13.0**. Canonical: https://github.com/platformatic/kafka (`README.md`, `docs/`, `migration/`).

## Package facts

| Field | Value |
|---|---|
| npm | `@platformatic/kafka@2.13.0` (`latest`); `v-1.x` tag = 1.x maintenance |
| License | Apache-2.0 |
| Module | ESM only |
| Engines | Node `>=22.22.0 \|\| >=24.6.0` |
| Peers | none |
| Brokers | Kafka **3.5.0–4.2.0** (CI); smoke-tested on Redpanda and Azure Event Hubs |
| Bun | Not in engines/CI — Node is the supported runtime |

`next` dist-tag may lag behind `latest` — ignore for installs.

```sh
bun add @platformatic/kafka
```

## Clients

No shared `Kafka` factory. Construct directly:

```ts
import { Producer, Consumer, Admin } from "@platformatic/kafka"
```

Shared **Base** options: `clientId`, `bootstrapBrokers`, `timeout`, `requestTimeout`, `connectTimeout`, `retries` (default `3`; `true` = infinite), `retryDelay` (default ~1000 ms), `metadataMaxAge`, `autocreateTopics`, `tls`/`ssl`, `sasl`, `metrics`, `context`.

- **Lazy connect** on first op — no `connect()`.
- Shutdown: **`close()`** (streams first, or `close(true)`).
- Methods return Promises; optional Node callback as last arg.

## Producer

```ts
import {
  Producer,
  stringSerializers,
  ProduceAcks,
  compatibilityPartitioner,
} from "@platformatic/kafka"

const producer = new Producer({
  clientId: "my-producer",
  bootstrapBrokers: ["localhost:9092"],
  serializers: stringSerializers,
  idempotent: true,
  transactionalId: "optional-txn-id",
  acks: ProduceAcks.ALL, // ALL=-1, LEADER=1, NO_RESPONSE=0
  compression: "lz4", // none | gzip | snappy | lz4 | zstd
  partitioner: compatibilityPartitioner, // optional KafkaJS/Java parity
})

const result = await producer.send({
  messages: [
    {
      topic: "events",
      key: "user-123",
      value: JSON.stringify({ action: "login" }),
      headers: { source: "web" },
      // partition: 0,
    },
  ],
})
// result.offsets?: { topic, partition, offset: bigint }[]

await producer.close()
```

Also: `asStream({ batchSize, batchTime, ... })` → writable `ProducerStream`; `beginTransaction()`; warm-up helpers (`getSendTopicPartitions`, …).

**Default serializers are noop** → without `serializers` / registry, payloads must be `Buffer`.

Built-ins: `stringSerializer(s)`, `jsonSerializer`, `serializersFrom`, `stringSerializers`.

## Consumer

```ts
import {
  Consumer,
  stringDeserializers,
  MessagesStreamModes,
  FetchIsolationLevels,
  DeserializationErrorActions,
} from "@platformatic/kafka"

const consumer = new Consumer({
  groupId: "my-group",
  clientId: "my-consumer",
  bootstrapBrokers: ["localhost:9092"],
  deserializers: stringDeserializers,
  autocommit: true,
  highWaterMark: 1024,
  groupProtocol: "classic", // or "consumer" (KIP-848)
  sessionTimeout: 60_000,
  heartbeatInterval: 3_000,
  // groupInstanceId: "orders-worker-1",
  // heartbeatStallTimeout: 30_000, // emits consumer:heartbeat:stalled (default: rebalanceTimeout)
})

const stream = await consumer.consume({
  topics: ["my-topic"],
  mode: MessagesStreamModes.EARLIEST, // LATEST | EARLIEST | COMMITTED | MANUAL
  fallbackMode: MessagesStreamModes.LATEST,
  isolationLevel: FetchIsolationLevels.READ_COMMITTED,
  autocommit: false,
  onDeserializationError({ error }) {
    return DeserializationErrorActions.SKIP // or FAIL | CONTINUE (raw bytes + message.metadata.deserializationError)
  },
  // offsets: [{ topic: "my-topic", partition: 0, offset: 10n }], // MANUAL
})

for await (const message of stream) {
  // message.offset: bigint; message.leaderEpoch: number
  // message.headers: Map (last value wins); message.headerEntries: ordered tuples incl. duplicates
  await process(message)
  await message.commit()
}

stream.pause()
stream.resume()
await stream.close()
await consumer.close()
```

Patterns: `stream.on("data")`, async iteration, concurrent processing (`hwp` `forEach`).

Each `consume()` stream has its own fetch pool — long handlers are less likely to starve heartbeats than classic KafkaJS `eachMessage` blocking.

Advanced: `commit()`, `fetch()`, `listOffsets()`, `listCommittedOffsets()`, `getLag()`, lag monitoring start/stop, join/leave group.

Events: `consumer:group:join|leave|rejoin|rebalance`, `consumer:group:autocommit:error` (cooperative rebalance), `consumer:heartbeat:start|end|cancel|error|stalled`, `consumer:lag`.

With `CONTINUE`, always check `message.metadata.deserializationError` before trusting `key` / `value` / `headers` — route those records to a DLQ.

### Rebalance strategy (classic groups)

```ts
import { Consumer, COOPERATIVE_STICKY_ASSIGNOR } from "@platformatic/kafka"

const consumer = new Consumer({
  groupId: "orders",
  bootstrapBrokers: ["localhost:9092"],
  protocols: [{ name: COOPERATIVE_STICKY_ASSIGNOR, version: 3 }], // KIP-429, since 2.12.0
})
```

- Default classic protocol: `roundrobin` v1 (eager, stop-the-world). Cooperative-sticky keeps ownership and moves partitions over a follow-up rebalance; roll it out to **all** members of the group.
- Custom assigners: `partitionAssigner` (built-ins `roundRobinAssigner`, `cooperativeStickyAssigner`) + optional `partitionAssignerTopicsSelector` (2.13.0) to limit which topic metadata the leader fetches.
- `protocols` / `partitionAssigner*` do not apply to `groupProtocol: "consumer"` (KIP-848) — there the broker assigns (`groupRemoteAssignor`).

## Admin

```ts
import { Admin } from "@platformatic/kafka"

const admin = new Admin({
  clientId: "admin",
  bootstrapBrokers: ["localhost:9092"],
})

await admin.createTopics({ topics: ["my-topic"], partitions: 3, replicas: 1 })
await admin.createTopics({
  topics: ["small", { topic: "big", partitions: 24, replicas: 3 }], // per-topic overrides (2.10+)
  partitions: 3,
  replicas: 1,
  configs: [{ name: "cleanup.policy", value: "compact" }],
})
await admin.listTopics()
await admin.metadata({ topics: ["my-topic"] })
await admin.deleteTopics({ topics: ["my-topic"] })
await admin.close()
```

Also: partitions, groups, offsets alter/delete, configs (describe/alter/incremental), ACLs, quotas, log dirs, `deleteRecords`, SCRAM credential APIs.

## Transactions

Requires `idempotent: true` + stable `transactionalId`.

```ts
const tx = await producer.beginTransaction()
try {
  await tx.send({ messages: [{ topic: "out", key: "k", value: "v" }] })
  // await tx.addOffset(...) / addConsumer when committing consume offsets in-txn
  await tx.commit()
} catch {
  await tx.abort()
}
```

For EOS consume→produce: disable autocommit; commit offsets via the transaction, not `message.commit()`. Readers: `READ_COMMITTED`.

## SASL / TLS

```ts
sasl: {
  mechanism: "SCRAM-SHA-256", // PLAIN | SCRAM-SHA-256 | SCRAM-SHA-512 | OAUTHBEARER
  username: "...",
  password: "...",
}
tls: { /* Node TLS options */ }
```

GSSAPI exists in the enum; prefer custom `sasl.authenticate` / verify support rather than assuming first-class Kerberos.

`username` / `password` / `token` may be (async) functions. Reauthentication runs at 80% of the broker session lifetime; tune with `sasl.reauthFraction`, `sasl.reauthLeadTime` (ms), or `sasl.lazyReauthentication: true` (reauth on next request) — added in 2.13.0.

## Serializers & Schema Registry

- Prefer explicit `serializers` / `deserializers`.
- Experimental: `ConfluentSchemaRegistry` (Avro / Protobuf / JSON Schema) — **non-semver**. Import from `@platformatic/kafka` main export (docs show `@platformatic/kafka/registries`, but `package.json` `exports` only exposes `.`).
- Registry client options (2.9+): `tls`, `headers` (object or async function), `timeout` (default 5000 ms), `retries` (default 3), `retryDelay` (ms or function). Consumed messages expose schema IDs in `metadata`.

## Metrics & diagnostics

- Prometheus: `metrics: { client, registry, label? }` (prom-client).
- `diagnostics_channel`: `plt:kafka:producer:sends`, `plt:kafka:consumer:fetches|consumes|commits|...` — see `docs/diagnostic.md`.

## Errors

Prefix `PLT_KFK_*`. Prefer `error.code`, `error.canRetry` (not KafkaJS `retriable`). Types include `NetworkError`, `ProtocolError`, `AuthenticationError`, `TimeoutError`, `UserError`, `MultipleErrors`.

## Good / bad

**Good:** singleton clients; `ProduceAcks.ALL` for durable writes; serializers set; cooperative-sticky or KIP-848 for groups that rebalance often; close streams then clients; recreate stream after fatal retries; `compatibilityPartitioner` when migrating keyed partitions; tune `highWaterMark` for large messages.

**Bad:** new client per request; KafkaJS `connect`/`subscribe`/`run`; assuming Bun is officially supported; leaving without `close()`; blocking CPU on the event loop in handlers; mixing serializers with registry carelessly; claiming EOS without transactions + `READ_COMMITTED`.
