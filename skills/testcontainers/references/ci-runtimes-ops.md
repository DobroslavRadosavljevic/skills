# CI, Runtimes, and Ops

## Environment variables

### Docker discovery

| Variable | Meaning |
| --- | --- |
| `DOCKER_HOST` | Docker API endpoint (`unix:///var/run/docker.sock`, `tcp://docker:2375`, …) |
| `DOCKER_TLS_VERIFY` | TLS verify |
| `DOCKER_CERT_PATH` | TLS certs directory |
| `DOCKER_CONFIG` | Docker config directory |
| `DOCKER_AUTH_CONFIG` | Inline JSON registry auth |

### Testcontainers / Ryuk

| Variable | Meaning |
| --- | --- |
| `TESTCONTAINERS_HOST_OVERRIDE` | Host/IP clients use for mapped ports (DinD, Colima, Rancher, nested Desktop) |
| `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE` | Socket path **inside** Ryuk/Compose containers |
| `TESTCONTAINERS_RYUK_DISABLED` | Disable resource reaper |
| `TESTCONTAINERS_RYUK_PRIVILEGED` | Privileged Ryuk (Java/Node naming) |
| `TESTCONTAINERS_RYUK_CONTAINER_PRIVILEGED` | Go privileged Ryuk |
| `TESTCONTAINERS_RYUK_PORT` / `TESTCONTAINERS_SSHD_PORT` | Pin ports (avoid) |
| `TESTCONTAINERS_RYUK_VERBOSE` / `RYUK_VERBOSE` | Verbose Ryuk |
| `TESTCONTAINERS_RYUK_RECONNECTION_TIMEOUT` / `RYUK_*` timeouts | Reconnect / connection timeouts (raise for Compose in Go) |
| `RYUK_CONTAINER_IMAGE` | Override Ryuk image |
| `SSHD_CONTAINER_IMAGE` | Override SSHD sidecar image |
| `TESTCONTAINERS_REUSE_ENABLE` | Global reusable containers on/off |
| `TESTCONTAINERS_HUB_IMAGE_NAME_PREFIX` | Private registry / mirror prefix for Hub images |
| `TESTCONTAINERS_CHECKS_DISABLE` | Skip startup checks (Java) |
| `DEBUG=testcontainers*` | Node debug logging |

Java also reads `~/.testcontainers.properties` and classpath `testcontainers.properties` (env wins). Property `checks.disable` maps to `TESTCONTAINERS_CHECKS_DISABLE`.

Reuse enable for Java may also be `testcontainers.reuse.enable=true` in **user** properties (not classpath).

## Ryuk (resource reaper)

- Labels session resources and removes them when the test process dies.
- Keep enabled in CI when possible.
- If Ryuk cannot run (rootless Podman, missing privileges), set `TESTCONTAINERS_RYUK_DISABLED=true` **and** ensure process-exit cleanup or job teardown removes containers.
- Do not disable Ryuk and auto-remove without a cleanup plan.

## Reuse

- Opt-in sharing of containers by config hash for faster local loops.
- Node: `.withReuse()`; if `TESTCONTAINERS_REUSE_ENABLE` is unset, Node may default reuse-friendly — set `false` to force off.
- Java: experimental `.withReuse(true)` + manual `start()`, do not `stop()` / try-with-resources; **not for CI**.
- Prefer suite singletons or snapshots over reuse when isolation matters.

## Runtime matrix

### Docker Desktop

Usually works out of the box.

### Colima

```sh
export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
# Often also:
export TESTCONTAINERS_HOST_OVERRIDE="$(colima ls -j | jq -r '.address')"
# Node 18+: prefer IPv4
export NODE_OPTIONS=--dns-result-order=ipv4first
```

Pair log/health waits with listening-port waits.

### Podman

```sh
# macOS machine socket
export DOCKER_HOST="unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
# Rootless: typically
export TESTCONTAINERS_RYUK_DISABLED=true
```

Rootful may need privileged Ryuk flags depending on language/version.

### Rancher Desktop / OrbStack

Set `DOCKER_HOST` to the runtime socket and `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE` when Ryuk must see Docker. If mapped ports resolve wrong, set `TESTCONTAINERS_HOST_OVERRIDE`. OrbStack is Docker-API compatible but not always listed in the official Java matrix — treat as VM-backed runtime with the same override pattern.

## CI patterns

### GitHub Actions (Docker on ubuntu runners)

Docker is available on `ubuntu-*`. Use the socket; prefer mapped ports + `getHost()`.

Optional Cloud offload:

```yaml
- name: Setup Testcontainers Cloud Client
  uses: atomicjar/testcontainers-cloud-setup-action@v1
  with:
    token: ${{ secrets.TC_CLOUD_TOKEN }}
```

### GitLab CI (DinD)

```yaml
services:
  - name: docker:dind
    command: ["--tls=false"]
variables:
  DOCKER_HOST: "tcp://docker:2375"
  DOCKER_TLS_CERTDIR: ""
```

Socket-mounted runners: set `TESTCONTAINERS_HOST_OVERRIDE` (e.g. `host.docker.internal` where applicable).

### DinD / wormhole

Prefer sibling containers (mount `docker.sock` + shared workdir) over nested DinD. Inside Docker Desktop containers, `-e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal` is common.

Docs: https://java.testcontainers.org/supported_docker_environment/continuous_integration/dind_patterns/

### Testcontainers Cloud

- Offloads containers from laptop/CI; useful for parallelism and avoiding privileged DinD.
- Needs account/token; introduces network dependency.
- Product: https://testcontainers.com/cloud/

## Parallelism and suite scope

- Random host ports make parallel suites feasible when each test owns its container or worker-scoped fixture.
- Expensive deps: suite/class singleton started once; reset state between tests (e.g. Postgres snapshots).
- Java: `Startables.deepStart(...).join()` for parallel startup of many containers.
- Do not share mutable container state across parallel tests without isolation.

## Security

| Risk | Mitigation |
| --- | --- |
| Docker socket mount | Effectively root on host — restrict CI runners; prefer Cloud when policy requires |
| Privileged DinD / Ryuk | Last resort; document why |
| Secrets in container env | Throwaway test credentials only |
| Bind mounts | Prefer copy-to-container to avoid host FS leakage |
| Reuse leftovers | Disable reuse on shared CI agents |
| Public mapped ports | Ephemeral + firewall; never expose production data |

## When not to use Testcontainers

- Pure unit tests (no I/O) — use mocks/fakes
- When an in-memory stand-in is faithful enough for the assertion
- Shared remote staging DBs (flaky shared state)
- Reusable containers as a CI speed hack
- Every layer of the stack — keep TC at integration boundaries

## Agent checklist for CI failures

1. Is Docker / Cloud agent reachable? (`docker info` or Cloud setup step)
2. Are `DOCKER_HOST` / `TESTCONTAINERS_HOST_OVERRIDE` / socket override correct for the runtime?
3. Is Ryuk disabled without another cleanup path?
4. Are waits wrong for Colima/Rancher (need listening ports composite)?
5. Are Hub pulls rate-limited? Set hub image name prefix / mirror.
6. Are image tags pinned and present on the architecture (`linux/arm64` vs `amd64`)?
