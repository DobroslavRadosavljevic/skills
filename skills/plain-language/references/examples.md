# Examples

## Explanations

### Deploy failure

**Bad:** “The rollout was non-convergent because the control plane couldn’t reconcile the desired stateful set due to a probe failure on the dependency graph.”

**Good:** “The new version didn’t come up. The health check failed because the app couldn’t connect to Redis. I’ll fix the Redis URL and deploy again.”

### What changed in a PR

**Bad:** “Refactored the domain layer to improve cohesion and invert dependencies across the billing bounded context.”

**Good:** “Moved invoice totals into `billing/calculate-total.ts` so the payment page isn’t doing that math itself.”

### Introducing a library term

**Bad:** “Use RQBv2 `defineRelations` for your graph.”

**Good:** “We’ll declare how tables link to each other with Drizzle’s `defineRelations` helper (the relational query API). That lets you load a user and their posts in one query.”

## Naming

| Bad | Good | Why |
| --- | --- | --- |
| `mgr.ts` | `session-manager.ts` or better `get-session.ts` | “mgr” says nothing |
| `doProcess()` | `sendWelcomeEmail()` | Verb + object |
| `flag` | `isEmailVerified` | Boolean reads as a question |
| `data.ts` | `pricing-table.ts` | What’s inside? |
| `AuthNznOrchestrator` | `login-flow.ts` / `startLogin` | Ordinary words |
| `tmp-final-v3/` | `onboarding/` | Durable domain name |
| `h()` | `toHtml()` | Greppable intent |

## Mixed technical + plain

**Bad:** Only jargon.

**Good:**

> Postgres rejected the migration because the `users.email` column already exists.  
> That usually means the migration ran once already. I’ll check the migrations table and skip or fix the duplicate step.  
> SQL: `ERROR: column "email" of relation "users" already exists`

## Manual invocation

User: “plain-language this” / “rename clearly” / “explain simply”

Agent: rewrite the last explanation and/or rename the scoped symbols/files to pass the aloud/search/teammate tests, then show a short before→after list.
