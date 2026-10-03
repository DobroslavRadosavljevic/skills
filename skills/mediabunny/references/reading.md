# Reading Media Files

Contents: Input setup · input formats · sources · file metadata · track metadata · track queries · pairability · disposal · init inputs · encrypted media.

## Input setup

```ts
import { Input, ALL_FORMATS, BlobSource } from 'mediabunny';

using input = new Input({
	formats: ALL_FORMATS,          // or [MP4, WEBM, MP3] for a smaller bundle
	source: new BlobSource(file),  // where bytes come from
	// initInput?: Input,          // separate init segment (CMAF)
	// formatOptions?: { isobmff?: {...}, hls?: {...} },
});
```

- Construction reads nothing. Errors for unknown formats surface on the first read (`UnsupportedInputFormatError`).
- `await input.canRead()` checks format support without throwing.
- `using` disposes at scope exit. `input.dispose()` cancels reads, closes decoders, and makes later calls throw `InputDisposedError`.

## Input formats

Singletons: `MP4`, `QTFF`, `MATROSKA`, `WEBM`, `MP3`, `WAVE`, `OGG`, `ADTS`, `FLAC`, `MPEG_TS`, `HLS`. Lists: `ALL_FORMATS`, `HLS_FORMATS` (HLS + common segment formats).

Classes for `instanceof`: `IsobmffInputFormat` (`Mp4InputFormat`, `QuickTimeInputFormat`), `MatroskaInputFormat` (`WebMInputFormat`), `Mp3InputFormat`, `WaveInputFormat`, `OggInputFormat`, `AdtsInputFormat`, `FlacInputFormat`, `MpegTsInputFormat`, `HlsInputFormat`.

```ts
const format = await input.getFormat();
format.name;      // 'MP4'
format.mimeType;  // 'video/mp4'
format === MP3;   // exact check
format instanceof MatroskaInputFormat; // MKV or WebM
```

## Sources

All sources: `source.on('read', ({ start, end }) => …)`, `source.slice(offset, length?)` → `RangedSource` (embedded files), `getSize()` / `getSizeOrNull()`, `ref()` → `SourceRef` (reference counting; source disposes when all refs `free()`).

| Source | Use | Notes |
| --- | --- | --- |
| `BufferSource(arrayBuffer \| uint8Array)` | Bytes already in memory | Fastest; whole file in RAM |
| `BlobSource(blob, { maxCacheSize?, handleUnhandledError? })` | `File` from `<input type=file>`, drag-drop, OPFS file | Random access from disk; default cache 8 MiB |
| `UrlSource(url \| URL \| Request, opts?)` | Remote files, HLS | Range requests + adaptive prefetch; needs CORS; is a `PathedSource` |
| `FilePathSource(path, opts?)` | Node / Bun / Deno files | Is a `PathedSource`; **dispose the Input** to close the handle |
| `CustomSource({ getSize, read, dispose?, maxCacheSize?, prefetchProfile?, handleUnhandledError? })` | Any random-access store (S3 ranged GET, IndexedDB chunks) | `read(start, end)` returns bytes or a `ReadableStream<Uint8Array>`; `0 <= start < end <= size`; `prefetchProfile: 'none' \| 'fileSystem' \| 'network'` |
| `ReadableStreamSource(readable, { maxCacheSize? })` | Unknown-length append-only streams (uploads, MediaRecorder) | Unsized; sequential access only; default cache 16 MiB |
| `CustomPathedSource(rootPath, ({ path, isRoot }) => Source)` | Multi-file media from custom storage (OPFS, zip, map) | Called lazily per file |

`UrlSourceOptions`:

```ts
{
	requestInit?: Omit<RequestInit, 'signal'>, // headers, credentials, …; abort by disposing the Input
	getRetryDelay?: (attempts, error, url) => number | null, // seconds; null stops retrying
	maxCacheSize?: number,   // default 8 MiB
	parallelism?: number,    // default 2
	fetchFn?: typeof fetch,  // e.g. expo/fetch on React Native (needs streaming bodies)
	handleUnhandledError?: (error) => unknown,
}
```

Default retry: exponential backoff capped at 16 s, infinite; no retries when a CORS failure is suspected.

## File-level metadata

```ts
await input.getFormat();                 // InputFormat
await input.getMimeType();               // 'video/mp4; codecs="avc1.42c032, mp4a.40.2"'
await input.computeDuration();           // max end timestamp over tracks (may scan)
await input.getDurationFromMetadata();   // number | null, cheap
await input.getFirstTimestamp();         // min start timestamp
await input.getMetadataTags();           // MetadataTags
```

Each accepts an optional `tracks` array first to restrict the calculation. For live media, pass `{ skipLiveWait: true }` (second arg) or the call waits for the stream to end.

`MetadataTags`: `title`, `description`, `artist`, `album`, `albumArtist`, `trackNumber`, `tracksTotal`, `discNumber`, `discsTotal`, `beatsPerMinute` (1.59+), `genre`, `date: Date`, `lyrics`, `comment`, `images: AttachedImage[]` (`{ data, mimeType, kind: 'coverFront' | 'coverBack' | 'unknown', name?, description? }`), `raw: Record<string, string | string[] | Uint8Array | RichImageData | AttachedFile | Record<string,string> | null>` (container-native keys such as ID3 `TBPM`; repeated Vorbis comments become `string[]`).

## Tracks

```ts
await input.getTracks();            // InputTrack[]
await input.getVideoTracks();       // InputVideoTrack[]
await input.getAudioTracks();       // InputAudioTrack[]
await input.getPrimaryVideoTrack(); // InputVideoTrack | null
await input.getPrimaryAudioTrack(); // InputAudioTrack | null
```

Subtitle tracks are not exposed for reading.

### Track queries

All of the above (and the pairable-track helpers) take `InputTrackQuery { filter?, sortBy? }`. `sortBy` returns a number or a number array (lexicographic). Helpers: `asc(x)`, `desc(x)`, `prefer(bool)`.

```ts
import { desc, prefer } from 'mediabunny';

const best = await input.getPrimaryVideoTrack({
	filter: async t => !(await t.hasOnlyKeyPackets()),          // skip I-frame-only tracks
	sortBy: async t => [desc(await t.getDisplayHeight()), desc(await t.getBitrate() ?? 0)],
});
const audio = await input.getPrimaryAudioTrack({
	sortBy: async t => prefer(await t.getLanguageCode() === 'eng'),
});
```

### Common track metadata (`InputTrack`)

| Member | Meaning |
| --- | --- |
| `id` | Unique id in the file |
| `number` | 1-based index among tracks of the same type |
| `type` / `isVideoTrack()` / `isAudioTrack()` | `'video' \| 'audio' \| 'subtitle'` |
| `getCodec()` | `MediaCodec \| null` (null = unknown to Mediabunny) |
| `getInternalCodecId()` | Raw container codec id when `getCodec()` is null |
| `getCodecParameterString()` | Full codec string, e.g. `'avc1.42001f'` |
| `canDecode()` | Real decoder check for this track's config (includes custom decoders) |
| `getDecoderConfig()` | WebCodecs `VideoDecoderConfig` / `AudioDecoderConfig` or null |
| `getLanguageCode()` | ISO 639-2/T, `'und'` if unknown |
| `getName()` | Track title or null |
| `getDisposition()` | `{ default, primary, forced, original, commentary, hearingImpaired, visuallyImpaired }` |
| `getBitrate()` / `getAverageBitrate()` | From metadata only (HLS `BANDWIDTH`, ISOBMFF `btrt`), else null |
| `hasOnlyKeyPackets()` | All-intra track (HLS I-frame playlists) |
| `getFirstTimestamp()` | Start of first sample; can be negative or positive |
| `computeDuration()` / `getDurationFromMetadata()` | End of last sample / cheap metadata value |
| `getTimeResolution()` | Hz; all timestamps are multiples of `1/x`; upper bound on FPS |
| `computePacketStats(n?)` | `{ packetCount, averagePacketRate, averageBitrate }`; pass `n` (e.g. 50) to sample only the first packets |
| `determinePacketType(packet)` | Bitstream-verified `'key' \| 'delta' \| null` |
| `isLive()` / `getLiveRefreshInterval()` | Live (HLS) state |
| `isRelativeToUnixEpoch()` / `hasUnixTimeMapping()` / `getUnixTimeForTimestamp(t)` | Wall-clock mapping |

Negative start: the beginning is cut off; do not present samples with negative timestamps. Positive start: show black or freeze the first frame until it starts.

### Video track metadata (`InputVideoTrack`)

```ts
await v.getCodedWidth(); await v.getCodedHeight();             // raw coded pixels
await v.getSquarePixelWidth(); await v.getSquarePixelHeight(); // after pixel aspect ratio, before rotation
await v.getDisplayWidth(); await v.getDisplayHeight();         // after PAR and rotation (what users see)
await v.getRotation();          // 0 | 90 | 180 | 270, clockwise
await v.getFlip();              // horizontal flip after rotation (1.57+)
await v.getTransformationMatrix(); // raw 3x3 matrix (1.57+)
await v.getPixelAspectRatio();  // { num, den }
await v.getColorSpace();        // VideoColorSpaceInit (fields may be undefined)
await v.hasHighDynamicRange();  // true means HDR; false means "not known HDR"
await v.canBeTransparent();     // may hold alpha
await v.computeFrameRateMetrics({ targetPacketCount: 256 }); // 1.54+
```

`FrameRateMetrics`: `bestGuessFrameRate`, `underlyingFrameRate | null`, `minFrameRate`, `maxFrameRate`, `averageFrameRate`, `medianFrameRate`, `frameRateIsConstant`, `probedPacketCount`. FPS always comes from real timestamps, never container metadata. Before 1.54, use `computePacketStats(100).averagePacketRate`.

### Audio track metadata (`InputAudioTrack`)

`getNumberOfChannels()`, `getSampleRate()`, `getDecoderConfig()`.

## Pairability

Tracks are *pairable* when they can be presented together (video + its audio). Plain files: every video pairs with every audio; same-type tracks never pair. HLS: the master playlist defines it.

```ts
trackA.canBePairedWith(trackB);
await video.getPairableAudioTracks(query?);
await video.getPrimaryPairableAudioTrack(query?);
await track.hasPairableAudioTrack(predicate?);
```

## Init inputs

For media whose init data lives in another file (CMAF `init.mp4` + `segment.m4s`):

```ts
const initInput = new Input({ source: new FilePathSource('init.mp4'), formats: ALL_FORMATS });
const input = new Input({ source: new FilePathSource('data.m4s'), formats: ALL_FORMATS, initInput });
```

## Encrypted ISOBMFF (CENC / SAMPLE-AES)

Mediabunny decrypts when you supply keys. It cannot talk to a CDM.

```ts
new Input({
	source, formats: ALL_FORMATS,
	formatOptions: {
		isobmff: {
			// May be async; return the key as a hex string or Uint8Array.
			// psshBoxes carry the data a license server needs.
			resolveKeyId: ({ keyId, psshBoxes }) => {
				const key = keyMap.get(keyId);
				if (!key) {
					throw new Error(`Unknown key ID ${keyId}`);
				}
				return key;
			},
		},
	},
});
```

HLS `AES-128` segment encryption is handled automatically. Only decrypt content the user has rights to.

## Input events

`input.on('source', ({ source, request, isRoot }) => …)` fires when a (pathed) input opens a sub-source, useful for logging HLS segment fetches.
