# Structured output

Do not use `generateObject` / `streamObject` in new code. They still exist as deprecated shims. Use `generateText` / `streamText` + `Output.*`.

```ts
import { generateText, streamText, Output, isStepCount } from 'ai';
import { z } from 'zod';
```

Guide: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data.md  
Reference: https://ai-sdk.dev/docs/reference/ai-sdk-core/output.md

## Output factories

| Factory | Complete type | Streaming | Notes |
| --- | --- | --- | --- |
| `Output.text()` | `string` | n/a | Default if `output` omitted |
| `Output.object({ schema, name?, description? })` | `OBJECT` | `partialOutputStream`: **unvalidated** `DeepPartial<OBJECT>` | Zod / JSON Schema / Valibot |
| `Output.array({ element, name?, description? })` | `ELEMENT[]` | `elementStream`: each element complete+validated | Partial array drops incomplete last element |
| `Output.choice({ options, name?, description? })` | one of `options` | — | Classification / enum |
| `Output.json({ name?, description? })` | `JSONValue` | — | Valid JSON, **no** structure |

```ts
const { output } = await generateText({
  model,
  output: Output.object({
    name: 'Recipe',
    description: 'A recipe for a dish.',
    schema: z.object({
      name: z.string().describe('The name of the recipe'),
      ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
    }),
  }),
  prompt: 'Generate a lasagna recipe.',
});
```

`result.output` is a **getter**. Destructuring `{ output }` throws `NoOutputGeneratedError` when the last step did not produce output (typical: finishReason `'tool-calls'`).

## Schemas

- **Zod** v3/v4: pass the schema directly, or `zodSchema(schema, { useReferences: true })`.
- **JSON Schema:** `jsonSchema({ ... })` from `'ai'`.
- **Valibot:** `import { valibotSchema } from '@ai-sdk/valibot'` — not exported from `ai`.
- Dates: prefer `z.string().date().transform(...)` over `z.date()` for LLM output.
- OpenAI strict tool/object schemas: `.nullable()` not `.optional()`.

## Tools + structured output

Generating the object **counts as a step**. Default `isStepCount(1)` cannot do tool-call → tool-result → JSON. Raise `stopWhen`:

```ts
const { output } = await generateText({
  model,
  tools: { weather: weatherTool },
  output: Output.object({
    schema: z.object({ summary: z.string(), recommendation: z.string() }),
  }),
  stopWhen: isStepCount(5),
  prompt: 'What should I wear in San Francisco today?',
});
```

Same for `streamText` + `ToolLoopAgent` (`output` on the agent constructor).

## Streaming objects to the client

Server: **text** stream of the object JSON, not the UI message stream.

```ts
import { streamText, Output, createTextStreamResponse, toTextStream } from 'ai';

const result = streamText({
  model,
  output: Output.object({ schema }),
  prompt,
});

return createTextStreamResponse({
  stream: toTextStream({ stream: result.stream }),
});
```

Client: `useObject({ api, schema })` from `@ai-sdk/react`. `object` is partial while streaming. `onFinish({ object, error })` — `object` is undefined if schema fails.

Enum/classify: client `z.object({ enum: z.enum(['true', 'false']) })`; server `Output.choice({ options: ['true', 'false'] })`.

## Errors

```ts
import { NoObjectGeneratedError, NoOutputGeneratedError } from 'ai';

if (NoObjectGeneratedError.isInstance(error)) {
  // parse/validate fail: cause, text, response, usage
}
```

Accessing `result.output` when missing throws `NoOutputGeneratedError`.

## Mapping from generateObject / streamObject

| Old | v7 |
| --- | --- |
| `generateObject({ schema })` | `generateText({ output: Output.object({ schema }) })` |
| `streamObject({ schema })` | `streamText({ output: Output.object({ schema }) })` |
| `output: 'array'` | `Output.array({ element })` |
| `output: 'enum'` | `Output.choice({ options })` |
| `output: 'no-schema'` | `Output.json()` |
| `result.object` | `result.output` |
| `partialObjectStream` | `partialOutputStream` |
| `experimental_output` | **removed** in v7 — use `output` |

`generateObject`/`streamObject` are **not** deleted in 7.0.x (deprecated). Do not use them in new code. Telemetry docs may still list them as capture targets.
