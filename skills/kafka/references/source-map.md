# Source Map

Research snapshot: **2026-10-01**.

## Versions

- `@platformatic/kafka` npm `latest`: **2.13.0** (2026-10-01; the preferred TS client). Other tags: `v-1.x` → 1.35.0 (maintenance line), `next` → 2.10.0-alpha.1 (older than `latest` — ignore)
- Engines: Node `>=22.22.0 || >=24.6.0`
- Broker support (Platformatic README/CI): Apache Kafka **3.5.0–4.2.0**; Confluent Platform **7.5.0–8.2.0**. Regression smoke tests also run against Redpanda and Azure Event Hubs (since 2.12.0)
- Apache Kafka upstream: **4.3.x** (4.3.0 released 2026-05-22; 4.3.1 current). 4.2.0 (2026-02-17) made share groups (KIP-932) production-ready and the Streams rebalance protocol (KIP-1071) GA with a limited feature set
- Apache Kafka **4.0+**: KRaft-only (ZooKeeper removed)
- `@confluentinc/kafka-javascript` npm `latest`: **1.10.1**; `node-rdkafka`: **3.6.1**
- `kafkajs` npm `latest`: **2.2.4** (do not use for new work)

## Canonical docs

1. Platformatic Kafka README: https://github.com/platformatic/kafka/blob/main/README.md
2. API docs tree: https://github.com/platformatic/kafka/tree/main/docs
3. KafkaJS migration: https://github.com/platformatic/kafka/blob/main/migration/README.md
4. KIPs implemented: https://github.com/platformatic/kafka/blob/main/docs/kips.md
5. npm: https://www.npmjs.com/package/@platformatic/kafka
   - Releases (feature changelog): https://github.com/platformatic/kafka/releases
6. Apache Kafka docs (concepts): https://kafka.apache.org/documentation/#intro_concepts
7. Kafka 4.0 announcement: https://kafka.apache.org/blog/2025/03/18/apache-kafka-4.0.0-release-announcement/
8. Consumer rebalance protocol (KIP-848): https://kafka.apache.org/43/operations/consumer-rebalance-protocol/
9. Topic configs: https://kafka.apache.org/43/configuration/topic-configs/
10. Producer configs: https://kafka.apache.org/43/configuration/producer-configs/

## Platformatic changes since 2.8.0

- 2.9.0: Schema Registry `headers` / `timeout` / `retries` / `retryDelay` / `tls`; consumed key/value schema IDs + original byte lengths in metadata; soft-fail registry decode errors.
- 2.10.0: `DeserializationErrorActions.CONTINUE` path + before-deserialization hook errors reported to `onDeserializationError`; IPv6 bootstrap brokers; `message.leaderEpoch`; per-topic overrides in `admin.createTopics`; `consumer:heartbeat:stalled` event (`heartbeatStallTimeout`); duplicate headers kept in `message.headerEntries`.
- 2.12.0: KIP-429 cooperative-sticky assignment (`COOPERATIVE_STICKY_ASSIGNOR`, `cooperativeStickyAssigner`); asynchronous gzip compression (off the event loop); consumer lag refreshed after manual commits; close after broker disconnect fixed.
- 2.13.0: `partitionAssignerTopicsSelector` for custom assigners; SASL reauthentication tuning (`reauthFraction`, `reauthLeadTime`, `lazyReauthentication`); stale fetches discarded after offset refresh; better retriable-error detection.

## Refresh commands

```sh
bun info @platformatic/kafka
# or
npm view @platformatic/kafka version engines dist-tags
```

Context7 library id when available: `/platformatic/kafka`.

## Stale-doc traps

- No dedicated Platformatic Kafka product docs site — **GitHub is truth**.
- npm `next` tag may be older than `latest` (currently 2.10.0-alpha.1 vs 2.13.0).
- Kafka docs URLs are versioned (`/43/` = 4.3); bump the segment when upstream moves.
- README registry subpath imports may conflict with package `exports` — prefer main package exports.
- Third-party broker comparison blogs often lag on WarpStream/compaction/txns — prefer vendor protocol matrices.
- KafkaJS guides do not map 1:1 onto `@platformatic/kafka` APIs.
