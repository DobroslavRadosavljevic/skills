# Writing the pages

Write every page by hand, from your own reading of the code. The two sites describe the same facts for two readers.

## What "hand-written" means

- Read the owner files of the area before you write. Open the file for each path, name, and number you put on the page.
- Write the text yourself, for this codebase. Do not run a generator that fills one shape with names. Do not copy README text, JSDoc, or old docs into a page and call it done.
- Each page has content that only this codebase could have: real paths, real numbers, real failure paths, and real decisions.
- Old docs are leads, not sources. When an old doc and the code disagree, write what the code does. Record the conflict in your progress file.
- Only the generated pages that a repo script writes (for example a service list) are not hand-written. Mark them as generated, and never edit them by hand.

## Agent pages

Readers: coding agents that will change the code next.

- Lead with owner files and rules. Agents scan, so use tables and short bullets.
- Name exact symbols and paths: `src/billing/usage.ts` `chargeUsage()`, not "the usage module".
- State each invariant with its reason and what breaks: "Write the hold before the model call. A crash after the call must not lose the charge."
- Give change recipes with every file to touch, in order.
- Name the test files and the command to run one test.
- Link related agent pages with relative `.md` links.
- Use plain `.md`. Avoid MDX components, so agents can read the raw file in the repo.

## Human pages

Reader: the owner or founder, who must understand the product completely, but does not read code every day.

- Explain in prose: what happens, in which order, and why it was built this way.
- Give every number with its meaning and its source: limits, prices, timeouts, retries, retention.
- Show money flows with the formula and a worked example.
- Use a Mermaid diagram for each flow that branches, crosses systems, or has async steps.
- Say what the user sees, what the owner sees, and what the owner must do when it breaks.
- Name risks and costs plainly.
- End with a short "Where it lives" line with the main repo paths.
- Use `.mdx`. Escape `{` and `<` in prose.

## Style for both

- Short sentences in active voice. One word for one idea; define a term once, then reuse it.
- Lead with the outcome. Put detail after.
- Keep planned work apart from built work. Label planned items "Planned".
- Write dates as `YYYY-MM-DD`. Avoid "recently" and "new".
- No secrets: name env vars, never values.
- No filler: no "this page describes", no marketing words.

## Page check

Before you mark a page done:

- Each path exists, and each symbol is in that file.
- Each number matches the code or config.
- Each flow step is in the right order, with its failure path.
- The frontmatter has a specific `title` and a one-line `description`.
- Links pass `blume validate --strict`.
- The paired page in the other site states the same facts.
