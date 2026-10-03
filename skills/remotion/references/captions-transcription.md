# Captions and Transcription

The `Caption` format, TikTok-style pages, SRT import/export, transcription back ends, and voiceover generation. Snapshot: `remotion@4.0.532`.

## Contents

1. The `Caption` type
2. `@remotion/captions` APIs
3. Displaying captions
4. Transcription back ends
5. Voiceover-driven videos
6. Pitfalls

---

## 1. The `Caption` type

Normalize every source (Whisper, ElevenLabs, OpenAI, SRT) into `Caption[]` from `@remotion/captions`, then build the display from that.

```ts
type Caption = {
  text: string; // whitespace-sensitive: include the leading space per word (" world")
  startMs: number;
  endMs: number;
  timestampMs: number | null; // e.g. whisper.cpp t_dtw; else midpoint or null
  confidence: number | null; // 0..1
  pageBreakAfter?: boolean; // force a page/cue break after this word (4.0.517)
};
```

Store captions as JSON in `public/` (for example `public/captions/intro.json`) or inline as an array literal when a Studio caption editor should write back to it.

## 2. `@remotion/captions` APIs

| API | Returns | Notes |
| --- | --- | --- |
| `createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds, breakOnSilenceAfterMilliseconds?})` | `{pages: TikTokPage[]}` | Groups words into pages. Higher ms = more words per page. `breakOnSilenceAfterMilliseconds` (4.0.514) forces breaks at pauses; `0` = word by word. |
| `parseSrt({input, strict?})` | `{captions}` | `strict` (4.0.530) rejects malformed files. |
| `serializeSrt({lines: Caption[][]})` | `string` | Each inner array is one cue. |

`TikTokPage = {text, startMs, durationMs, tokens: {text, fromMs, toMs}[]}`.

## 3. Displaying captions

```tsx
import {createTikTokStyleCaptions, type Caption, type TikTokPage} from '@remotion/captions';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useDelayRender, useVideoConfig} from 'remotion';

const COMBINE_MS = 1200;

const Page: React.FC<{page: TikTokPage}> = ({page}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000; // frame is local to the Sequence
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 220}}>
      <div
        style={{
          fontSize: 88,
          fontWeight: 800,
          whiteSpace: 'pre',
          WebkitTextStroke: '10px black',
          paintOrder: 'stroke',
        }}
      >
        {page.tokens.map((t, i) => (
          <span key={`${t.fromMs}-${i}`} style={{color: t.fromMs <= nowMs && t.toMs > nowMs ? '#39E508' : 'white'}}>
            {t.text}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{src: string}> = ({src}) => {
  const {fps} = useVideoConfig();
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const [handle] = useState(() => delayRender('Loading captions'));
  const [captions, setCaptions] = useState<Caption[] | null>(null);

  const load = useCallback(async () => {
    try {
      setCaptions(await (await fetch(staticFile(src))).json());
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [src, handle, continueRender, cancelRender]);

  useEffect(() => {
    load();
  }, [load]);

  const {pages} = useMemo(
    () => createTikTokStyleCaptions({captions: captions ?? [], combineTokensWithinMilliseconds: COMBINE_MS}),
    [captions],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const start = Math.round((page.startMs / 1000) * fps);
        const end = Math.round(Math.min(next ? (next.startMs / 1000) * fps : Infinity, start + (COMBINE_MS / 1000) * fps));
        if (end <= start) return null;
        return (
          <Sequence key={i} from={start} durationInFrames={end - start} name={`Caption ${i + 1}`}>
            <Page page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
```

Styling rules:

- `white-space: pre` keeps the per-word leading spaces.
- Outline text with `WebkitTextStroke` + `paintOrder: 'stroke'` (stroke behind fill), not `text-shadow` stacks (slow on CPU renderers).
- Keep captions inside the safe area: on 1080×1920 social video, keep them above the bottom ~20% where platform UI sits.
- Fit long pages with `fitText()` from `@remotion/layout-utils` and cap the size.
- Word emphasis: animate the active token's `scale` with a short spring, or use `@remotion/rough-notation` `<Highlight progress>` for marker effects.
- SRT import: `parseSrt({input: await (await fetch(staticFile('subs.srt'))).text()})` inside a delayRender handle.
- SRT export: `{frame === 0 ? <Artifact filename="captions.srt" content={serializeSrt({lines})} /> : null}`.

## 4. Transcription back ends

| Package | Where it runs | Converter | Notes |
| --- | --- | --- | --- |
| `@remotion/install-whisper-cpp` | Node server, CPU | `toCaptions({whisperCppOutput})` | Free, offline. Input must be 16-bit 16 kHz WAV. |
| `@remotion/whisper-webgpu` (4.0.518) | Browser or Node with a GPU | `toCaptions({whisperWebGpuOutput})` | Recommended in-browser. Multilingual models need `language` (no auto-detect). Not Linux arm64. |
| `@remotion/whisper-web` | Browser WASM | `toCaptions({whisperWebOutput})` | Older, slow, needs cross-origin isolation. Prefer WebGPU. |
| `@remotion/openai-whisper` | OpenAI API | `openAiWhisperApiToCaptions({transcription})` | Request `response_format: 'verbose_json'`, `timestamp_granularities: ['word']`. |
| `@remotion/elevenlabs` (4.0.443) | ElevenLabs API | `elevenLabsTranscriptToCaptions({transcript})` | `model_id: 'scribe_v2'`, `timestamps_granularity: 'word'`. Server-side only (API key). |

whisper.cpp (Node/Bun script):

```ts
import path from 'node:path';
import {downloadWhisperModel, installWhisperCpp, toCaptions, transcribe} from '@remotion/install-whisper-cpp';

const to = path.join(process.cwd(), 'whisper.cpp'); // add to .gitignore
await installWhisperCpp({to, version: '1.5.5'});
await downloadWhisperModel({model: 'medium.en', folder: to});
// bunx remotion ffmpeg -i input.mp4 -ar 16000 -ac 1 audio.wav -y
const whisperCppOutput = await transcribe({
  inputPath: path.resolve('audio.wav'),
  whisperPath: to,
  whisperCppVersion: '1.5.5',
  model: 'medium.en',
  tokenLevelTimestamps: true,
});
const {captions} = toCaptions({whisperCppOutput});
await Bun.write('public/captions/audio.json', JSON.stringify(captions, null, 2));
```

Models: `tiny`, `base`, `small`, `medium` (+ `.en` variants), `large-v1/2/3`, `large-v3-turbo`.

WebGPU in the browser:

```ts
import {canUseWhisperWebGpu, downloadWhisperModel, resampleTo16Khz, toCaptions, transcribe} from '@remotion/whisper-webgpu';

export const transcribeFile = async (file: File) => {
  const {supported, reason} = await canUseWhisperWebGpu();
  if (!supported) throw new Error(`WebGPU transcription unavailable: ${reason}`);
  await downloadWhisperModel({model: 'small.en'});
  const channelWaveform = await resampleTo16Khz({file});
  const out = await transcribe({channelWaveform, model: 'small.en'});
  return toCaptions({whisperWebGpuOutput: out}).captions;
};
```

Install with `bunx remotion add @remotion/whisper-webgpu @huggingface/transformers`. In Node, decode to 16 kHz mono with Mediabunny + `@mediabunny/server`. Transcribe each clip separately.

## 5. Voiceover-driven videos

1. Write the script per scene.
2. Generate audio per scene with a TTS provider from a Node/Bun script (never from the composition). Write files to `public/voiceover/<composition>/<scene>.mp3`. Keep API keys in `.env`, read them in the script, never in the bundle.
3. In `calculateMetadata`, read each file's duration with Mediabunny, convert to frames (`Math.ceil(seconds * fps)` + padding), pass the per-scene durations as a prop, and set `durationInFrames` to the sum minus transition overlaps.
4. Render scenes with `<Series>`/`<TransitionSeries>` using those durations; play each voice file in its scene.
5. Optionally transcribe the generated audio to drive word-synced captions.

## 6. Pitfalls

| Symptom | Cause | Fix |
| --- | --- | --- |
| Words run together | Leading spaces stripped or `white-space` normal | Keep `" word"` text; `white-space: pre` |
| Highlight off by the page start | Using local frame as absolute time | `page.startMs + (frame / fps) * 1000` |
| whisper.cpp garbage or error | Input not 16 kHz 16-bit WAV | Convert with `bunx remotion ffmpeg -ar 16000` |
| Multilingual WebGPU model outputs English | No `language` set | Pass `language` |
| `openaiWhisperApiToCaptions` not found | Docs typo | The export is `openAiWhisperApiToCaptions` |
| Captions JSON fetch fails during render | No delayRender handle or wrong path | `useDelayRender()` + `staticFile()` |
