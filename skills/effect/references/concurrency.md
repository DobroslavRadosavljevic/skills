# Concurrency, streams, and transactions

## Messaging

| Need | Module | Notes |
| --- | --- | --- |
| Many consumers of the same events | **PubSub** | Broadcast; `subscribe` is scoped |
| Competing consumers / buffering work | **Queue** | Back-pressure, bounded/unbounded, shutdown |
| Pull-based sequences over time | **Stream** | Finite or infinite; compose with `mapEffect`, `run*` |
| Fold a stream to one value | **Sink** | Leftovers can return to the stream |
| Custom protocol / bidirectional | **Channel** | Low-level; Streams/Sinks sit on Channels |
| One pull result | **Take** / **Pull** | Stream internals; rarely in app code |
| One-shot wait | **Deferred** | Complete once; `Deferred.await` |
| One-shot result, many waiters | **Deferred** | Complete once (`await` / `succeed` / `fail`) |
| Reusable open/closed gate | **Latch** | `open` = all future waiters; `release` = current only; `close` re-arms |
| Limit in-flight work | **Semaphore** | One waiter queue |
| Fair per-key in-flight | **PartitionedSemaphore** | Round-robin by key so one tenant cannot starve others |
| STM permits / RW lock | **TxSemaphore** / **TxReentrantLock** | Compose with other `Effect.tx` state |

`Stream.fromQueue` / `Stream.fromPubSub` connect messaging to streams. For NDJSON/msgpack use `Stream.pipeThroughChannel` + `effect/unstable/encoding`.

## Mutable state

| Need | Module |
| --- | --- |
| Shared cell, independent updates | **Ref** — `Ref.get` / `Ref.set` / `Ref.update` |
| Updates that themselves are Effects and must not overlap | **SynchronizedRef** |
| Publish every change as a stream | **SubscriptionRef** |
| Resource that is replaced (old released) | **ScopedRef** |
| Several cells must commit or retry together | **TxRef** inside `Effect.tx` |

v3 STM (`TRef`, `TQueue`, …) renamed to **Tx\***:

- `TxRef`, `TxQueue`, `TxHashMap`, `TxHashSet`, `TxChunk`, `TxDeferred`, `TxPubSub`, `TxPriorityQueue`, `TxReentrantLock`, `TxSemaphore`, `TxSubscriptionRef`

Use Tx\* when a fiber must read/write multiple pieces of shared state atomically. Use ordinary `Ref`/`Queue` when a single cell or uncoordinated updates suffice.

## Fibers

- `Effect.forkChild` — child of current fiber (v3 `fork`)
- `Effect.forkDetach` — independent lifetime (v3 `forkDaemon`)
- `Effect.forkScoped` / `Effect.forkIn` — tied to a Scope
- Join with `Fiber.join`; interrupt with `Fiber.interrupt`
- **FiberHandle**: singleton slot (new install interrupts old)
- **FiberMap** / **FiberSet**: supervised collections, interrupt on scope close

v4 fiber keep-alive: forked work can keep the process alive; use `runMain` so shutdown still runs finalizers.

## Scheduling and time

- **Schedule**: retry/repeat/jitter/spaced/exponential; compose
- **Clock** + **TestClock**: sleep and “now”
- **DateTime**: instants and time zones
- **Cron**: calendar recurrence (often with Schedule or cluster cron)
- **Duration**: all timeouts/TTLs

## Batching

Define `Request.Class` + `RequestResolver` so N Effect requests become fewer backend calls. Use at GraphQL/dataloader-style boundaries, not for a single HTTP GET.

## Caching and shared resources

| Need | Module |
| --- | --- |
| Memoize Effect lookups (success **and** fail), coalesce in-flight, TTL/capacity | **Cache** |
| Same, but each entry owns a **Scope** | **ScopedCache** |
| Bounded identical borrowable items (connections) | **Pool** |
| One lazily acquired scoped value, last borrower releases | **RcRef** |
| Same, **by key** (sessions/clients) | **RcMap** |
| Keyed Layer-built contexts (tenants) | **LayerMap** |
| One refreshable Layer / Context | **LayerRef** |
| Latest acquire, refresh manual or on **Schedule** | **Resource** |
| Swap the live resource (old scope released) | **ScopedRef** |

Do not use Channel/Pull/Take in application code unless implementing stream operators.
