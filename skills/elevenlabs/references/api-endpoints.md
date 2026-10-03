# ElevenLabs REST Endpoint Catalog

Generated 2026-10-03 from `https://api.elevenlabs.io/openapi.json` (405 operations). Base URL `https://api.elevenlabs.io`; auth header `xi-api-key`.

JS SDK column: `@elevenlabs/elevenlabs-js` method (Fern group names → camelCase). `†` = not listed in the SDK `reference.md` at check time (new endpoint or hand-written wrapper); confirm in the installed SDK or call REST. `REST only` = no SDK mapping. Python SDK uses the same path in snake_case (`client.text_to_speech.convert`).

For params and body fields of any row run `python3 scripts/openapi_lookup.py <path-or-method> --full`.

## Contents

- [Text to Speech](#text-to-speech)
- [Text to Dialogue](#text-to-dialogue)
- [Speech to Speech (Voice Changer)](#speech-to-speech-voice-changer)
- [Speech to Text](#speech-to-text)
- [Forced Alignment](#forced-alignment)
- [Sound Effects](#sound-effects)
- [Audio Isolation](#audio-isolation)
- [Music](#music)
- [Voice Design (Text to Voice)](#voice-design-text-to-voice)
- [Voices](#voices)
- [Voice Library (shared voices)](#voice-library-shared-voices)
- [Pronunciation Dictionaries](#pronunciation-dictionaries)
- [Dubbing](#dubbing)
- [Studio](#studio)
- [Productions](#productions)
- [Audio Native](#audio-native)
- [History](#history)
- [Image & Video (Flows)](#image--video-flows)
- [Assets](#assets)
- [Speech Engine](#speech-engine)
- [Models](#models)
- [Tokens](#tokens)
- [User & Usage](#user--usage)
- [Workspace & Admin](#workspace--admin)
- [Agents › Agent tests](#agents--agent-tests)
- [Agents › Agents](#agents--agents)
- [Agents › Batch calling](#agents--batch-calling)
- [Agents › Conversations](#agents--conversations)
- [Agents › Knowledge base](#agents--knowledge-base)
- [Agents › LLM usage](#agents--llm-usage)
- [Agents › MCP servers](#agents--mcp-servers)
- [Agents › Misc (users, analytics, env vars, Exotel)](#agents--misc-users-analytics-env-vars-exotel)
- [Agents › Phone numbers](#agents--phone-numbers)
- [Agents › Secrets & settings](#agents--secrets--settings)
- [Agents › Tags](#agents--tags)
- [Agents › Telephony (Twilio/SIP/WhatsApp)](#agents--telephony-twiliosipwhatsapp)
- [Agents › Tools](#agents--tools)
- [Agents › Triage tickets](#agents--triage-tickets)

## Text to Speech

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/text-to-speech/{voice_id}` | `client.textToSpeech.convert` | Text To Speech |
| POST | `/v1/text-to-speech/{voice_id}/with-timestamps` | `client.textToSpeech.convertWithTimestamps` | Text To Speech With Timestamps |
| POST | `/v1/text-to-speech/{voice_id}/stream` | `client.textToSpeech.stream` | Text To Speech Streaming |
| POST | `/v1/text-to-speech/{voice_id}/stream/with-timestamps` | `client.textToSpeech.streamWithTimestamps` | Text To Speech Streaming With Timestamps |

## Text to Dialogue

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/text-to-dialogue` | `client.textToDialogue.convert` | Text To Dialogue (Multi-Voice) |
| POST | `/v1/text-to-dialogue/stream` | `client.textToDialogue.stream` | Text To Dialogue (Multi-Voice) Streaming |
| POST | `/v1/text-to-dialogue/stream/with-timestamps` | `client.textToDialogue.streamWithTimestamps` | Text To Dialogue Streaming With Timestamps |
| POST | `/v1/text-to-dialogue/with-timestamps` | `client.textToDialogue.convertWithTimestamps` | Text To Dialogue With Timestamps |

## Speech to Speech (Voice Changer)

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/speech-to-speech/{voice_id}` | `client.speechToSpeech.convert` | Speech To Speech |
| POST | `/v1/speech-to-speech/{voice_id}/stream` | `client.speechToSpeech.stream` | Speech To Speech Streaming |

## Speech to Text

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/speech-to-text` | `client.speechToText.convert` | Speech To Text |
| GET | `/v1/speech-to-text/transcripts/{transcription_id}` | `client.speechToText.transcripts.get` | Get Transcript By Id |
| DELETE | `/v1/speech-to-text/transcripts/{transcription_id}` | `client.speechToText.transcripts.delete` | Delete Transcript By Id |

## Forced Alignment

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/forced-alignment` | `client.forcedAlignment.create` | Create Forced Alignment |

## Sound Effects

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/sound-generation` | `client.textToSoundEffects.convert` | Sound Generation |

## Audio Isolation

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/audio-isolation` | `client.audioIsolation.convert`† | Audio Isolation |
| GET | `/v1/audio-isolation/history` | `client.audioIsolation.list` | Get Audio Isolation History |
| DELETE | `/v1/audio-isolation/history/{history_item_id}` | `client.audioIsolation.delete` | Delete Audio Isolation History Item |
| POST | `/v1/audio-isolation/stream` | `client.audioIsolation.stream`† | Audio Isolation Stream |

## Music

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/music/video-to-music` | `client.music.videoToMusic`† | Video To Music |
| POST | `/v1/music/plan` | `client.music.compositionPlan.create` | Generate Composition Plan |
| POST | `/v1/music` | `client.music.compose` | Compose Music |
| POST | `/v1/music/detailed` | `client.music.composeDetailed` | Compose Music With A Detailed Response |
| POST | `/v1/music/detailed/stream` | `client.music.composeDetailedStream` | Stream Composed Music With A Detailed Response |
| POST | `/v1/music/stream` | `client.music.stream` | Stream Composed Music |
| POST | `/v1/music/upload` | `client.music.upload` | Upload Music |
| POST | `/v1/music/stem-separation` | `client.music.separateStems`† | Stem Separation |
| GET | `/v1/music/finetunes` | `client.music.finetunes.list` | Get Music Finetunes |
| POST | `/v1/music/finetunes` | `client.music.finetunes.create` | Create Music Finetune |
| GET | `/v1/music/finetunes/{finetune_id}` | `client.music.finetunes.get` | Get Music Finetune |
| PATCH | `/v1/music/finetunes/{finetune_id}` | `client.music.finetunes.update` | Update Music Finetune |
| DELETE | `/v1/music/finetunes/{finetune_id}` | `client.music.finetunes.delete` | Delete Music Finetune |

## Voice Design (Text to Voice)

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/text-to-voice/create-previews` | `client.textToVoice.createPreviews` | [Deprecated] Generate A Voice Preview From Description **(deprecated)** |
| POST | `/v1/text-to-voice` | `client.textToVoice.create` | Create A New Voice From Voice Preview |
| POST | `/v1/text-to-voice/design` | `client.textToVoice.design` | Design A Voice. |
| POST | `/v1/text-to-voice/{voice_id}/remix` | `client.textToVoice.remix` | Remix A Voice. |
| GET | `/v1/text-to-voice/{generated_voice_id}/stream` | `client.textToVoice.preview.stream` | Text To Voice Preview Streaming |

## Voices

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| DELETE | `/v1/voices/{voice_id}/samples/{sample_id}` | `client.samples.delete` | Delete Sample |
| GET | `/v1/voices/{voice_id}/samples/{sample_id}/audio` | `client.voices.samples.audio.get` | Get Audio From Sample |
| GET | `/v1/voices/settings/default` | `client.voices.settings.getDefault` | Get Default Voice Settings. |
| GET | `/v1/voices/{voice_id}/settings` | `client.voices.settings.get` | Get Voice Settings |
| POST | `/v1/voices/{voice_id}/settings/edit` | `client.voices.settings.update` | Edit Voice Settings |
| GET | `/v1/voices/accents` | `client.voices.accents.get` | Get Voice Accents |
| GET | `/v1/voices` | `client.voices.getAll` | List Voices |
| GET | `/v1/voices/{voice_id}` | `client.voices.get` | Get Voice |
| DELETE | `/v1/voices/{voice_id}` | `client.voices.delete` | Delete Voice |
| POST | `/v1/voices/{voice_id}/edit` | `client.voices.update` | Edit Voice |
| GET | `/v2/voices` | `client.voices.search` | Get Voices V2 |
| POST | `/v1/voices/{voice_id}/replicate-to-isolated-environment` | `client.voices.replicateToIsolatedEnvironment` | Replicate Voice To Isolated Environment |
| POST | `/v1/voices/add` | `client.voices.ivc.create` | Add Voice |
| POST | `/v1/voices/add/{public_user_id}/{voice_id}` | `client.voices.share` | Add Shared Voice |
| POST | `/v1/similar-voices` | `client.voices.findSimilarVoices` | Get Similar Library Voices |
| POST | `/v1/voices/pvc` | `client.voices.pvc.create` | Create Pvc Voice |
| POST | `/v1/voices/pvc/{voice_id}` | `client.voices.pvc.update` | Edit Pvc Voice |
| POST | `/v1/voices/pvc/{voice_id}/samples` | `client.voices.pvc.samples.create` | Add Samples To Pvc Voice |
| POST | `/v1/voices/pvc/{voice_id}/samples/{sample_id}` | `client.voices.pvc.samples.update` | Update Pvc Voice Sample |
| DELETE | `/v1/voices/pvc/{voice_id}/samples/{sample_id}` | `client.voices.pvc.samples.delete` | Delete Pvc Voice Sample |
| GET | `/v1/voices/pvc/{voice_id}/samples/{sample_id}/audio` | `client.voices.pvc.samples.audio.get` | Retrieve Voice Sample Audio |
| GET | `/v1/voices/pvc/{voice_id}/samples/{sample_id}/waveform` | `client.voices.pvc.samples.waveform.get` | Retrieve Voice Sample Visual Waveform |
| GET | `/v1/voices/pvc/{voice_id}/samples/{sample_id}/speakers` | `client.voices.pvc.samples.speakers.get` | Retrieve Speaker Separation Status |
| POST | `/v1/voices/pvc/{voice_id}/samples/{sample_id}/separate-speakers` | `client.voices.pvc.samples.speakers.separate` | Start Speaker Separation |
| GET | `/v1/voices/pvc/{voice_id}/samples/{sample_id}/speakers/{speaker_id}/audio` | `client.voices.pvc.samples.speakers.audio.get` | Retrieve Separated Speaker Audio |
| GET | `/v1/voices/pvc/{voice_id}/captcha` | `client.voices.pvc.verification.captcha.get` | Get Pvc Voice Captcha |
| POST | `/v1/voices/pvc/{voice_id}/captcha` | `client.voices.pvc.verification.captcha.verify` | Verify Pvc Voice Captcha |
| POST | `/v1/voices/pvc/{voice_id}/train` | `client.voices.pvc.train` | Run Pvc Training |
| POST | `/v1/voices/pvc/{voice_id}/verification` | `client.voices.pvc.verification.request` | Request Manual Verification |

## Voice Library (shared voices)

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| GET | `/v1/shared-voices` | `client.voices.getShared` | Get Voices |

## Pronunciation Dictionaries

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/pronunciation-dictionaries/add-from-file` | `client.pronunciationDictionaries.createFromFile` | Add A Pronunciation Dictionary |
| POST | `/v1/pronunciation-dictionaries/add-from-rules` | `client.pronunciationDictionaries.createFromRules` | Add A Pronunciation Dictionary |
| PATCH | `/v1/pronunciation-dictionaries/{pronunciation_dictionary_id}` | `client.pronunciationDictionaries.update` | Update Pronunciation Dictionary |
| GET | `/v1/pronunciation-dictionaries/{pronunciation_dictionary_id}` | `client.pronunciationDictionaries.get` | Get Metadata For A Pronunciation Dictionary |
| POST | `/v1/pronunciation-dictionaries/{pronunciation_dictionary_id}/set-rules` | `client.pronunciationDictionaries.rules.set` | Set Rules On The Pronunciation Dictionary |
| POST | `/v1/pronunciation-dictionaries/{pronunciation_dictionary_id}/add-rules` | `client.pronunciationDictionaries.rules.add` | Add Rules To The Pronunciation Dictionary |
| POST | `/v1/pronunciation-dictionaries/{pronunciation_dictionary_id}/remove-rules` | `client.pronunciationDictionaries.rules.remove` | Remove Rules From The Pronunciation Dictionary |
| GET | `/v1/pronunciation-dictionaries/{dictionary_id}/{version_id}/download` | `client.pronunciationDictionaries.download` | Get A Pls File With A Pronunciation Dictionary Version Rules |
| GET | `/v1/pronunciation-dictionaries` | `client.pronunciationDictionaries.list` | Get Pronunciation Dictionaries |

## Dubbing

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/dubbing/project` | `client.dubbing.project.create` | Create Dubbing Project |
| GET | `/v1/dubbing/project` | `client.dubbing.project.list` | List Dubbing Projects |
| GET | `/v1/dubbing/project/{project_id}` | `client.dubbing.project.get` | Get Dubbing Project |
| DELETE | `/v1/dubbing/project/{project_id}` | `client.dubbing.project.delete` | Delete Dubbing Project |
| POST | `/v1/dubbing/project/{project_id}/language` | `client.dubbing.project.language.create` | Create Dubbing Language Target |
| GET | `/v1/dubbing/project/{project_id}/language` | `client.dubbing.project.language.list` | List Dubbing Language Targets |
| GET | `/v1/dubbing/project/{project_id}/language/{language_id}` | `client.dubbing.project.language.get` | Get Dubbing Language Target |
| DELETE | `/v1/dubbing/project/{project_id}/language/{language_id}` | `client.dubbing.project.language.delete` | Delete Dubbing Language Target |
| GET | `/v1/dubbing/project/{project_id}/transcript` | `client.dubbing.project.transcript.get` | Get Dubbing Transcript |
| PATCH | `/v1/dubbing/project/{project_id}/transcript/segment/{segment_id}` | `client.dubbing.project.transcript.updateSegment` | Update Dubbing Transcript Segment |
| DELETE | `/v1/dubbing/project/{project_id}/transcript/segment/{segment_id}` | `client.dubbing.project.transcript.deleteSegment` | Delete Dubbing Transcript Segment |
| PATCH | `/v1/dubbing/project/{project_id}/transcript/segments` | `client.dubbing.project.transcript.updateSegments` | Update Dubbing Transcript Segments |
| POST | `/v1/dubbing/project/{project_id}/transcript/segment` | `client.dubbing.project.transcript.createSegment` | Add Dubbing Transcript Segment |
| GET | `/v1/dubbing/project/{project_id}/language/{language_id}/transcript` | `client.dubbing.project.language.transcript.get` | Get Dubbing Target Transcript |
| PATCH | `/v1/dubbing/project/{project_id}/language/{language_id}/transcript/segment/{segment_id}` | `client.dubbing.project.language.transcript.updateSegment` | Update Dubbing Target Transcript Segment |
| PATCH | `/v1/dubbing/project/{project_id}/language/{language_id}/transcript/segments` | `client.dubbing.project.language.transcript.updateSegments` | Update Dubbing Target Transcript Segments |
| POST | `/v1/dubbing/project/{project_id}/language/{language_id}/transcript/regenerate` | `client.dubbing.project.language.transcript.regenerate` | Regenerate Dubbing Target |
| GET | `/v1/dubbing/resource/{dubbing_id}` | `client.dubbing.resource.get` | Get The Dubbing Resource For An Id. **(deprecated)** |
| POST | `/v1/dubbing/resource/{dubbing_id}/language` | `client.dubbing.resource.language.add` | Add A Language To The Resource **(deprecated)** |
| POST | `/v1/dubbing/resource/{dubbing_id}/speaker/{speaker_id}/segment` | `client.dubbing.resource.speaker.segment.create` | Create A Segment For The Speaker **(deprecated)** |
| PATCH | `/v1/dubbing/resource/{dubbing_id}/segment/{segment_id}/{language}` | `client.dubbing.resource.segment.update` | Modify A Single Segment **(deprecated)** |
| POST | `/v1/dubbing/resource/{dubbing_id}/migrate-segments` | `client.dubbing.resource.migrateSegments` | Move Segments Between Speakers **(deprecated)** |
| DELETE | `/v1/dubbing/resource/{dubbing_id}/segment/{segment_id}` | `client.dubbing.resource.segment.delete` | Deletes A Single Segment **(deprecated)** |
| POST | `/v1/dubbing/resource/{dubbing_id}/transcribe` | `client.dubbing.resource.transcribe` | Transcribes Segments **(deprecated)** |
| POST | `/v1/dubbing/resource/{dubbing_id}/translate` | `client.dubbing.resource.translate` | Translates All Or Some Segments And Languages **(deprecated)** |
| POST | `/v1/dubbing/resource/{dubbing_id}/dub` | `client.dubbing.resource.dub` | Dubs All Or Some Segments And Languages **(deprecated)** |
| PATCH | `/v1/dubbing/resource/{dubbing_id}/speaker/{speaker_id}` | `client.dubbing.resource.speaker.update` | Update Metadata For A Speaker **(deprecated)** |
| POST | `/v1/dubbing/resource/{dubbing_id}/speaker` | `client.dubbing.resource.speaker.create` | Create A New Speaker **(deprecated)** |
| GET | `/v1/dubbing/resource/{dubbing_id}/speaker/{speaker_id}/similar-voices` | `client.dubbing.resource.speaker.findSimilarVoices` | Search The Elevenlabs Library For Voices Similar To A Speaker. **(deprecated)** |
| POST | `/v1/dubbing/resource/{dubbing_id}/render/{language}` | `client.dubbing.resource.render` | Render Audio Or Video For The Given Language **(deprecated)** |
| GET | `/v1/dubbing` | `client.dubbing.list` | List Dubs |
| POST | `/v1/dubbing` | `client.dubbing.create` | Dub A Video Or An Audio File |
| GET | `/v1/dubbing/{dubbing_id}` | `client.dubbing.get` | Get Dubbing |
| DELETE | `/v1/dubbing/{dubbing_id}` | `client.dubbing.delete` | Delete Dubbing |
| GET | `/v1/dubbing/{dubbing_id}/audio/{language_code}` | `client.dubbing.audio.get` | Get Dubbed File |
| GET | `/v1/dubbing/{dubbing_id}/transcript/{language_code}` | `client.dubbing.transcript.get`† | Get Dubbed Transcript **(deprecated)** |
| GET | `/v1/dubbing/{dubbing_id}/transcripts/{language_code}/format/{format_type}` | `client.dubbing.transcripts.get` | Retrieve A Transcript |

## Studio

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/studio/podcasts` | `client.studio.createPodcast` | Create Podcast |
| POST | `/v1/studio/projects/{project_id}/pronunciation-dictionaries` | `client.studio.projects.pronunciationDictionaries.create` | Create Pronunciation Dictionaries |
| GET | `/v1/studio/projects` | `client.studio.projects.list` | List Studio Projects |
| POST | `/v1/studio/projects` | `client.studio.projects.create` | Create Studio Project |
| POST | `/v1/studio/projects/{project_id}` | `client.studio.projects.update` | Update Studio Project |
| GET | `/v1/studio/projects/{project_id}` | `client.studio.projects.get` | Get Studio Project |
| DELETE | `/v1/studio/projects/{project_id}` | `client.studio.projects.delete` | Delete Studio Project |
| POST | `/v1/studio/projects/{project_id}/content` | `client.studio.projects.content.update` | Update Studio Project Content |
| POST | `/v1/studio/projects/{project_id}/convert` | `client.studio.projects.convert` | Convert Studio Project |
| GET | `/v1/studio/projects/{project_id}/snapshots` | `client.studio.projects.snapshots.list` | List Studio Project Snapshots |
| GET | `/v1/studio/projects/{project_id}/snapshots/{project_snapshot_id}` | `client.studio.projects.snapshots.get` | Get Project Snapshot |
| POST | `/v1/studio/projects/{project_id}/snapshots/{project_snapshot_id}/stream` | `client.studio.projects.snapshots.stream` | Stream Studio Project Audio |
| POST | `/v1/studio/projects/{project_id}/snapshots/{project_snapshot_id}/archive` | `client.studio.projects.snapshots.streamArchive` | Stream Archive With Studio Project Audio |
| GET | `/v1/studio/projects/{project_id}/chapters` | `client.studio.projects.chapters.list` | List Chapters |
| POST | `/v1/studio/projects/{project_id}/chapters` | `client.studio.projects.chapters.create` | Create Chapter |
| GET | `/v1/studio/projects/{project_id}/chapters/{chapter_id}` | `client.studio.projects.chapters.get` | Get Chapter |
| POST | `/v1/studio/projects/{project_id}/chapters/{chapter_id}` | `client.studio.projects.chapters.update` | Update Chapter |
| DELETE | `/v1/studio/projects/{project_id}/chapters/{chapter_id}` | `client.studio.projects.chapters.delete` | Delete Chapter |
| POST | `/v1/studio/projects/{project_id}/chapters/{chapter_id}/convert` | `client.studio.projects.chapters.convert` | Convert Chapter |
| GET | `/v1/studio/projects/{project_id}/chapters/{chapter_id}/snapshots` | `client.studio.projects.chapters.snapshots.list` | List Chapter Snapshots |
| GET | `/v1/studio/projects/{project_id}/chapters/{chapter_id}/snapshots/{chapter_snapshot_id}` | `client.studio.projects.chapters.snapshots.get` | Get Chapter Snapshot |
| POST | `/v1/studio/projects/{project_id}/chapters/{chapter_id}/snapshots/{chapter_snapshot_id}/stream` | `client.studio.projects.chapters.snapshots.stream` | Stream Chapter Audio |
| GET | `/v1/studio/projects/{project_id}/muted-tracks` | `client.studio.projects.getMutedTracks` | Get Project Muted Tracks |

## Productions

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/productions/orders` | `client.productions.orders.create` | Create Order |
| GET | `/v1/productions/orders` | `client.productions.orders.list` | List Orders |
| GET | `/v1/productions/orders/{order_id}` | `client.productions.orders.get` | Get Order |
| PATCH | `/v1/productions/orders/{order_id}` | `client.productions.orders.update` | Update Order |
| POST | `/v1/productions/orders/{order_id}/media` | `client.productions.orders.media.register` | Register Media |
| GET | `/v1/productions/orders/{order_id}/media/{media_id}` | `client.productions.orders.media.get` | Get Media Info |
| POST | `/v1/productions/orders/{order_id}/items` | `client.productions.orders.items.upsert` | Upsert Order Item |
| DELETE | `/v1/productions/orders/{order_id}/items/{item_id}` | `client.productions.orders.items.remove` | Remove Order Item |
| POST | `/v1/productions/orders/{order_id}/submit` | `client.productions.orders.submit` | Submit Order |
| GET | `/v1/productions/orders/{order_id}/deliverables` | `client.productions.orders.deliverables.list` | Get Order Deliverables |
| GET | `/v1/productions/orders/languages/{order_item_kind}` | `client.productions.orders.languages.list` | Get Available Languages |

## Audio Native

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/audio-native` | `client.audioNative.create` | Creates Audio Native Enabled Project. |
| GET | `/v1/audio-native/{project_id}/settings` | `client.audioNative.getSettings` | Get Audio Native Project Settings |
| POST | `/v1/audio-native/{project_id}/content` | `client.audioNative.update` | Update Audio-Native Project Content |
| POST | `/v1/audio-native/content` | `client.audioNative.updateContentFromUrl` | Update Audio-Native Content From Url |

## History

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| GET | `/v1/history` | `client.history.list` | List Generated Items |
| GET | `/v1/history/{history_item_id}` | `client.history.get` | Get History Item |
| DELETE | `/v1/history/{history_item_id}` | `client.history.delete` | Delete History Item |
| GET | `/v1/history/{history_item_id}/audio` | `client.history.getAudio` | Get Audio From History Item |
| POST | `/v1/history/download` | `client.history.download` | Download History Items |

## Image & Video (Flows)

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/flows/video` | `client.flows.video.create` | Create Video Generation |
| GET | `/v1/flows/video` | `client.flows.video.list` | List Video Generations |
| GET | `/v1/flows/video/{generation_id}` | `client.flows.video.get` | Get Video Generation |
| POST | `/v1/flows/image` | `client.flows.image.create` | Create Image Generation |
| GET | `/v1/flows/image` | `client.flows.image.list` | List Image Generations |
| GET | `/v1/flows/image/{generation_id}` | `client.flows.image.get` | Get Image Generation |
| POST | `/v1/flows/text-to-speech` | `client.flows.textToSpeech.create` | Create Speech Generation |
| GET | `/v1/flows/text-to-speech` | `client.flows.textToSpeech.list` | List Speech Generations |
| GET | `/v1/flows/text-to-speech/{generation_id}` | `client.flows.textToSpeech.get` | Get Speech Generation |
| POST | `/v1/flows/templates/{template_id}/runs` | `client.flows.templates.runs.create` | Create Template Run |
| GET | `/v1/flows/templates/{template_id}/runs` | `client.flows.templates.runs.list` | List Template Runs |
| GET | `/v1/flows/templates/{template_id}/runs/{run_id}` | `client.flows.templates.runs.get` | Get Template Run |
| GET | `/v1/flows/templates` | `client.flows.templates.list` | List Templates |
| GET | `/v1/flows/templates/{template_id}` | `client.flows.templates.get` | Get Template |

## Assets

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/assets` | `client.assets.create` | Upload Asset |
| GET | `/v1/assets` | `client.assets.list` | List Assets |
| GET | `/v1/assets/{asset_id}` | `client.assets.get` | Get Asset |
| DELETE | `/v1/assets/{asset_id}` | `client.assets.delete` | Delete Asset |

## Speech Engine

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| GET | `/v1/speech-engine` | `client.speechEngine.list` | List Speech Engines |
| POST | `/v1/speech-engine` | `client.speechEngine.create` | Create Speech Engine |
| GET | `/v1/speech-engine/{speech_engine_id}` | `client.speechEngine.get` | Get Speech Engine |
| PATCH | `/v1/speech-engine/{speech_engine_id}` | `client.speechEngine.update` | Update Speech Engine |
| DELETE | `/v1/speech-engine/{speech_engine_id}` | `client.speechEngine.delete` | Delete Speech Engine |
| POST | `/v1/speech-engine/{speech_engine_id}/duplicate` | `client.speechEngine.duplicate`† | Duplicate Speech Engine |

## Models

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| GET | `/v1/models` | `client.models.list` | Get Models |

## Tokens

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/single-use-token/{token_type}` | `client.tokens.singleUse.create` | Create Single Use Token |

## User & Usage

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| GET | `/v1/user` | `client.user.get` | Get User Info |
| GET | `/v1/user/subscription` | `client.user.subscription.get` | Get User Subscription Info |
| GET | `/v1/usage/character-stats` | `client.usage.get` | Get Characters Usage Metrics (Deprecated) **(deprecated)** |

## Workspace & Admin

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/workspaces/api-keys/disable` | `client.workspaces.apiKeys.disable` | Disable Api Key |
| POST | `/v1/workspaces/api-keys/third-party-disabling` | REST only | Set Workspace Third-Party Disabling Policy |
| GET | `/v1/service-accounts/{service_account_user_id}/api-keys` | `client.serviceAccounts.apiKeys.list` | Get Service Account Api Keys Route |
| POST | `/v1/service-accounts/{service_account_user_id}/api-keys` | `client.serviceAccounts.apiKeys.create` | Create Service Account Api Key |
| PATCH | `/v1/service-accounts/{service_account_user_id}/api-keys/{api_key_id}` | `client.serviceAccounts.apiKeys.update` | Edit Service Account Api Key |
| DELETE | `/v1/service-accounts/{service_account_user_id}/api-keys/{api_key_id}` | `client.serviceAccounts.apiKeys.delete` | Delete Service Account Api Key |
| GET | `/v1/workspace/audit-logs` | `client.workspace.auditLogs.list` | Get Workspace Audit Logs |
| POST | `/v1/workspace/auth-connections` | `client.workspace.authConnections.create` | Create Workspace Auth Connection |
| GET | `/v1/workspace/auth-connections` | `client.workspace.authConnections.list` | Get Workspace Auth Connections |
| PATCH | `/v1/workspace/auth-connections/{auth_connection_id}` | `client.workspace.authConnections.update` | Update Workspace Auth Connection |
| DELETE | `/v1/workspace/auth-connections/{auth_connection_id}` | `client.workspace.authConnections.delete` | Delete Workspace Auth Connection |
| GET | `/v1/service-accounts` | `client.serviceAccounts.list` | Get Workspace Service Accounts |
| POST | `/v1/service-accounts` | `client.serviceAccounts.create` | Create Service Account |
| GET | `/v1/workspace/groups` | `client.workspace.groups.list` | Get All Groups |
| GET | `/v1/workspace/groups/search` | `client.workspace.groups.search` | Search User Groups |
| POST | `/v1/workspace/groups/{group_id}/members/remove` | `client.workspace.groups.members.remove` | Delete Member From User Group |
| POST | `/v1/workspace/groups/{group_id}/members` | `client.workspace.groups.members.add` | Add Member To User Group |
| POST | `/v1/workspace/invites/add` | `client.workspace.invites.create` | Invite User |
| POST | `/v1/workspace/invites/add-bulk` | `client.workspace.invites.createBatch` | Invite Multiple Users |
| DELETE | `/v1/workspace/invites` | `client.workspace.invites.delete` | Delete Existing Invitation |
| GET | `/v1/workspace/members` | `client.workspace.members.list` | Get Workspace Members |
| POST | `/v1/workspace/members` | `client.workspace.members.update` | Update Member |
| GET | `/v1/workspace/resources/{resource_id}` | `client.workspace.resources.get` | Get Resource |
| POST | `/v1/workspace/resources/{resource_id}/share` | `client.workspace.resources.share` | Share Workspace Resource |
| POST | `/v1/workspace/resources/{resource_id}/unshare` | `client.workspace.resources.unshare` | Unshare Workspace Resource |
| GET | `/v1/workspace/webhooks` | `client.webhooks.list` | List Workspace Webhooks |
| POST | `/v1/workspace/webhooks` | `client.webhooks.create` | Create Workspace Webhook |
| PATCH | `/v1/workspace/webhooks/{webhook_id}` | `client.webhooks.update` | Update Workspace Webhook |
| DELETE | `/v1/workspace/webhooks/{webhook_id}` | `client.webhooks.delete` | Delete Workspace Webhook |
| POST | `/v1/workspace/analytics/query/usage-by-product-over-time` | `client.workspace.usage.getUsageByProductOverTime` | Get Workspace Usage |
| POST | `/v1/workspace/analytics/requests` | `client.workspace.analytics.requests.get` | List Api Requests |

## Agents › Agent tests

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/convai/agent-testing/create` | `client.conversationalAi.tests.create` | Create Agent Response Test |
| POST | `/v1/convai/agent-testing/folders` | `client.conversationalAi.tests.folders.create` | Create Agent Test Folder |
| GET | `/v1/convai/agent-testing/folders/{folder_id}` | `client.conversationalAi.tests.folders.get` | Get Agent Test Folder By Id |
| PATCH | `/v1/convai/agent-testing/folders/{folder_id}` | `client.conversationalAi.tests.folders.update` | Update Agent Test Folder |
| DELETE | `/v1/convai/agent-testing/folders/{folder_id}` | `client.conversationalAi.tests.folders.delete` | Delete Agent Test Folder |
| POST | `/v1/convai/agent-testing/bulk-move` | `client.conversationalAi.tests.move` | Bulk Move Tests To Folder |
| GET | `/v1/convai/agent-testing/{test_id}` | `client.conversationalAi.tests.get` | Get Agent Response Test By Id |
| PUT | `/v1/convai/agent-testing/{test_id}` | `client.conversationalAi.tests.update` | Update Agent Response Test |
| DELETE | `/v1/convai/agent-testing/{test_id}` | `client.conversationalAi.tests.delete` | Delete Agent Response Test |
| POST | `/v1/convai/agent-testing/summaries` | `client.conversationalAi.tests.summaries` | Get Agent Response Test Summaries By Ids |
| GET | `/v1/convai/agent-testing` | `client.conversationalAi.tests.list` | List Agent Response Tests |
| GET | `/v1/convai/test-invocations` | `client.conversationalAi.tests.invocations.list` | List Test Invocations |
| GET | `/v1/convai/test-invocations/{test_invocation_id}` | `client.conversationalAi.tests.invocations.get` | Get Test Invocation |
| POST | `/v1/convai/test-invocations/{test_invocation_id}/cancel` | `client.conversationalAi.tests.invocations.cancel`† | Cancel Test Invocation |
| POST | `/v1/convai/test-invocations/{test_invocation_id}/resubmit` | `client.conversationalAi.tests.invocations.resubmit` | Resubmit Tests |

## Agents › Agents

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/convai/agents/create` | `client.conversationalAi.agents.create` | Create Agent |
| GET | `/v1/convai/agents/summaries` | `client.conversationalAi.agents.summaries.get` | Get Agent Summaries |
| GET | `/v1/convai/agents/{agent_id}` | `client.conversationalAi.agents.get` | Get Agent |
| PATCH | `/v1/convai/agents/{agent_id}` | `client.conversationalAi.agents.update` | Patches An Agent Settings |
| DELETE | `/v1/convai/agents/{agent_id}` | `client.conversationalAi.agents.delete` | Delete Agent |
| GET | `/v1/convai/agents/{agent_id}/widget` | `client.conversationalAi.agents.widget.get` | Get Agent Widget Config |
| GET | `/v1/convai/agents/{agent_id}/link` | `client.conversationalAi.agents.link.get` | Get Shareable Agent Link |
| POST | `/v1/convai/agents/{agent_id}/avatar` | `client.conversationalAi.agents.widget.avatar.create` | Post Agent Avatar |
| POST | `/v1/convai/agents/{agent_id}/hold-audio` | `client.conversationalAi.agents.holdAudio.create` | Post Agent Hold Audio |
| DELETE | `/v1/convai/agents/{agent_id}/hold-audio` | `client.conversationalAi.agents.holdAudio.delete` | Delete Agent Hold Audio |
| GET | `/v1/convai/agents` | `client.conversationalAi.agents.list` | List Agents |
| POST | `/v1/convai/agents/{agent_id}/duplicate` | `client.conversationalAi.agents.duplicate` | Duplicate Agent |
| POST | `/v1/convai/agents/{agent_id}/simulate-conversation` | `client.conversationalAi.agents.simulateConversation` | Simulates A Conversation **(deprecated)** |
| POST | `/v1/convai/agents/{agent_id}/simulate-conversation/stream` | `client.conversationalAi.agents.simulateConversationStream` | Simulates A Conversation (Stream) **(deprecated)** |
| POST | `/v1/convai/agents/{agent_id}/run-tests` | `client.conversationalAi.agents.runTests` | Run Tests On The Agent |
| GET | `/v1/convai/agents/{agent_id}/triage-tickets` | `client.conversationalAi.triageTickets.list` | List Agent Conversation Tickets |
| POST | `/v1/convai/agents/{agent_id}/triage-tickets` | `client.conversationalAi.triageTickets.createManual` | Create Manual Agent Ticket |
| GET | `/v1/convai/agents/{agent_id}/triage-tickets/assignable-users` | `client.conversationalAi.triageTickets.listAssignableUsers` | Get Agent Conversation Ticket Assignable Users |
| POST | `/v1/convai/agents/{agent_id}/knowledge-base/rag-query` | REST only | Query Agent Knowledge Base Rag |
| GET | `/v1/convai/agents/{agent_id}/topics` | `client.conversationalAi.conversations.topics.get` | Get Agent Conversation Topics |
| POST | `/v1/convai/agents/{agent_id}/branches` | `client.conversationalAi.agents.branches.create` | Create A New Branch |
| GET | `/v1/convai/agents/{agent_id}/branches` | `client.conversationalAi.agents.branches.list` | List Agent Branches |
| GET | `/v1/convai/agents/{agent_id}/branches/{branch_id}` | `client.conversationalAi.agents.branches.get` | Get Agent Branch |
| PATCH | `/v1/convai/agents/{agent_id}/branches/{branch_id}` | `client.conversationalAi.agents.branches.update` | Update Agent Branch |
| GET | `/v1/convai/agents/{agent_id}/versions/{version_id}` | `client.conversationalAi.agents.versions.get` | Get Agent Version Metadata |
| GET | `/v1/convai/agents/{agent_id}/branches/{source_branch_id}/merge-preview` | `client.conversationalAi.agents.branches.previewMerge` | Preview Merged Configuration |
| POST | `/v1/convai/agents/{agent_id}/branches/{source_branch_id}/merge` | `client.conversationalAi.agents.branches.merge` | Merge A Branch Into A Target Branch |
| GET | `/v1/convai/agents/{agent_id}/branches/{branch_id}/rebase-preview` | `client.conversationalAi.agents.branches.previewRebase` | Preview Rebased Configuration |
| POST | `/v1/convai/agents/{agent_id}/branches/{branch_id}/rebase` | `client.conversationalAi.agents.branches.rebase` | Rebase A Branch Onto Main |
| POST | `/v1/convai/agents/{agent_id}/deployments` | `client.conversationalAi.agents.deployments.create` | Create Or Update Deployments |
| GET | `/v1/convai/agents/{agent_id}/deployments` | `client.conversationalAi.agents.deployments.list`† | List Agent Deployments |
| POST | `/v1/convai/agents/{agent_id}/drafts` | `client.conversationalAi.agents.drafts.create` | Create Agent Draft |
| DELETE | `/v1/convai/agents/{agent_id}/drafts` | `client.conversationalAi.agents.drafts.delete` | Delete Agent Draft |
| POST | `/v1/convai/agents/{agent_id}/merge-proposals` | `client.conversationalAi.agents.mergeProposals.create`† | Create A Merge Proposal |
| GET | `/v1/convai/agents/{agent_id}/merge-proposals` | `client.conversationalAi.agents.mergeProposals.list`† | List Proposals |
| GET | `/v1/convai/agents/{agent_id}/merge-proposals/{merge_proposal_id}` | `client.conversationalAi.agents.mergeProposals.get`† | Get A Merge Proposal |
| PATCH | `/v1/convai/agents/{agent_id}/merge-proposals/{merge_proposal_id}` | `client.conversationalAi.agents.mergeProposals.update`† | Update A Merge Proposal |
| POST | `/v1/convai/agents/{agent_id}/merge-proposals/{merge_proposal_id}/reviews` | `client.conversationalAi.agents.mergeProposals.submitReview`† | Review A Merge Proposal |
| POST | `/v1/convai/agents/{agent_id}/merge-proposals/{merge_proposal_id}/comments` | `client.conversationalAi.agents.mergeProposals.addComment`† | Comment On A Merge Proposal |
| POST | `/v1/convai/agents/{agent_id}/merge-proposals/{merge_proposal_id}/merge` | `client.conversationalAi.agents.mergeProposals.merge`† | Merge A Merge Proposal |
| POST | `/v1/convai/agents/{agent_id}/branches/{branch_id}/procedures` | `client.conversationalAi.agents.procedures.create` | Create Procedure |
| GET | `/v1/convai/agents/{agent_id}/branches/{branch_id}/procedures` | `client.conversationalAi.agents.procedures.list` | List Procedures |
| POST | `/v1/convai/agents/{agent_id}/branches/{branch_id}/procedures/compile` | `client.conversationalAi.agents.procedures.compile` | Legacy: Compile Procedures |
| DELETE | `/v1/convai/agents/{agent_id}/branches/{branch_id}/procedures/{procedure_id}` | `client.conversationalAi.agents.procedures.remove` | Remove Procedure |
| GET | `/v1/convai/agents/{agent_id}/branches/{branch_id}/procedures/{procedure_id}` | `client.conversationalAi.agents.procedures.get` | Get Procedure |
| GET | `/v1/convai/agents/{agent_id}/branches/{branch_id}/procedures/{procedure_id}/draft` | `client.conversationalAi.agents.procedures.drafts.get` | Get Procedure Draft |
| PATCH | `/v1/convai/agents/{agent_id}/branches/{branch_id}/procedures/{procedure_id}/draft` | `client.conversationalAi.agents.procedures.drafts.update` | Update Procedure Draft |
| DELETE | `/v1/convai/agents/{agent_id}/branches/{branch_id}/procedures/{procedure_id}/draft` | `client.conversationalAi.agents.procedures.drafts.delete` | Delete Procedure Draft |

## Agents › Batch calling

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/convai/batch-calling/submit` | `client.conversationalAi.batchCalls.create` | Submit A Batch Call Request. |
| GET | `/v1/convai/batch-calling/workspace` | `client.conversationalAi.batchCalls.list` | Get All Batch Calls For A Workspace. |
| GET | `/v1/convai/batch-calling/{batch_id}` | `client.conversationalAi.batchCalls.get` | Get A Batch Call By Id. |
| DELETE | `/v1/convai/batch-calling/{batch_id}` | `client.conversationalAi.batchCalls.delete` | Delete A Batch Call. |
| POST | `/v1/convai/batch-calling/{batch_id}/cancel` | `client.conversationalAi.batchCalls.cancel` | Cancel A Batch Call. |
| POST | `/v1/convai/batch-calling/{batch_id}/retry` | `client.conversationalAi.batchCalls.retry` | Retry A Batch Call. |
| GET | `/v1/convai/batch-calling/{batch_id}/export` | `client.conversationalAi.batchCalls.export` | Export Batch Call Results |

## Agents › Conversations

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| GET | `/v1/convai/conversation/get-signed-url` | `client.conversationalAi.conversations.getSignedUrl` | Get Signed Url |
| GET | `/v1/convai/conversation/get_signed_url` | REST only | Get Signed Url **(deprecated)** |
| GET | `/v1/convai/conversation/token` | `client.conversationalAi.conversations.getWebrtcToken` | Get Webrtc Token |
| GET | `/v1/convai/conversations` | `client.conversationalAi.conversations.list` | Get Conversations |
| GET | `/v1/convai/conversations/resolve` | `client.conversationalAi.conversations.resolve` | Resolve Conversation Reference |
| GET | `/v1/convai/conversations/{conversation_id}` | `client.conversationalAi.conversations.get` | Get Conversation Details |
| DELETE | `/v1/convai/conversations/{conversation_id}` | `client.conversationalAi.conversations.delete` | Delete Conversation |
| GET | `/v1/convai/conversations/{conversation_id}/summary` | `client.conversationalAi.conversations.getSummary` | Get Conversation Summary |
| GET | `/v1/convai/conversations/{conversation_id}/sip-messages` | `client.conversationalAi.conversations.getSipMessages` | Get Sip Messages For A Conversation |
| GET | `/v1/convai/conversations/{conversation_id}/audio` | `client.conversationalAi.conversations.audio.get` | Get Conversation Audio |
| POST | `/v1/convai/conversations/{conversation_id}/feedback` | `client.conversationalAi.conversations.feedback.create` | Send Conversation Feedback |
| GET | `/v1/convai/conversations/messages/text-search` | `client.conversationalAi.conversations.messages.textSearch` | Text Search Conversation Messages |
| GET | `/v1/convai/conversations/messages/smart-search` | `client.conversationalAi.conversations.messages.search` | Smart Search Conversation Messages |
| POST | `/v1/convai/conversations/{conversation_id}/tags` | `client.conversationalAi.conversations.tags.assign` | Assign Conversation Tags |
| DELETE | `/v1/convai/conversations/{conversation_id}/tags/{tag_id}` | `client.conversationalAi.conversations.tags.unassign` | Unassign Conversation Tag |
| POST | `/v1/convai/conversations/{conversation_id}/files` | `client.conversationalAi.conversations.files.create` | Upload File |
| DELETE | `/v1/convai/conversations/{conversation_id}/files/{file_id}` | `client.conversationalAi.conversations.files.delete` | Delete File Upload |
| POST | `/v1/convai/conversations/{conversation_id}/analysis/run` | `client.conversationalAi.conversations.analysis.run` | Run Conversation Analysis |
| POST | `/v1/convai/conversations/{conversation_id}/analysis/evaluations/run` | `client.conversationalAi.conversations.analysis.runEvaluation` | Run Conversation Evaluation |

## Agents › Knowledge base

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| GET | `/v1/convai/knowledge-base/summaries` | `client.conversationalAi.knowledgeBase.documents.summaries.get` | Get Knowledge Base Summaries By Ids |
| POST | `/v1/convai/knowledge-base` | `client.conversationalAi.addToKnowledgeBase` | Add To Knowledge Base **(deprecated)** |
| GET | `/v1/convai/knowledge-base` | `client.conversationalAi.knowledgeBase.list` | Get Knowledge Base List |
| POST | `/v1/convai/knowledge-base/url` | `client.conversationalAi.knowledgeBase.documents.createFromUrl` | Create Url Document |
| POST | `/v1/convai/knowledge-base/crawl` | `client.conversationalAi.knowledgeBase.crawlJobs.create` | Create Crawl Job |
| GET | `/v1/convai/knowledge-base/crawl` | `client.conversationalAi.knowledgeBase.crawlJobs.list` | List Ongoing And Recent Crawl Jobs Created By A User |
| GET | `/v1/convai/knowledge-base/crawl/{crawl_job_id}` | `client.conversationalAi.knowledgeBase.crawlJobs.get` | Get Crawl Job Details |
| POST | `/v1/convai/knowledge-base/crawl/{crawl_job_id}/cancel` | `client.conversationalAi.knowledgeBase.crawlJobs.cancel` | Cancel Crawl Job |
| POST | `/v1/convai/knowledge-base/file` | `client.conversationalAi.knowledgeBase.documents.createFromFile` | Create File Document |
| POST | `/v1/convai/knowledge-base/text` | `client.conversationalAi.knowledgeBase.documents.createFromText` | Create Text Document |
| POST | `/v1/convai/knowledge-base/folder` | `client.conversationalAi.knowledgeBase.documents.createFolder` | Create Folder |
| PATCH | `/v1/convai/knowledge-base/{documentation_id}` | `client.conversationalAi.knowledgeBase.documents.update` | Update Document |
| GET | `/v1/convai/knowledge-base/{documentation_id}` | `client.conversationalAi.knowledgeBase.documents.get` | Get Documentation From Knowledge Base |
| DELETE | `/v1/convai/knowledge-base/{documentation_id}` | `client.conversationalAi.knowledgeBase.documents.delete` | Delete Knowledge Base Document Or Folder |
| PATCH | `/v1/convai/knowledge-base/{documentation_id}/update-file` | `client.conversationalAi.knowledgeBase.document.updateFile` | Update File Document |
| POST | `/v1/convai/knowledge-base/rag-index` | `client.conversationalAi.knowledgeBase.getOrCreateRagIndexes` | Compute Rag Indexes In Batch |
| GET | `/v1/convai/knowledge-base/rag-index` | `client.conversationalAi.ragIndexOverview` | Get Rag Index Overview. |
| POST | `/v1/convai/knowledge-base/{documentation_id}/refresh` | `client.conversationalAi.knowledgeBase.document.refresh` | Refresh Url Document Content |
| POST | `/v1/convai/knowledge-base/{documentation_id}/rag-index` | `client.conversationalAi.knowledgeBase.document.computeRagIndex` | Compute Rag Index. |
| GET | `/v1/convai/knowledge-base/{documentation_id}/rag-index` | `client.conversationalAi.getDocumentRagIndexes` | Get Rag Indexes Of The Specified Knowledgebase Document. |
| DELETE | `/v1/convai/knowledge-base/{documentation_id}/rag-index/{rag_index_id}` | `client.conversationalAi.deleteDocumentRagIndex` | Delete Rag Index. |
| GET | `/v1/convai/knowledge-base/search` | `client.conversationalAi.knowledgeBase.search` | Search Knowledge Base Content |
| GET | `/v1/convai/knowledge-base/{documentation_id}/dependent-agents` | `client.conversationalAi.knowledgeBase.documents.getAgents` | Get Dependent Agents List |
| POST | `/v1/convai/knowledge-base/dependent-agents` | `client.conversationalAi.knowledgeBase.documents.getBulkAgents` | Get Dependent Agents For Multiple Documents |
| GET | `/v1/convai/knowledge-base/{documentation_id}/content` | `client.conversationalAi.knowledgeBase.documents.getContent` | Get Document Content |
| GET | `/v1/convai/knowledge-base/{documentation_id}/source-file-url` | `client.conversationalAi.knowledgeBase.documents.getSourceFileUrl` | Get Document Source File Url |
| GET | `/v1/convai/knowledge-base/{documentation_id}/chunk/{chunk_id}` | `client.conversationalAi.knowledgeBase.documents.chunk.get` | Get Documentation Chunk From Knowledge Base |
| GET | `/v1/convai/knowledge-base/{documentation_id}/chunks` | `client.conversationalAi.knowledgeBase.documents.chunks.list` | Get All Rag Chunks For A Document |
| POST | `/v1/convai/knowledge-base/{document_id}/move` | `client.conversationalAi.knowledgeBase.documents.move` | Move Entity To Folder |
| POST | `/v1/convai/knowledge-base/bulk-move` | `client.conversationalAi.knowledgeBase.documents.bulkMove` | Bulk Move Entities To Folder |
| POST | `/v1/convai/knowledge-base/bulk-delete` | `client.conversationalAi.knowledgeBase.documents.bulkDelete` | Bulk Delete Knowledge Base Documents |

## Agents › LLM usage

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/convai/llm-usage/calculate` | `client.conversationalAi.llmUsage.calculate` | Calculate Expected Llm Usage |
| GET | `/v1/convai/llm/list` | `client.conversationalAi.llm.list` | List Available Llms |

## Agents › MCP servers

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/convai/mcp-servers` | `client.conversationalAi.mcpServers.create` | Create Mcp Server |
| GET | `/v1/convai/mcp-servers` | `client.conversationalAi.mcpServers.list` | List Mcp Servers |
| GET | `/v1/convai/mcp-servers/{mcp_server_id}` | `client.conversationalAi.mcpServers.get` | Get Mcp Server |
| DELETE | `/v1/convai/mcp-servers/{mcp_server_id}` | `client.conversationalAi.mcpServers.delete` | Delete Mcp Server |
| PATCH | `/v1/convai/mcp-servers/{mcp_server_id}` | `client.conversationalAi.mcpServers.update` | Update Mcp Server Configuration |
| GET | `/v1/convai/mcp-servers/{mcp_server_id}/tools` | `client.conversationalAi.mcpServers.tools.list` | List Mcp Server Tools |
| PATCH | `/v1/convai/mcp-servers/{mcp_server_id}/approval-policy` | `client.conversationalAi.mcpServers.approvalPolicy.update` | Update Mcp Server Approval Policy **(deprecated)** |
| POST | `/v1/convai/mcp-servers/{mcp_server_id}/tool-approvals` | `client.conversationalAi.mcpServers.toolApprovals.create` | Create Mcp Server Tool Approval |
| DELETE | `/v1/convai/mcp-servers/{mcp_server_id}/tool-approvals/{tool_name}` | `client.conversationalAi.mcpServers.toolApprovals.delete` | Delete Mcp Server Tool Approval |
| POST | `/v1/convai/mcp-servers/{mcp_server_id}/tool-configs` | `client.conversationalAi.mcpServers.toolConfigs.create` | Create Mcp Tool Configuration Override |
| GET | `/v1/convai/mcp-servers/{mcp_server_id}/tool-configs/{tool_name}` | `client.conversationalAi.mcpServers.toolConfigs.get` | Get Mcp Tool Configuration Override |
| PATCH | `/v1/convai/mcp-servers/{mcp_server_id}/tool-configs/{tool_name}` | `client.conversationalAi.mcpServers.toolConfigs.update` | Update Mcp Tool Configuration Override |
| DELETE | `/v1/convai/mcp-servers/{mcp_server_id}/tool-configs/{tool_name}` | `client.conversationalAi.mcpServers.toolConfigs.delete` | Delete Mcp Tool Configuration Override |

## Agents › Misc (users, analytics, env vars, Exotel)

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/convai/exotel/outbound-call` | `client.conversationalAi.exotel.outboundCall` | Handle An Outbound Call Via Exotel |
| GET | `/v1/convai/agent/{agent_id}/knowledge-base/size` | `client.conversationalAi.agents.knowledgeBase.size` | Returns The Size Of The Agent'S Knowledge Base |
| POST | `/v1/convai/agent/{agent_id}/llm-usage/calculate` | `client.conversationalAi.agents.llmUsage.calculate` | Calculate Expected Llm Usage For An Agent |
| GET | `/v1/convai/users` | `client.conversationalAi.users.list` | Get Conversation Users |
| GET | `/v1/convai/analytics/live-count` | `client.conversationalAi.analytics.liveCount.get` | Get Live Count |
| GET | `/v1/convai/environment-variables` | `client.environmentVariables.list` | List Environment Variables |
| POST | `/v1/convai/environment-variables` | `client.environmentVariables.create` | Create Environment Variable |
| GET | `/v1/convai/environment-variables/{env_var_id}` | `client.environmentVariables.get` | Get Environment Variable |
| PATCH | `/v1/convai/environment-variables/{env_var_id}` | `client.environmentVariables.update` | Update Environment Variable |

## Agents › Phone numbers

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/convai/phone-numbers` | `client.conversationalAi.phoneNumbers.create` | Import Phone Number |
| GET | `/v1/convai/phone-numbers` | `client.conversationalAi.phoneNumbers.list` | List Phone Numbers |
| GET | `/v1/convai/phone-numbers/{phone_number_id}` | `client.conversationalAi.phoneNumbers.get` | Get Phone Number |
| DELETE | `/v1/convai/phone-numbers/{phone_number_id}` | `client.conversationalAi.phoneNumbers.delete` | Delete Phone Number |
| PATCH | `/v1/convai/phone-numbers/{phone_number_id}` | `client.conversationalAi.phoneNumbers.update` | Update Phone Number |
| GET | `/v1/convai/v2/phone-numbers` | `client.conversationalAi.phoneNumbers.listV2`† | List Phone Numbers Page |
| GET | `/v1/convai/phone-numbers/{phone_number_id}/sip-messages` | `client.conversationalAi.phoneNumbers.getSipMessages` | Get Sip Messages For A Phone Number |

## Agents › Secrets & settings

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| GET | `/v1/convai/settings` | `client.conversationalAi.settings.get` | Get Convai Settings |
| PATCH | `/v1/convai/settings` | `client.conversationalAi.settings.update` | Update Convai Settings |
| GET | `/v1/convai/settings/dashboard` | `client.conversationalAi.dashboard.settings.get` | Get Convai Dashboard Settings |
| PATCH | `/v1/convai/settings/dashboard` | `client.conversationalAi.dashboard.settings.update` | Update Convai Dashboard Settings |
| POST | `/v1/convai/secrets` | `client.conversationalAi.secrets.create` | Create Convai Workspace Secret |
| GET | `/v1/convai/secrets` | `client.conversationalAi.secrets.list` | Get Convai Workspace Secrets |
| GET | `/v1/convai/secrets/{secret_id}` | `client.conversationalAi.secrets.get` | Get Convai Workspace Secret |
| DELETE | `/v1/convai/secrets/{secret_id}` | `client.conversationalAi.secrets.delete` | Delete Convai Workspace Secret |
| PATCH | `/v1/convai/secrets/{secret_id}` | `client.conversationalAi.secrets.update` | Update Convai Workspace Secret |
| GET | `/v1/convai/secrets/{secret_id}/dependencies/{resource_type}` | `client.conversationalAi.secrets.getDependencies` | Get Secret Dependencies By Type |

## Agents › Tags

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| GET | `/v1/convai/tags` | `client.conversationalAi.conversations.tags.list` | List Conversation Tags |
| POST | `/v1/convai/tags` | `client.conversationalAi.conversations.tags.create` | Create Conversation Tag |
| GET | `/v1/convai/tags/{tag_id}` | `client.conversationalAi.conversations.tags.get` | Get Conversation Tag |
| PATCH | `/v1/convai/tags/{tag_id}` | `client.conversationalAi.conversations.tags.update` | Update Conversation Tag |
| DELETE | `/v1/convai/tags/{tag_id}` | `client.conversationalAi.conversations.tags.delete` | Delete Conversation Tag |

## Agents › Telephony (Twilio/SIP/WhatsApp)

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/convai/twilio/outbound-call` | `client.conversationalAi.twilio.outboundCall` | Handle An Outbound Call Via Twilio |
| POST | `/v1/convai/twilio/register-call` | `client.conversationalAi.twilio.registerCall` | Register A Twilio Call And Return Twiml |
| POST | `/v1/convai/whatsapp/outbound-call` | `client.conversationalAi.whatsapp.outboundCall` | Make An Outbound Call Via Whatsapp |
| POST | `/v1/convai/whatsapp/outbound-message` | `client.conversationalAi.whatsapp.outboundMessage` | Send An Outbound Message Via Whatsapp |
| POST | `/v1/convai/sip-trunk/outbound-call` | `client.conversationalAi.sipTrunk.outboundCall` | Handle An Outbound Call Via Sip Trunk |
| GET | `/v1/convai/whatsapp-accounts/{phone_number_id}` | `client.conversationalAi.whatsappAccounts.get` | Get Whatsapp Account |
| PATCH | `/v1/convai/whatsapp-accounts/{phone_number_id}` | `client.conversationalAi.whatsappAccounts.update` | Update Whatsapp Account |
| DELETE | `/v1/convai/whatsapp-accounts/{phone_number_id}` | `client.conversationalAi.whatsappAccounts.delete` | Delete Whatsapp Account |
| GET | `/v1/convai/whatsapp-accounts` | `client.conversationalAi.whatsappAccounts.list` | List Whatsapp Accounts |

## Agents › Tools

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| POST | `/v1/convai/tools` | `client.conversationalAi.tools.create` | Add Tool |
| GET | `/v1/convai/tools` | `client.conversationalAi.tools.list` | Get Tools |
| GET | `/v1/convai/tools/{tool_id}` | `client.conversationalAi.tools.get` | Get Tool |
| PATCH | `/v1/convai/tools/{tool_id}` | `client.conversationalAi.tools.update` | Update Tool |
| DELETE | `/v1/convai/tools/{tool_id}` | `client.conversationalAi.tools.delete` | Delete Tool |
| GET | `/v1/convai/tools/{tool_id}/dependent-agents` | `client.conversationalAi.tools.getDependentAgents` | Get Dependent Agents List |
| GET | `/v1/convai/tools/{tool_id}/executions` | `client.conversationalAi.tools.executions.get` | Get Tool Executions |

## Agents › Triage tickets

| Method | Path | JS SDK | Summary |
| --- | --- | --- | --- |
| GET | `/v1/convai/triage-tickets` | `client.conversationalAi.triageTickets.listForWorkspace` | List Workspace Conversation Tickets |
| POST | `/v1/convai/triage-tickets` | `client.conversationalAi.triageTickets.create` | Create Agent Conversation Ticket |
| GET | `/v1/convai/triage-tickets/{agentqa_ticket_id}` | `client.conversationalAi.triageTickets.get` | Get Agent Conversation Ticket |
| PATCH | `/v1/convai/triage-tickets/{agentqa_ticket_id}` | `client.conversationalAi.triageTickets.update` | Update Agent Conversation Ticket |
| DELETE | `/v1/convai/triage-tickets/{agentqa_ticket_id}` | `client.conversationalAi.triageTickets.delete` | Delete Agent Conversation Ticket |
| POST | `/v1/convai/triage-tickets/{agentqa_ticket_id}/comments` | `client.conversationalAi.triageTickets.addComment` | Add Comment To Agent Conversation Ticket |
| POST | `/v1/convai/triage-tickets/{agentqa_ticket_id}/turn-comments` | `client.conversationalAi.triageTickets.addTurnComment` | Add Turn Comment To Agent Conversation Ticket |
