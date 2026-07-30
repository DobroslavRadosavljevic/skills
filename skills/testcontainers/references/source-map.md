# Source Map

This reference captures the Testcontainers docs and package snapshot used to create the skill.

## Snapshot

- Captured: 2026-07-30
- Hub: https://testcontainers.com/
- Modules catalog: https://testcontainers.com/modules/
- Context7 IDs used:
  - `/testcontainers/testcontainers-node`
  - `/testcontainers/testcontainers-java` · `/websites/java_testcontainers`
  - `/testcontainers/testcontainers-go` · `/websites/golang_testcontainers`
  - `/testcontainers/testcontainers-python`
  - `/websites/testcontainers`

### Package versions observed

| Language | Package | Version |
| --- | --- | --- |
| Node | `testcontainers` | **12.0.4** |
| Node modules | `@testcontainers/*` (most) | **12.0.4** |
| Java | `org.testcontainers:testcontainers` (+ BOM) | **2.0.5** |
| Python | `testcontainers` (PyPI) | **4.15.0** (`requires-python >=3.10`) |
| Go | `github.com/testcontainers/testcontainers-go` | **v0.43.0** |
| .NET | NuGet `Testcontainers` | check registry (skill noted ~4.13.x) |
| Rust | crates `testcontainers` / `testcontainers-modules` | check crates.io |

Treat prereleases and language-specific outliers (e.g. stale Node `@testcontainers/eventstoredb@10`) as unavailable unless the project already depends on them.

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check registry metadata for the project's language:

   ```sh
   bun info testcontainers
   bun info @testcontainers/postgresql
   # Java: Maven Central org.testcontainers:testcontainers
   # Python: pip index versions testcontainers / PyPI
   # Go: go list -m -versions github.com/testcontainers/testcontainers-go
   ```

3. Prefer official language docs sites. If docs and registry disagree, report the mismatch.
4. Check the local lockfile / BOM before applying guidance that requires a minimum version.
5. Re-scan https://testcontainers.com/modules/ when asking whether a module exists for a service + language.

## Official Pages

### Hub

- Home: https://testcontainers.com/
- Modules: https://testcontainers.com/modules/
- Cloud: https://testcontainers.com/cloud/
- Guides: https://testcontainers.com/guides/

### Node.js

- Docs: https://node.testcontainers.org/
- Install: https://node.testcontainers.org/quickstart/install/
- Usage: https://node.testcontainers.org/quickstart/usage/
- Global setup: https://node.testcontainers.org/quickstart/global-setup/
- Containers: https://node.testcontainers.org/features/containers/
- Wait strategies: https://node.testcontainers.org/features/wait-strategies/
- Networking: https://node.testcontainers.org/features/networking/
- Compose: https://node.testcontainers.org/features/compose/
- Images: https://node.testcontainers.org/features/images/
- Configuration: https://node.testcontainers.org/configuration/
- Runtimes: https://node.testcontainers.org/supported-container-runtimes/
- GitHub: https://github.com/testcontainers/testcontainers-node

### Java

- Docs: https://java.testcontainers.org/
- JUnit 5 quickstart: https://java.testcontainers.org/quickstart/junit_5_quickstart/
- Configuration: https://java.testcontainers.org/features/configuration/
- Waits: https://java.testcontainers.org/features/startup_and_waits/
- Networking: https://java.testcontainers.org/features/networking/
- Reuse: https://java.testcontainers.org/features/reuse/
- Compose: https://java.testcontainers.org/modules/docker_compose/
- Files: https://java.testcontainers.org/features/files/
- Creating images: https://java.testcontainers.org/features/creating_images/
- Supported Docker env / CI: https://java.testcontainers.org/supported_docker_environment/
- GitHub: https://github.com/testcontainers/testcontainers-java

### Python

- Docs: https://testcontainers-python.readthedocs.io/en/latest/
- Modules index: https://testcontainers-python.readthedocs.io/en/latest/modules/index.html
- GitHub: https://github.com/testcontainers/testcontainers-python

### Go

- Docs: https://golang.testcontainers.org/
- Quickstart: https://golang.testcontainers.org/quickstart/
- Configuration: https://golang.testcontainers.org/features/configuration/
- Wait strategies: https://golang.testcontainers.org/features/wait/introduction/
- Compose: https://golang.testcontainers.org/features/docker_compose/
- Garbage collector: https://golang.testcontainers.org/features/garbage_collector/
- pkg.go.dev: https://pkg.go.dev/github.com/testcontainers/testcontainers-go
- GitHub: https://github.com/testcontainers/testcontainers-go

### Other languages

- .NET: https://dotnet.testcontainers.org/
- Rust: https://rust.testcontainers.org/
- Ruby: https://github.com/testcontainers/testcontainers-ruby
- Elixir: https://github.com/testcontainers/testcontainers-elixir
