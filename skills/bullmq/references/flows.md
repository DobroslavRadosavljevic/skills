# Flows and Parent-Child Jobs

## When to Use Flows

Use `FlowProducer` when a parent must not become waitable until children finish successfully (or until configured failure policies resolve dependencies). Prefer a single processor with sequential steps only for tightly coupled local work. Prefer flows for cross-queue fan-out, aggregation, or deep dependency trees.

## Add a Flow

```typescript
import { FlowProducer } from 'bullmq';

const flowProducer = new FlowProducer({ connection });

const tree = await flowProducer.add({
  name: 'renovate-interior',
  queueName: 'renovate',
  children: [
    { name: 'paint', data: { place: 'ceiling' }, queueName: 'steps' },
    { name: 'paint', data: { place: 'walls' }, queueName: 'steps' },
    { name: 'floor', data: { place: 'floor' }, queueName: 'steps' },
  ],
});
```

Rules:

- Parent and children may use different `queueName`s.
- Add is atomic for the tree.
- Parent sits in `waiting-children` until children resolve, then moves to waiting/delayed/prioritized as appropriate.
- Flow job `opts` omit `repeat`, `deduplication`, and `debounce` (and children also omit `parent`).

Provide per-queue defaults via the second argument when needed:

```typescript
await flowProducer.add(
  {
    name: 'car',
    queueName: 'assembly',
    data: { step: 'engine' },
    children: [{ name: 'car', data: { step: 'wheels' }, queueName: 'assembly' }],
  },
  {
    queuesOptions: {
      assembly: {
        defaultJobOptions: { removeOnComplete: true },
      },
    },
  },
);
```

## Parent Reads Children

```typescript
import { Worker } from 'bullmq';

const steps = new Worker('steps', async job => {
  // ...
  return 250;
}, { connection });

const renovate = new Worker('renovate', async job => {
  const values = await job.getChildrenValues();
  // values keyed by child job keys → return values
  return Object.values(values).reduce((a: number, b: number) => a + b, 0);
}, { connection });
```

Other useful APIs: dependency getters/counts on Job, flow tree inspection helpers from docs. Failed ignored children: `getIgnoredChildrenFailures()`.

## Serial Chains

Nest children to force order (deepest child runs first):

```typescript
await flowProducer.add({
  name: 'car',
  data: { step: 'engine' },
  queueName: 'assembly',
  children: [
    {
      name: 'car',
      data: { step: 'wheels' },
      queueName: 'assembly',
      children: [{ name: 'car', data: { step: 'chassis' }, queueName: 'assembly' }],
    },
  ],
});
```

## Failure Policies

Set these on the **child** `opts`. Default without them: parent stays blocked until children succeed.

| Option | Behavior |
| --- | --- |
| `failParentOnFailure: true` | Fail parent when this child fails (lazy until a worker processes the parent; often `UnrecoverableError`). Can recurse up the tree. |
| `ignoreDependencyOnFailure: true` | Drop dependency on fail; parent may proceed; inspect via `getIgnoredChildrenFailures()`. |
| `removeDependencyOnFailure: true` | Remove dependency on fail; parent proceeds when no pending children remain. |
| `continueParentOnFailure: true` | Parent can activate on child fail without waiting for siblings (≥ 5.58). Pair with `removeUnprocessedChildren()` / `getFailedChildrenValues()` when compensating. |

```typescript
children: [
  {
    name: 'critical-step',
    queueName: 'steps',
    data: {},
    opts: { failParentOnFailure: true },
  },
  {
    name: 'optional-step',
    queueName: 'steps',
    data: {},
    opts: { ignoreDependencyOnFailure: true },
  },
]
```

## Runtime Children / Step Parents

For saga-ish steps that spawn children mid-flight, persist step state with `job.updateData`, then `moveToWaitingChildren(token)` and throw `WaitingChildrenError` (does not burn `attemptsMade`). Pass the lock `token` into move helpers. See process-step-jobs in the source map.

## Removal Rules

When removing flow jobs:

1. Removing a parent removes its children.
2. Removing a child removes that dependency; if it was the last dependency, the parent can become ready.
3. A job that is both parent and child applies both rules.
4. If any job that would be removed is locked, removal fails and nothing is removed.

## Debugging Tips

- Inspect parent state `waiting-children` when parents never run.
- Confirm every child queue has workers.
- Verify failure options on the **child** `opts`, not only the parent.
- Keep trees shallow unless the product truly needs deep nesting — ops and failure reasoning grow with depth.
