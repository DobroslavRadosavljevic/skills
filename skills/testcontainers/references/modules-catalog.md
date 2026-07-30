# Modules Catalog

Cross-language registry: https://testcontainers.com/modules/

Prefer an official module when it exists for the project's language. Fall back to generic containers + wait strategies otherwise.

Coverage changes frequently — re-check the catalog and language module dirs when unsure.

## Common dependencies

| Technology | Node `@testcontainers/` | Java `testcontainers-` | Python import | Go `modules/` |
| --- | --- | --- | --- | --- |
| PostgreSQL | `postgresql` | `postgresql` | `postgres` | `postgres` |
| MySQL | `mysql` | `mysql` | `mysql` | `mysql` |
| MariaDB | `mariadb` | `mariadb` | — / MySQL patterns | `mariadb` |
| MSSQL | `mssqlserver` | `mssqlserver` | `mssql` | `mssql` |
| Oracle | `oraclefree` | `oracle-free` / `oracle-xe` | `oracle` extras | check catalog |
| Redis | `redis` | GenericContainer often | `redis` | `redis` |
| Valkey | `valkey` | check catalog | check catalog | `valkey` |
| MongoDB | `mongodb` | `mongodb` | `mongodb` | `mongodb` |
| Elasticsearch | `elasticsearch` | `elasticsearch` | `elasticsearch` | `elasticsearch` |
| OpenSearch | `opensearch` | check catalog | `opensearch` | `opensearch` |
| Kafka | `kafka` | `kafka` | `kafka` | `kafka` |
| Redpanda | `redpanda` | `redpanda` | via Kafka docs | `redpanda` |
| RabbitMQ | `rabbitmq` | `rabbitmq` | `rabbitmq` | `rabbitmq` |
| Pulsar | — | `pulsar` | — | `pulsar` |
| NATS | `nats` | — | `nats` | `nats` |
| Neo4j | `neo4j` | `neo4j` | `neo4j` | `neo4j` |
| Cassandra | `cassandra` | `cassandra` | `cassandra` | `cassandra` |
| CockroachDB | `cockroachdb` | `cockroachdb` | `cockroachdb` | `cockroachdb` |
| ClickHouse | `clickhouse` | `clickhouse` | `clickhouse` | `clickhouse` |
| LocalStack | `localstack` | `localstack` | `localstack` | `localstack` |
| Azurite | `azurite` | Azure / catalog | `azurite` | `azurite` |
| GCloud emulators | `gcloud` | `gcloud` | `google` | `gcloud` |
| Vault | `vault` | `vault` | `vault` | `vault` |
| Consul | — | `consul` | — | `consul` |
| MinIO | `minio` | `minio` | `minio` | `minio` |
| Nginx | — | `nginx` | `nginx` | `nginx` |
| Toxiproxy | `toxiproxy` | `toxiproxy` | — | `toxiproxy` |

## Broader catalog (examples)

Also appear across languages on the hub: ActiveMQ, Artemis, Keycloak, Selenium, Playwright, Ollama, WireMock, MockServer, K3s, Kind, HiveMQ, Solace, ScyllaDB, YugabyteDB, Trino, TiDB, Qdrant, Weaviate, Chroma, Milvus, Fake GCS, S3Mock, Mailpit, etcd, Memcached, Couchbase, CouchDB, ArangoDB, HiveMQ, Azure Service Bus / Cosmos emulators.

## Language install roots

| Language | How modules are consumed |
| --- | --- |
| Node | `bun add -d @testcontainers/<name>` (+ `testcontainers` transitive) |
| Java | Maven/Gradle `org.testcontainers:testcontainers-<name>` via BOM |
| Python | `pip install "testcontainers[<extra>]"` then `from testcontainers.<mod> import …` |
| Go | `go get github.com/testcontainers/testcontainers-go/modules/<name>` |
| .NET | NuGet `Testcontainers.<Name>` |

## When to use GenericContainer instead

- No module for that service + language
- Custom Dockerfile / private image with nonstandard ports or waits
- Thin wrapper around an official image where module helpers add no value
- Temporary spike before adopting a module

## Module selection rules

1. Match the **language** first, then the service.
2. Keep module major aligned with core (especially Node 12.x and Java 2.x).
3. Pin the **container image tag** independently of the module package version.
4. Prefer module connection helpers (`getConnectionUri`, `getBootstrapServers`, …) over assembling URLs by hand.
5. For chaos / latency tests, prefer Toxiproxy modules over ad-hoc network hacks.
6. For AWS API compatibility locally, prefer LocalStack modules; for Azure storage emulator, Azurite; for GCP emulators, GCloud modules.

## Node docs paths

Module pages follow: `https://node.testcontainers.org/modules/<slug>/`  
Examples: `postgresql`, `redis`, `mongodb`, `kafka`, `localstack`, `elasticsearch`.

There is no reliable `/modules/` index page — use the mkdocs nav or the hub catalog.
