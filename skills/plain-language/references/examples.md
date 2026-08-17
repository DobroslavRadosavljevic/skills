# Examples

## Explanations

### Deploy failure

**Bad:** “The rollout was non-convergent because the control plane couldn’t reconcile the desired stateful set due to a probe failure on the dependency graph.”

**Good:** “The new version did not start. The health check failed. The app could not connect to Redis. I will fix the Redis URL and deploy again.”

### What changed

**Bad:** “Refactored the domain layer to improve cohesion and invert dependencies across the billing bounded context.”

**Good:** “I moved invoice totals into `billing/calculate-total.ts`. The payment page no longer does that math.”

### New library term

**Bad:** “Use RQBv2 `defineRelations` for your graph.”

**Good:** “We will declare how tables link with Drizzle’s `defineRelations` helper. That is the relational query API. Then you can load a user and their posts in one query.”

### STE length

**Bad:** “In order to proceed, the environment variable that points at the database should be updated so that the application can establish a connection.”

**Good:** “Set `DATABASE_URL` to the real database. Then start the app again.”

### STE voice

**Bad:** “The switch must be turned.”

**Good:** “Turn the switch.”

## Naming

| Bad | Good | Why |
| --- | --- | --- |
| `mgr.ts` | `get-session.ts` | “mgr” says nothing |
| `doProcess()` | `sendWelcomeEmail()` | Verb + object |
| `flag` | `isEmailVerified` | Boolean reads as a question |
| `data.ts` | `pricing-table.ts` | Says what is inside |
| `AuthNznOrchestrator` | `login-flow.ts` / `startLogin` | Ordinary words |
| `tmp-final-v3/` | `onboarding/` | Durable domain name |
| `h()` | `toHtml()` | Greppable intent |

## Mixed technical + plain

**Bad:** Only jargon.

**Good:**

> Postgres rejected the migration. The `users.email` column already exists.
> The migration likely ran once already. I will check the migrations table and skip or fix the duplicate step.
> SQL: `ERROR: column "email" of relation "users" already exists`

## Manual invocation

User: “plain-language this” / “STE this” / “rename clearly”

Agent: rewrite the last explanation and/or rename the scoped symbols to pass STE and the aloud/search/teammate tests. Show a short before → after list.
