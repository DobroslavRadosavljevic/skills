# Embeddings, rerank, image, speech, transcription, video, files, realtime

All from `'ai'` unless noted. Do not invent model IDs — use project IDs or current provider docs.

## embed / embedMany / cosineSimilarity

```ts
import { embed, embedMany, cosineSimilarity } from 'ai';

const { embedding, usage } = await embed({
  model: 'openai/text-embedding-3-small',
  value: 'sunny day at the beach',
  providerOptions: { openai: { dimensions: 512 } },
  maxRetries: 2, // default 2; 0 disables
  abortSignal: AbortSignal.timeout(1000),
});

const { embeddings } = await embedMany({
  model: 'openai/text-embedding-3-small',
  values: ['sunny day at the beach', 'rainy afternoon in the city'],
  maxParallelCalls: 2,
});

cosineSimilarity(embeddings[0], embeddings[1]);
```

`usage` looks like `{ tokens: 10 }`. Dedicated models: `openai.embeddingModel('text-embedding-3-large')`, `mistral.embeddingModel('mistral-embed')`. v6 renamed `textEmbeddingModel` → `embeddingModel`.

Google `gemini-embedding-2` multimodal parts via `providerOptions.google.content` (`text` / `inlineData` / `fileData` with `gs://` or HTTP).

Middleware:

```ts
import { wrapEmbeddingModel, defaultEmbeddingSettingsMiddleware, gateway } from 'ai';

wrapEmbeddingModel({
  model: gateway.embeddingModel('google/gemini-embedding-001'),
  middleware: defaultEmbeddingSettingsMiddleware({
    settings: { providerOptions: { google: { outputDimensionality: 256, taskType: 'CLASSIFICATION' } } },
  }),
});
```

Error: `TooManyEmbeddingValuesForCallError` when `embedMany` exceeds provider limits. SDK chunks when possible.

Common dimensions (docs table): OpenAI 3-large 3072, 3-small 1536, ada-002 1536; Google gemini-embedding-001/2 3072; Mistral 1024; Cohere embed-english-v3.0 1024.

## rerank

```ts
import { rerank } from 'ai';
import { cohere } from '@ai-sdk/cohere';

const { ranking, rerankedDocuments, originalDocuments } = await rerank({
  model: cohere.reranking('rerank-v3.5'),
  query: 'Which docs are about the moon landing?',
  documents: ['…', '…'],
  topN: 5,
});
```

Documents may be objects; provide a string selector per the rerank guide. Same request options as embed (`maxRetries`, `abortSignal`, `headers`, `providerOptions`).

## generateImage vs language-model images

### Dedicated image models

```ts
import { generateImage, NoImageGeneratedError, wrapImageModel } from 'ai';

const { image, images, warnings, providerMetadata } = await generateImage({
  model: openai.image('gpt-image-2'), // or fal / replicate / google image models
  prompt: 'Santa Claus driving a Cadillac',
  size: '1024x1024', // XOR aspectRatio: '16:9' — model-dependent
  n: 4, // SDK batches using provider limits; override with maxImagesPerCall
  seed: 1234567890,
  abortSignal: AbortSignal.timeout(30_000),
});

image.base64;
image.uint8Array;
```

`experimental_generateImage` was **removed** in v7 — use `generateImage`. Catch `NoImageGeneratedError.isInstance(error)` (`cause`, `responses`).

`n` auto-batches (DALL-E 3 = 1/call, DALL-E 2 ≤ 10). Outer `providerMetadata` key is the provider name; `images[]` aligns with top-level `images`.

Image middleware: `wrapImageModel` + `ImageModelV4Middleware` (`specificationVersion` in examples may still say `'v3'` — match installed types).

Sizes from the 2026-08-27 docs table (non-exhaustive): OpenAI `gpt-image-2` 1024×1024 / 1536×1024 / 1024×1536; `dall-e-3` 1024 / 1792 variants; Google `gemini-3.1-flash-image-preview` and `gemini-3-pro-image-preview` aspect ratios; xAI `grok-imagine-image`; Fal FLUX; Fireworks; Luma `photon-1`; Together FLUX/SDXL; Bedrock Nova Canvas.

### Images from language models

Some LMs emit files (Google Gemini image models). Use `generateText` and read **`result.files`**:

```ts
const result = await generateText({
  model: google('gemini-3.1-flash-image-preview'),
  prompt: 'Generate an image of a comic cat',
});

for (const file of result.files) {
  if (file.mediaType.startsWith('image/')) {
    file.base64;
    file.uint8Array;
    file.mediaType;
  }
}
```

Do not assume DALL-E is the default. Do not use placeholder image URLs when the task is to generate an image.

## generateSpeech

```ts
import { generateSpeech, NoSpeechGeneratedError } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await generateSpeech({
  model: openai.speech('tts-1'),
  text: 'Hello, world!',
  voice: 'alloy',
  language: 'es', // provider support varies
});

result.audio.uint8Array;
result.audio.base64;
result.warnings;
```

`experimental_generateSpeech` is a deprecated alias. Error: `NoSpeechGeneratedError`. Models in docs: OpenAI `tts-1` / `tts-1-hd` / `gpt-4o-mini-tts`; ElevenLabs `eleven_v3` / multilingual / flash / turbo; LMNT `aurora`/`blizzard`; Google Gemini TTS previews; Cartesia `sonic-*`; Fish Audio `s1`/`s2-pro`; Hume; xAI; Mistral voxtral.

## transcribe / streamTranscribe

```ts
import { transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';

const transcript = await transcribe({
  model: openai.transcription('whisper-1'),
  audio: await readFile('audio.mp3'), // Uint8Array | ArrayBuffer | Buffer | base64 string | URL
});

transcript.text;
transcript.segments;
transcript.language;
transcript.durationInSeconds;
```

`experimental_transcribe` → `transcribe` (alias kept). Error: `NoTranscriptGeneratedError`.

Streaming (experimental):

```ts
import { experimental_streamTranscribe as streamTranscribe } from 'ai';

const result = streamTranscribe({
  model: openai.transcription('gpt-realtime-whisper'),
  audio: audioStream, // ReadableStream<Uint8Array | string>
  inputAudioFormat: { type: 'audio/pcm', rate: 24000 },
});

for await (const part of result.fullStream) {
  if (part.type === 'transcript-delta') process.stdout.write(part.delta);
  if (part.type === 'transcript-partial') console.log('partial:', part.text);
  if (part.type === 'transcript-final') console.log('final:', part.text);
}
```

`fullStream` is **single-consumer**. Access it before awaiting result promises, or the stream is consumed internally.

## experimental_generateVideo

```ts
import { experimental_generateVideo as generateVideo } from 'ai';
```

Throws `NoVideoGeneratedError` when empty. Confirm the installed reference page for the current options (`prompt`, `aspectRatio`, provider image-to-video fields). Still experimental.

## experimental_streamTranslate

Speech-translation stream (`experimental_streamTranslate`). Throws `NoTranslationGeneratedError`. Stream parts and `outputAudioFormat` are on https://ai-sdk.dev/docs/ai-sdk-core/translation.md.

## uploadFile / uploadSkill

```ts
import { uploadFile, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { providerReference } = await uploadFile({
  api: openai.files(), // or `api: openai` shorthand
  data: fs.readFileSync('./photo.png'),
  filename: 'photo.png',
  mediaType: 'image/png', // optional; auto-detected
  providerOptions: { openai: { purpose: 'assistants' } },
});
```

`ProviderReference` is `Record<string, string>` (`{ openai: 'file-abc123' }`). Use as file part `data`. Switching providers mid-conversation: upload to both and **merge** references. Supported `files()`: Anthropic, Google, OpenAI, xAI. Others throw `UnsupportedFunctionalityError` if they see a foreign reference.

`uploadSkill` uploads a skill bundle (Anthropic / OpenAI). Result is also a `ProviderReference`. Pass into later `generateText` via provider options / skill fields per https://ai-sdk.dev/docs/ai-sdk-core/skill-uploads.md.

## Realtime

Experimental. Server mints a short-lived token; browser connects with `experimental_useRealtime`.

```ts
import { experimental_getRealtimeToolDefinitions, tool } from 'ai';
import { openai } from '@ai-sdk/openai';

const toolDefinitions = await experimental_getRealtimeToolDefinitions({ tools: { weather } });
const token = await openai.experimental_realtime.getToken({ /* model, tools */ });
```

Gateway: `gateway.experimental_realtime('openai/gpt-realtime-2')` is browser-safe; **`getToken()` must stay on the server**.

Client (`@ai-sdk/react`): `experimental_useRealtime({ model, api: { token: '/api/realtime/setup' }, onToolCall })`.

Providers in docs: OpenAI `gpt-realtime`, Google realtime models, xAI `grok-voice-latest`, Gateway `openai/gpt-realtime-2`.
