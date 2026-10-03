# Voices: library, search, cloning (IVC/PVC), design, remix, settings

Snapshot 2026-10-03. Pronunciation dictionaries live in [text-to-speech.md](text-to-speech.md#pronunciation).

## Contents

- [Voice types](#voice-types)
- [Default voices are expiring](#default-voices-are-expiring)
- [Find and list voices](#find-and-list-voices)
- [Voice Library (community voices)](#voice-library-community-voices)
- [Voice settings](#voice-settings)
- [Instant Voice Cloning (IVC)](#instant-voice-cloning-ivc)
- [Professional Voice Cloning (PVC)](#professional-voice-cloning-pvc)
- [Voice Design (text to voice)](#voice-design-text-to-voice)
- [Voice Remix](#voice-remix)
- [Other voice operations](#other-voice-operations)
- [Slots, plans, policy](#slots-plans-policy)

## Voice types

`category`: `premade` (Default voices), `cloned` (IVC), `professional` (PVC), `generated` (Voice Design / remix), `famous`, `high_quality`. Choose:

| Goal | Path |
| --- | --- |
| Good voice now, no audio | Voice Library search, or Voice Design from a text description |
| Replicate a speaker quickly (≥10 s, best 1–2 min) | IVC |
| Highest fidelity of **your own** voice (30 min–3 h audio) | PVC (Creator+, voice-captcha verification) |
| Tweak an existing owned voice (pitch, accent, age) | Remix |

## Default voices are expiring

All Default (premade) voices expire **2026-12-31**, and accounts created after March 2026 never had them. Legacy IDs (e.g. Rachel `21m00Tcm4TlvDq8ikWAM`) already route to replacement voices. Docs still use George `JBFqnCBsd6RMkjVDRZzb` in samples.

Do not hard-code premade IDs in production. Resolve voices at runtime (`voices.search`), store the user's chosen `voiceId`, or save a Voice Library / designed voice into the workspace. Premade IDs on 2026-10-03 (for prototypes only): Roger `CwhRBWXzGAHq8TQ4Fs17`, Sarah `EXAVITQu4vr4xnSDxMaL`, Laura `FGY2WhTYpPnrIDTdsKH5`, Charlie `IKne3meq5aSn9XLyUdCD`, George `JBFqnCBsd6RMkjVDRZzb`, Callum `N2lVS1w4EtoT3dr4eOWO`, River `SAz9YHcvj6GT2YYXdXww`, Liam `TX3LPaxmHKxFdv7VOQHJ`, Alice `Xb7hH8MSUJpSbSDYk0k2`, Matilda `XrExE9yKIg1WjnnlVkGX`, Will `bIHbv24MWmeRgasZH58o`, Jessica `cgSgspJ2msm6clMCkdW9`, Eric `cjVigY5qzO86Huf0OWal`, Chris `iP95p4xoKVk53GoZ742B`, Brian `nPczCjzI2devNBz1zQrb`, Daniel `onwK4e9ZLuTAKqWW03F9`, Lily `pFZP5JQG7iQjIQuC4Bku`, Adam `pNInz6obpgDQGcFmaJgB`, Bill `pqHfZKP75CvOlQylNhV4`.

## Find and list voices

Use `client.voices.search` (`GET /v2/voices`). `voices.getAll` (`GET /v1/voices`) is deprecated and **fails once a workspace has >500 voices**.

```ts
let nextPageToken: string | undefined;
do {
  const page = await elevenlabs.voices.search({ pageSize: 100, voiceType: "personal", nextPageToken });
  for (const v of page.voices) console.log(v.voiceId, v.name, v.category, v.labels);
  nextPageToken = page.hasMore ? page.nextPageToken ?? undefined : undefined;
} while (nextPageToken);
```

Filters: `search`, `sort` (`created_at_unix|name`), `sortDirection`, `voiceType` (`personal|community|default|workspace|non-default|non-community|saved`), `category`, `fineTuningState`, `collectionId`, `gender`, `age`, `language`, `accent`, `useCases`, `voiceIds` (≤100), `includeTotalCount`. Paginate on `hasMore` + `nextPageToken`.

`client.voices.get(voiceId)` returns `fineTuning` (per-model state/progress), `samples`, `labels`, `settings`, `sharing`, `previewUrl`, `verifiedLanguages`, `highQualityBaseModelIds`.

## Voice Library (community voices)

10,000+ shared voices. **Not available via API on the Free plan.**

```ts
const { voices } = await elevenlabs.voices.getShared({ search: "british narrator", pageSize: 10, sort: "trending" });
const pick = voices[0];
const added = await elevenlabs.voices.share(pick.publicOwnerId, pick.voiceId, { newName: "Narrator" }); // adds to My Voices
```

- `getShared` filters: `category` (`professional|famous|high_quality`), `gender`, `age`, `accent`, `language`, `locale`, `useCases`, `descriptives`, `featured`, `minNoticePeriodDays`, `includeCustomRates`, `includeLiveModerated`, `sort` (`created_date|usage_character_count_1y|trending|cloned_by_count`).
- `voices.share(publicUserId, voiceId, { newName })` is misleadingly named: it **adds a library voice to your voices**.
- Notice period: the owner may remove a voice; you keep access for its notice period (≤2 years). Webhook events `voice_removal_notice`, `voice_removal_notice_withdrawn`, `voice_removed`.
- Some voices carry legacy credit multipliers or are paid-only; Live Moderation voices may add latency.

## Voice settings

| Field | Default | Effect |
| --- | --- | --- |
| `stability` | 0.5 | Lower = more expressive/variable; higher = consistent/monotone. |
| `similarityBoost` | 0.75 | Adherence to the original voice. Too high can reproduce artifacts. |
| `style` | 0 | Style exaggeration; adds latency. Keep 0 for agents. |
| `useSpeakerBoost` | true | More similarity, slight latency. |
| `speed` | 1.0 | 0.7–1.2. |

Stored defaults: `voices.settings.get(voiceId)`, `voices.settings.update(voiceId, {...})`, `voices.settings.getDefault()`. Per-request `voiceSettings` override stored ones. Eleven v4 uses only stability and similarity.

## Instant Voice Cloning (IVC)

`POST /v1/voices/add` → `client.voices.ivc.create({ name, files, removeBackgroundNoise?, description?, labels? })` → `{ voiceId, requiresVerification }`. Starter+.

```ts
const { voiceId } = await elevenlabs.voices.ivc.create({
  name: "Host - Ana",
  files: [createReadStream("ana-clean-90s.mp3")],
  labels: { language: "en", accent: "american", gender: "female" },
});
```

- 1–2 min of clean single-speaker audio is ideal; >3 min rarely helps. Total duration matters, not file count.
- `removeBackgroundNoise` runs isolation; it can hurt already-clean audio.
- Only clone voices you have rights and consent for. Clones that imitate prominent public figures are blocked.
- v4 clones reproduce recording flaws (EQ, plosives, loudness) more faithfully — clean input matters more.

## Professional Voice Cloning (PVC)

Fine-tunes a model on your own voice. Creator+ (slots by plan). 30 min minimum, 2–3 h ideal; MP3 ≥192 kbps, −23 to −18 dB RMS, peaks ≤ −3 dB, no reverb/noise, no singing.

| Step | JS SDK |
| --- | --- |
| Create | `voices.pvc.create({ name, language, description?, labels? })` → `{ voiceId }` |
| Upload samples | `voices.pvc.samples.create(voiceId, { files, removeBackgroundNoise? })` |
| Multi-speaker audio | `voices.pvc.samples.speakers.separate(voiceId, sampleId)` → poll `.speakers.get(...)` → `voices.pvc.samples.update(voiceId, sampleId, { selectedSpeakerIds: [...all ids at once] })` |
| Trim | `voices.pvc.samples.update(voiceId, sampleId, { trimStartTime, trimEndTime })` (ms) |
| Verify (owner reads captcha) | `voices.pvc.verification.captcha.get(voiceId)` (base64 PNG) → `voices.pvc.verification.captcha.verify(voiceId, { recording })`; fallback `voices.pvc.verification.request(voiceId, { files })` |
| Train | `voices.pvc.train(voiceId, { modelId: "eleven_multilingual_v2" })` (repeat per model, e.g. `eleven_v4`) |
| Poll | `voices.get(voiceId)` → `fineTuning.state[modelId]` (`fine_tuned|failed`), `fineTuning.progress[modelId]` |

Training takes ~3–6 h (up to 24 h). "No model found for this voice" = not fine-tuned for that model yet. Failed verification locks retries for 24 h. Only PVCs can be published to the Voice Library or shared externally. `usePvcAsIvc: true` on TTS uses the instant variant (lower latency).

## Voice Design (text to voice)

`client.textToVoice.design(req)` → 3 previews → `client.textToVoice.create(...)` saves one (uses a voice slot). `textToVoice.createPreviews` is deprecated.

```ts
const { previews } = await elevenlabs.textToVoice.design({
  modelId: "eleven_ttv_v3",                     // or eleven_multilingual_ttv_v2 (default)
  voiceDescription: "Native British English. Female, 40s. Studio quality. Persona: calm documentary narrator. Emotion: warm, assured.",
  autoGenerateText: true,                        // or text: 100–1000 chars
  outputFormat: "mp3_44100_128",                 // default 192 kbps needs Creator+
});
const voice = await elevenlabs.textToVoice.create({
  voiceName: "Doc Narrator",
  voiceDescription: "Calm British documentary narrator",
  generatedVoiceId: previews[0].generatedVoiceId,
});
```

Body: `voiceDescription` (20–1000), `modelId`, `text` or `autoGenerateText`, `loudness` (−1..1), `seed`, `guidanceScale` (0–100, default 5; high sounds artificial), `quality` (−1..1), `shouldEnhance` (expand short prompts), `streamPreviews` (then fetch `textToVoice.preview.stream(generatedVoiceId)`), and for `eleven_ttv_v3` only: `referenceAudioBase64` + `promptStrength` (0–1).

Prompt template: `Native <language/dialect>. <Gender>, <age>. <quality: Good/Studio/Broadcast quality>. Persona: <2–5 words>. Emotion: <2–3 adjectives>.` Avoid FX words (reverb, phone, tape); say "intonation" rather than "accent" unless you mean an accent.

## Voice Remix

`client.textToVoice.remix(voiceId, { voiceDescription: "<the changes>", text?, autoGenerateText?, guidanceScale (default 2), promptStrength?, seed?, loudness? })` → previews → `textToVoice.create(...)`. Remixable: your own IVC/PVC, designed voices, and library voices with an infinite notice period. **Premade voices are not remixable** (a docs sample uses one — wrong). Iterate with `remixingSessionId` / `remixingSessionIterationId`.

## Other voice operations

- Edit: `voices.update(voiceId, { name /* required */, description?, labels?, files? })`.
- Delete: `voices.delete(voiceId)` (irreversible).
- Samples: `voices.samples.audio.get(voiceId, sampleId)`, `client.samples.delete(voiceId, sampleId)`.
- Similar voices from audio: `voices.findSimilarVoices({ audioFile, similarityThreshold?, topK? })`.
- Accents list: `voices.accents.get({ language?, modelId? })`.
- Copy IVC/designed voice into a data-residency workspace: `voices.replicateToIsolatedEnvironment(voiceId, { targetWorkspaceId })`.

## Slots, plans, policy

Custom voice slots: Free 3, Starter 10, Creator 30, Pro 160, Scale 660, Business 660–2,200 (sources disagree). PVC slots: Creator 1, Pro 1, Scale 3, Business 10. Library and Default voices do not use slots. Check `client.user.subscription.get()` → `voiceSlotsUsed`, `voiceLimit`, `canUseInstantVoiceCloning`, `canUseProfessionalVoiceCloning`.

Enforce voice ownership in your own backend (table `user_id → voice_id → permission`) when end users can create clones in a shared workspace.
