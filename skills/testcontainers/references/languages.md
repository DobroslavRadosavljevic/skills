# Other Languages

Route by the project's language. For Node/TypeScript details see [node-core.md](node-core.md). Versions: [source-map.md](source-map.md).

## Java (2.x)

Docs: https://java.testcontainers.org/

Artifacts use the `testcontainers-*` prefix on 2.x. Prefer the BOM:

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.testcontainers</groupId>
      <artifactId>testcontainers-bom</artifactId>
      <version>2.0.5</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

Common artifacts: `testcontainers`, `testcontainers-junit-jupiter`, `testcontainers-postgresql`, `testcontainers-kafka`, `testcontainers-mongodb`, `testcontainers-localstack`. Redis often uses `GenericContainer` (no dedicated module).

```java
try (GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
        .withExposedPorts(6379)) {
    redis.start();
    String host = redis.getHost();
    Integer port = redis.getMappedPort(6379);
}
```

### JUnit 5

```java
@Testcontainers
class DbTests {
    @Container
    static PostgreSQLContainer<?> shared = new PostgreSQLContainer<>("postgres:16");

    @Container
    PostgreSQLContainer<?> perMethod = new PostgreSQLContainer<>("postgres:16");
}
```

- Static `@Container`: once per class
- Instance `@Container`: per test method
- Parallel JUnit execution with containers is unsupported / fragile
- `@Testcontainers(disabledWithoutDocker = true)` skips when Docker is missing

### Waits / networks / Compose

- `.waitingFor(Wait.forHttp("/"))`, `Wait.forLogMessage(...)`, `Wait.forHealthcheck()`
- `Network.newNetwork()` + `.withNetwork()` / `.withNetworkAliases()`
- Prefer `ComposeContainer` (Compose V2) over deprecated `DockerComposeContainer`
- Service names in APIs use `-` (`redis-1`), not `_`
- Host access: `Testcontainers.exposeHostPorts(port)` → `host.testcontainers.internal`

### Java pitfalls

- 2.x coordinates: `testcontainers-postgresql`, not legacy short `postgresql` (1.x line)
- Kafka: prefer `org.testcontainers.kafka.*` (legacy `containers.KafkaContainer` deprecated)
- Reuse (`.withReuse(true)`) is experimental and incompatible with try-with-resources / JUnit stop
- DB modules do not pull JDBC drivers
- LocalStack may require `LOCALSTACK_AUTH_TOKEN` depending on image date/policy

## Python (4.x)

Docs: https://testcontainers-python.readthedocs.io/en/latest/

```sh
pip install "testcontainers[postgres,redis,kafka,mongodb,localstack]"
# or uv / poetry equivalent
```

One meta-package + extras (no separate `testcontainers-*` wheels since 4.0). Primary type is `DockerContainer`.

```python
from testcontainers.postgres import PostgresContainer

with PostgresContainer("postgres:16") as pg:
    url = pg.get_connection_url()
```

```python
from testcontainers.core.container import DockerContainer
from testcontainers.core.waiting_utils import wait_for_logs

with DockerContainer("hello-world") as c:
    wait_for_logs(c, "Hello from Docker!")
```

### pytest

No built-in plugin — use fixtures + context managers:

```python
@pytest.fixture(scope="module")
def redis_url():
    from testcontainers.redis import RedisContainer
    with RedisContainer() as r:
        yield r.get_container_host_ip(), r.get_exposed_port(6379)
```

### Waits / Compose

Prefer structured strategies from `testcontainers.core.wait_strategies` (`LogMessageWaitStrategy`, `HttpWaitStrategy`, `HealthcheckWaitStrategy`, `PortWaitStrategy`, `CompositeWaitStrategy`) over legacy callables.

```python
from testcontainers.compose import DockerCompose

with DockerCompose(".", compose_file_name="compose.yml", pull=True, wait=True) as compose:
    host = compose.get_service_host("web")
    port = compose.get_service_port("web", 8080)
```

### Python pitfalls

- Drivers (`psycopg`, `sqlalchemy`, …) are not bundled with extras
- Community modules can break on minor bumps; pin versions deliberately
- Prefer `get_container_host_ip()` + mapped ports over hardcoded localhost
- No first-class Java-style reuse flag in docs — rely on fixtures + Ryuk

## Go (v0.43+)

Docs: https://golang.testcontainers.org/

```sh
go get github.com/testcontainers/testcontainers-go
go get github.com/testcontainers/testcontainers-go/modules/postgres
```

Prefer `testcontainers.Run` over older `GenericContainer` request builders. Prefer `modules/<name>.Run` over deprecated `RunContainer`.

```go
func TestRedis(t *testing.T) {
    ctx := context.Background()
    redisC, err := testcontainers.Run(ctx, "redis:7",
        testcontainers.WithExposedPorts("6379/tcp"),
        testcontainers.WithWaitStrategy(
            wait.ForListeningPort("6379/tcp"),
            wait.ForLog("Ready to accept connections"),
        ),
    )
    testcontainers.CleanupContainer(t, redisC) // nil-safe; call before err check
    require.NoError(t, err)

    endpoint, err := redisC.Endpoint(ctx, "")
    require.NoError(t, err)
    _ = endpoint
}
```

### Modules

```go
pg, err := postgres.Run(ctx, "postgres:16-alpine",
    postgres.WithDatabase("users"),
    postgres.WithUsername("user"),
    postgres.WithPassword("password"),
    postgres.BasicWaitStrategies(), // not default — set waits on Mac/Windows
)
```

Postgres snapshots: avoid database name `postgres`. Kafka module is KRaft-oriented (min Confluent Local ~7.4).

### Networks / Compose

- `network.New(ctx)` + `CleanupNetwork(t, nw)`
- Compose: `modules/compose` — `NewDockerComposeWith`, `Up`/`Down`, `WaitForService`
- Raise Ryuk connection/reconnection timeouts for heavy Compose suites

### Go pitfalls

- Always `CleanupContainer` (or rely on Ryuk); call cleanup before asserting `err` so failed starts still register
- Postgres module: set `BasicWaitStrategies()` explicitly
- Host networking is Linux-only
- Modules are separate `go get` paths

## Other languages (pointers only)

| Language | Package | Docs |
| --- | --- | --- |
| .NET | NuGet `Testcontainers` (+ `Testcontainers.*` modules) | https://dotnet.testcontainers.org/ |
| Rust | crates `testcontainers`, `testcontainers-modules` | https://rust.testcontainers.org/ |
| Ruby | gem `testcontainers` | https://github.com/testcontainers/testcontainers-ruby |
| Elixir | Hex `testcontainers` | https://github.com/testcontainers/testcontainers-elixir |

Also listed on the hub: Haskell, Clojure, PHP, Native (C). Use https://testcontainers.com/modules/?language=… to confirm module coverage.
