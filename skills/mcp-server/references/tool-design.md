# Tool Design for LLMs and the Checklist

A tool is an interface for a model, not for a developer. The model sees only the name, description, input schema, and annotations, then reads the result in its context window. Every token and every ambiguity costs reliability. Cloudflare's MCP guidance gives the core: build tools around user goals, not a one-to-one wrap of an API; use several focused servers with narrow permissions; write detailed parameter descriptions; run evaluations after changes. The spec adds hard rules on names, annotations, ordering, and security. The rest of this page is working practice, not spec text.

## Table of contents

- Shape the tool set
- Names and descriptions
- Input schemas
- Outputs
- Pagination and large results
- Errors the model can act on
- Side effects, safety, and confirmation
- Prompt-injection-aware design
- Resources, prompts, and tools: which primitive
- Evaluation loop
- Tool-design checklist

## Shape the tool set

- Prefer a few tools that each complete a task step over many endpoint wrappers. Merge steps the model would always chain (`schedule_event` that finds free time and creates the event) when that cuts round trips.
- Keep the total small. Tool lists are sent to the model on every turn; large catalogs dilute selection accuracy and cost tokens. If a server needs many tools, split into several narrow servers with narrow permissions, or vary the list by caller scopes (allowed by the spec) in the per-request factory.
- One tool, one job. Avoid a "mega tool" with a `mode` argument that changes meaning; use separate tools or a small `enum` that only changes output detail.
- Order tools deterministically (spec SHOULD); stable order helps client caching and prompt-cache hits.
- Namespace by domain when several servers may combine (`github_search_issues`). Aggregating clients can hit collisions (two `search` tools), and the spec says the server `name` is not guaranteed unique and should not be used for disambiguation.

## Names and descriptions

- Name: verb plus noun, stable, `snake_case` or `camelCase`, 1 to 128 characters of `A-Za-z0-9_.-`, no spaces. Renames break prompts and evals; treat names as API.
- Description (the most important text): what it does, when to use it, when not to, what it returns, important limits. Two to four sentences. Mention sibling tools by name to steer sequencing ("Use `get_order` for full line items").
- Describe every argument with `.describe()`: meaning, format, units, valid values, an example. This is the only per-argument documentation the model gets.
- Use `title` for human display; `instructions` on the server for cross-tool guidance (sequence, conventions).
- Be literal. Avoid internal jargon and acronyms; use the terms your users use.
- Never make a description dynamic from user or remote data.

## Input schemas

- Use `enum`/`z.enum` for closed sets, `.min/.max` bounds, `.default()` for optional knobs, and `.int()` where needed. Reject early; the SDK returns the validation text as an error the model can read.
- Accept natural identifiers the model can obtain from earlier tool output (ids returned by search tools), not internal ones it cannot know. Accept names and ids where cheap.
- Flat, small argument objects beat deep nesting. Avoid unions and exotic JSON Schema keywords; they confuse models and some clients.
- Dates as ISO 8601 strings with an example; money as integer minor units or a decimal string plus currency.
- Defaults should be safe: small `limit`, read-only, no destructive flags.
- For file paths and URLs: see [auth-security.md](auth-security.md) (path traversal, SSRF).

## Outputs

- Return the smallest answer that lets the model proceed. Select fields; drop internal ids and noise; resolve cryptic ids into names alongside ids.
- Offer a `response_format` or `detail` enum (`concise` vs `detailed`) when payload sizes vary widely; default to concise.
- Always include a `text` block. Add `outputSchema` + `structuredContent` when callers (or code) need stable machine-readable fields; the JSON text block keeps compatibility.
- Use plain text or compact Markdown or JSON; avoid decorative formatting. Put the answer first, caveats after.
- Cap output size deliberately (for example, N rows or a character budget), say when truncated, and say how to get more. Return `resource_link` blocks for large artifacts instead of inlining.
- Never include secrets, tokens, internal hostnames, stack traces, or other users' data.

## Pagination and large results

- MCP list endpoints (`tools/list`, `resources/list`, ...) use opaque `cursor` and `nextCursor`; page size is server-chosen and clients must not assume one.
- For your own list/search tools, mirror that: input `cursor` (opaque string, optional) and `limit` (bounded), output `items`, `next_cursor` (omitted at the end), and `total` only when cheap. Return an explicit "truncated, call again with cursor X" hint in the text.
- Make cursors opaque and tamper-resistant (sign or encode a server-side position). Do not let a cursor widen the caller's access.
- Prefer filtering and sorting arguments over paging through everything; tell the model which filters exist.

## Errors the model can act on

- Validation failures from the SDK arrive as `isError` results; keep your own messages equally specific.
- Say what went wrong, what valid input looks like, and the next step: `No project "acme". Known projects: alpha, beta. Call list_projects to see all.`
- Distinguish not found, not permitted, rate limited (include retry-after), and upstream failure. Do not expose internals.
- A partial success should say what succeeded and what did not. Never return `isError: false` with an error buried in the text.

## Side effects, safety, and confirmation

- Set annotations honestly: `readOnlyHint` for pure reads, `destructiveHint` (true for deletes, overwrites), `idempotentHint` when repeats are harmless, `openWorldHint: false` for closed systems. Hosts use them to decide on approval prompts, but they are hints; enforce real permissions server-side.
- Make mutating tools idempotent where possible (client-supplied idempotency key or natural key) because models retry.
- Confirm irreversible or costly actions with `inputRequired.elicit` (see [input-required.md](input-required.md)) or a dry-run argument returning a preview. Do not rely on the host's approval alone.
- Split read and write tools so scopes and approval policies can differ.
- Rate limit per user. Long work: report progress with `ctx.mcpReq.notify`, honor `ctx.mcpReq.signal`, or return a job handle with a status tool.

## Prompt-injection-aware design

- Everything a tool returns from outside your trust boundary (web pages, tickets, emails, file contents, user-generated text) can contain instructions aimed at the model. Treat it as data.
- Label and fence untrusted text in the result (`<untrusted source="ticket #123">...</untrusted>` style, or a clear prefix), strip or neutralize obvious control markup, and keep it separate from your own status text.
- Minimize the "lethal trifecta" within one server: private data access, exposure to untrusted content, and an outbound channel (HTTP, email, file write). If a server needs all three, require confirmation on the outbound step and narrow what it can send to.
- Do not let tool outputs choose which tool runs next or supply arguments to privileged tools without validation.
- Never let a tool echo secrets back; never accept secrets as arguments.
- Do not auto-escalate scopes or permissions based on model output.

## Resources, prompts, and tools: which primitive

- Tools: model-controlled actions and queries.
- Resources: application-controlled, read-only context a host attaches (files, records, schemas) addressed by URI; use templates for families.
- Prompts: user-controlled templates (slash commands) with arguments and completion.
- If a host may not surface resources, expose the essential read path as a tool too.

## Evaluation loop

1. Write 10 to 30 realistic multi-step tasks per server, each with a verifiable answer.
2. Run an agent with only your server connected; record tool calls, errors, token use, and wasted steps.
3. Read transcripts. Fix descriptions, argument names, defaults, and output shape before changing code. Remove tools the agent never picks correctly.
4. Re-run after every tool change; renames and schema edits regress behavior.

## Tool-design checklist

Set:

- [ ] Each tool maps to a user goal; no raw endpoint mirrors; no mega-tools with mode switches.
- [ ] Tool count is small (aim for a dozen or fewer per server); unrelated domains split into separate servers.
- [ ] Names are unique, verb_noun, stable, within `A-Za-z0-9_.-`, 1 to 128 characters.
- [ ] Description states purpose, when to use, when not to, return shape, and limits; sibling tools are named.
- [ ] Every argument has `.describe()` with meaning, format, unit, and an example.
- [ ] Closed sets are enums; numbers and strings have bounds; optional knobs have safe defaults.
- [ ] Argument object is flat and small; ids come from earlier tool output.

Output:

- [ ] Result is concise by default; optional `detail` or `response_format`; text block always present.
- [ ] `outputSchema` + `structuredContent` used when machine-readable output matters, and they match.
- [ ] Lists are paginated with opaque `cursor`/`next_cursor` and a bounded `limit`; truncation is stated.
- [ ] Large artifacts returned as `resource_link`, not inlined.
- [ ] No secrets, stack traces, internal hosts, or other users' data in any output.

Errors:

- [ ] Failures return `isError: true` (or throw) with the cause, valid input, and next step.
- [ ] Not found, forbidden, rate limited, and upstream failures are distinguishable.

Safety:

- [ ] Annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) are accurate and permissions are enforced in code.
- [ ] Mutations are idempotent or take an idempotency key; irreversible actions confirm via elicitation or dry-run.
- [ ] Read and write separated; scopes per tool (`scopeChallenge`) and least privilege.
- [ ] Inputs validated (paths via `realpath`, URLs from allowlists, SQL parameterized, no shell interpolation).
- [ ] Untrusted content in results is labeled as data; no instruction-bearing text from third parties is promoted.
- [ ] Per-user rate limits, timeouts tied to `ctx.mcpReq.signal`, and body/element caps are set.
- [ ] User identity comes from the verified token, not arguments.

Quality:

- [ ] `tools/list` order is deterministic and cache hints (`cacheHints`) are set if lists are static.
- [ ] Eval tasks run end to end with the server connected and results were reviewed from transcripts.
- [ ] In-process client tests cover success, validation failure, `isError`, and auth failure paths.
