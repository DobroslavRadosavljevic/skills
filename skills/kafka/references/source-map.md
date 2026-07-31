# Source Map

Research snapshot: **2026-07-31**.

## Versions

- `@platformatic/kafka` npm `latest`: **2.8.0** (Effectively the preferred TS client)
- Engines: Node `>=22.22.0 || >=24.6.0`
- Broker support (Platformatic CI): Apache Kafka **3.5.0–4.2.0**; Confluent Platform **7.5.0–8.2.0**
- Apache Kafka **4.0+**: KRaft-only (ZooKeeper removed)
- `kafkajs` npm `latest`: **2.2.4** (do not use for new work)

## Canonical docs

1. Platformatic Kafka README: https://github.com/platformatic/kafka/blob/main/README.md
2. API docs tree: https://github.com/platformatic/kafka/tree/main/docs
3. KafkaJS migration: https://github.com/platformatic/kafka/blob/main/migration/README.md
4. KIPs implemented: https://github.com/platformatic/kafka/blob/main/docs/kips.md
5. npm: https://www.npmjs.com/package/@platformatic/kafka
6. Apache Kafka docs (concepts): https://kafka.apache.org/documentation/#intro_concepts
7. Kafka 4.0 announcement: https://kafka.apache.org/blog/2025/03/18/apache-kafka-4.0.0-release-announcement/
8. Consumer rebalance protocol (KIP-848): https://kafka.apache.org/43/operations/consumer-rebalance-protocol/
9. Topic configs: https://kafka.apache.org/43/configuration/topic-configs/
10. Producer configs: https://kafka.apache.org/43/configuration/producer-configs/

## Refresh commands

```sh
bun info @platformatic/kafka
# or
npm view @platformatic/kafka version engines dist-tags
```

Context7 library id when available: `/platformatic/kafka`.

## Stale-doc traps

- No dedicated Platformatic Kafka product docs site — **GitHub is truth**.
- npm `next` tag may be older than `latest`.
- README registry subpath imports may conflict with package `exports` — prefer main package exports.
- Third-party broker comparison blogs often lag on WarpStream/compaction/txns — prefer vendor protocol matrices.
- KafkaJS guides do not map 1:1 onto `@platformatic/kafka` APIs.
