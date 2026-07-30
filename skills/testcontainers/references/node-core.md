# Node / TypeScript Core

Primary docs: https://node.testcontainers.org/

Install:

```sh
bun add -d testcontainers @testcontainers/postgresql
# or: bun add -d testcontainers @testcontainers/redis @testcontainers/mongodb ...
```

Core package: `testcontainers@12.x`. Modules: `@testcontainers/<name>@12.x` (keep majors aligned).

## Modules vs GenericContainer

Prefer modules when available:

```ts
import { PostgreSqlContainer } from "@testcontainers/postgresql";

await using postgres = await new PostgreSqlContainer("postgres:16").start();
const uri = postgres.getConnectionUri();
```

Use `GenericContainer` for custom images or services without a module:

```ts
import { GenericContainer, Wait } from "testcontainers";

await using redis = await new GenericContainer("redis:7")
  .withExposedPorts(6379)
  .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
  .start();

const host = redis.getHost();
const port = redis.getMappedPort(6379);
```

`await using` works when the started type implements `AsyncDisposable` (modules do). Otherwise call `stop()` in `afterAll` / teardown.

## Builder patterns

```ts
await new GenericContainer("alpine:3.20")
  .withExposedPorts(8080)
  .withEnvironment({ ENV: "VALUE" })
  .withCommand(["sleep", "infinity"])
  .withCopyFilesToContainer([{ source: "./seed.sql", target: "/seed.sql" }])
  .withCopyContentToContainer([{ content: "hello", target: "/tmp/x.txt" }])
  .withStartupTimeout(120_000)
  .withNetwork(network)
  .withNetworkAliases("db")
  .withReuse()
  .withWaitStrategy(Wait.forListeningPorts())
  .start();
```

Anti-patterns: bind mounts, fixed host ports, fixed container names/hostnames.

## Started container ops

- `getHost()`, `getMappedPort(port)`, `getFirstMappedPort()`, `getId()`
- `exec(["cmd", ...])` → `{ stdout, stderr, exitCode, output }`
- `logs()`, `restart()`, `stop({ timeout?, remove?, removeVolumes? })`
- Default `stop()` is fire-and-forget for speed; Ryuk cleans leftovers when enabled

## Wait strategies

Docs: https://node.testcontainers.org/features/wait-strategies/

Default: healthcheck if defined on the image/config, else **listening ports** (~60s).

| Factory | Use |
| --- | --- |
| `Wait.forListeningPorts()` | Mapped ports bound (note **plural**) |
| `Wait.forLogMessage(msg \| RegExp, times?)` | Log appears |
| `Wait.forHealthCheck()` | Docker healthcheck success |
| `Wait.forHttp(path, port, opts?)` | HTTP ready (chain status/predicate/TLS helpers) |
| `Wait.forSuccessfulCommand(cmd)` | Exec exits 0 |
| `Wait.forOneShotStartup()` | Container exits 0 |
| `Wait.forAll([...])` | Composite; optional `.withDeadline(ms)` |

Colima/Rancher: port forwarding can lag — compose log/HC with `Wait.forListeningPorts()` via `Wait.forAll`.

## Networking

```ts
import { GenericContainer, Network } from "testcontainers";

const network = await new Network().start();

await new GenericContainer("alpine")
  .withCommand(["sleep", "infinity"])
  .withNetwork(network)
  .withNetworkAliases("foo")
  .start();

await network.stop();
```

Host → container: `TestContainers.exposeHostPorts(8000)` then reach host as `host.testcontainers.internal:<port>` (SSHD sidecar).

## Compose

```ts
import { DockerComposeEnvironment, Wait } from "testcontainers";

const env = await new DockerComposeEnvironment(".", "compose.yml")
  .withWaitStrategy("redis-1", Wait.forLogMessage("Ready to accept connections"))
  .up(["redis", "postgres"]);

const redis = env.getContainer("redis-1"); // Compose v2: <service>-1
await env.down();
```

Prefer single-service modules when you only need one dependency. Use Compose for existing multi-service stacks.

## Images from Dockerfile

```ts
const image = await GenericContainer.fromDockerfile("./ctx")
  .withBuildkit()
  .withBuildArgs({ ARG: "V" })
  .build();

await using c = await image.start();
```

Mirror Hub pulls in CI with `TESTCONTAINERS_HUB_IMAGE_NAME_PREFIX`.

## Module helpers (common)

| Package | Class | Typical helpers |
| --- | --- | --- |
| `@testcontainers/postgresql` | `PostgreSqlContainer` | `getConnectionUri()`, `withDatabase/Username/Password`, `snapshot()` / `restoreSnapshot()` |
| `@testcontainers/redis` | `RedisContainer` | `getConnectionUrl()`, `withPassword`, `executeCliCmd` |
| `@testcontainers/mongodb` | `MongoDBContainer` | `getConnectionString()` |
| `@testcontainers/mysql` | `MySqlContainer` | `getConnectionUri()`, `executeQuery` |
| `@testcontainers/kafka` | `KafkaContainer` | KRaft defaults on recent images; long startup timeout |
| `@testcontainers/localstack` | `LocalstackContainer` | port 4566, `getConnectionUri()`, wait for `"Ready"` |
| `@testcontainers/elasticsearch` | `ElasticsearchContainer` | `getHttpUrl()` |

Postgres snapshots: do **not** use database name `postgres`.

Full module list: [modules-catalog.md](modules-catalog.md).

## Test runner patterns

### Vitest global setup

```js
// setup.js
import { RedisContainer } from "@testcontainers/redis";

let redis;

export async function setup(project) {
  redis = await new RedisContainer("redis:7").start();
  project.provide("redisUrl", redis.getConnectionUrl());
}

export async function teardown() {
  await redis?.stop();
}
```

```ts
import { inject } from "vitest";
const redisUrl = inject("redisUrl"); // must be serializable
```

### Jest

`globalSetup` / `globalTeardown`, or `beforeAll` / `afterAll` per file.

### Per-test vs shared

Prefer one container per file/worker when startup is cheap and tests mutate state. Share globally only for heavy deps — then reset state (Postgres snapshots) or run sequentially.

### Bun

`bun test` works via Docker API (same env/runtime caveats). Use `beforeAll`/`afterAll` or a preload global setup.

### Playwright

No dedicated Playwright Testcontainers module. Start DB/broker modules in global setup; inject URLs via env. Browser automation stays with Playwright browsers (or `@testcontainers/selenium` when needed).

## Debug

```sh
DEBUG=testcontainers*
```

Categories include `testcontainers:containers`, `:compose`, `:build`, `:pull`, `:exec`.
