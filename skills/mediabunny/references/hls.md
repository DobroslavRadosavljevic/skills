# HLS (Read and Write)

Contents: reading model · inputs · track selection · lazy loading · Unix time · live reading · encryption · writing model · targets · ladders · dispositions · track groups · segment formats · file names · live writing · limits.

## Reading

### Mental model

An HLS master or media playlist becomes one `Input` with a flat list of tracks. Playlists, segments, and keys stay hidden. Any code that works on MP4 works on HLS. Duplicate tracks across variants are merged. A media playlist URL alone yields the tracks of its first segment.

```ts
import { Input, UrlSource, HLS_FORMATS } from 'mediabunny';
const input = new Input({
	source: new UrlSource('https://example.com/master.m3u8'), // any PathedSource: UrlSource, FilePathSource, CustomPathedSource
	formats: HLS_FORMATS,
	// formatOptions: { hls: { offsetTimestampsByDateTime: false } },
});
```

### Track selection

```ts
const ladder = await input.getVideoTracks({
	filter: async t => !(await t.hasOnlyKeyPackets()),          // drop #EXT-X-I-FRAME-STREAM-INF
	sortBy: async t => [desc(await t.getDisplayHeight()), desc(await t.getBitrate() ?? 0)],
});
const video = ladder[0];
const audio = await video.getPrimaryPairableAudioTrack({
	sortBy: async t => prefer(await t.getLanguageCode() === 'es'),
});
```

HLS attribute mapping: `getBitrate()` = `BANDWIDTH` (max over variants), `getAverageBitrate()` = `AVERAGE-BANDWIDTH`, `getLanguageCode()` = `LANGUAGE`, `getName()` = `NAME`, `disposition.primary` = `DEFAULT`, `disposition.default` = `AUTOSELECT`, `hasOnlyKeyPackets()` = I-frame playlist. Pairability follows variants and `#EXT-X-MEDIA` groups. `#EXT-X-DEFINE` variables resolve automatically (1.61+).

### Lazy loading

- `getTracks()` loads only the master playlist.
- Duration metadata loads the media playlist.
- `getDecoderConfig()` loads the first segment.
- Dimensions come from `RESOLUTION` when present, else from media data.
- Sinks load only the segments they need. Playlists are cached; unused segments are evicted.

### Unix-timestamped media

With `#EXT-X-PROGRAM-DATE-TIME`, track timestamps **are** Unix seconds (`getFirstTimestamp()` → `1704067200`). Check with `isRelativeToUnixEpoch()`. Set `offsetTimestampsByDateTime: false` to keep zero-based timestamps (date gaps collapse) and map with `getUnixTimeForTimestamp(t)` / `hasUnixTimeMapping()`.

### Live reading

- `isLive()`, `getLiveRefreshInterval()` (seconds).
- Reads past the live edge wait ("live wait"). Iterators run until the stream ends.
- `{ skipLiveWait: true }` treats the current edge as the end (all sink methods, `getDurationFromMetadata`, `computeDuration`).
- Poll the edge every `getLiveRefreshInterval()` seconds; stop when it returns `null`.
- Start playback at `edge - 2 * refreshInterval` (factor ≥ 1; 1.5 is fine; larger is more robust).

### Encryption

`AES-128` works automatically. `SAMPLE-AES` / `SAMPLE-AES-CTR` work for ISOBMFF segments when you pass keys via `formatOptions.isobmff.resolveKeyId`. Mediabunny cannot get keys from a DRM CDM.

## Writing

### Mental model

You describe tracks, their relationships (groups), and media. Mediabunny segments the media, writes one master playlist, one or more media playlists, and segments. Segments are emitted as soon as they are complete. VOD playlists are written on `finalize()`; live playlists are rewritten on every update.

```ts
import { Output, PathedTarget, HlsOutputFormat, MpegTsOutputFormat, BufferTarget } from 'mediabunny';

const files = new Map<string, ArrayBuffer>();
const output = new Output({
	format: new HlsOutputFormat({ segmentFormat: new MpegTsOutputFormat(), targetDuration: 6 }),
	target: new PathedTarget('master.m3u8', ({ path }) =>
		new BufferTarget({ onFinalize: buf => { files.set(path, buf); } })),
});
```

### Target patterns

- **Memory**: `BufferTarget({ onFinalize })` per path (above).
- **Disk (server)**: `({ path }) => new FilePathTarget(join(outDir, path))`.
- **OPFS**: `BufferTarget({ onFinalize })` that pushes a write promise; `Output({ onFinalize: () => Promise.all(writes) })`.
- **Streaming upload**: per path, `TransformStream` → `fetch(url, { method: 'POST', body: readable, duplex: 'half' })`, return `new AppendOnlyStreamTarget(writable)`. Needs append-only segment formats (TS, ADTS, MP3 without Xing). Await all fetches in `Output.onFinalize`.
- **Monolithic upload (S3 PutObject)**: `BufferTarget({ onFinalize: buf => runner.run(() => fetch(...)) })` with `const runner = new ConcurrentRunner(2)` and `Output({ onFinalize: () => runner.flush() })`. The runner caps parallel uploads and applies backpressure instead of stalling the muxer.
- **No master playlist**: `PathedTarget('', ({ isRoot }) => isRoot ? new NullTarget() : …)`.

### Ladders

Feed one decoded frame to several `VideoSampleSource`s with `transform: { height }` and descending `Quality`, or use Conversion fan-out (`video: [{ height: 1080 }, { height: 720 }, …]`). Keep `keyFrameInterval` ≤ `targetDuration` (default 2 s) on every video source or segments run long.

### Track metadata and dispositions

- `languageCode` + `name` should differ between tracks in one rendition group.
- `disposition.primary` → `DEFAULT=YES` (one per group), `disposition.default` → `AUTOSELECT=YES` (default true), `disposition.forced` → `FORCED=YES`.
- `hasOnlyKeyPackets: true` → `#EXT-X-I-FRAME-STREAM-INF` (only key packets allowed).
- `isRelativeToUnixEpoch: true` on all tracks → `#EXT-X-PROGRAM-DATE-TIME`; then timestamps you add are Unix seconds.

### Track groups → master playlist shape

- Default group, n videos + k audios of one codec: audios become an `#EXT-X-MEDIA` group; every variant references it.
- Audio in two codecs (AAC + AC-3): one rendition group per codec, variants for each video × audio-codec combination.
- One audio per video: put each pair in its own `OutputTrackGroup` → muxed variants.
- Standalone tracks: `group: []` on each → independent variants.
- Any symmetric graph: one group per track, `pairWith` the pairs. Same-type pairs are illegal (warning, treated as unpaired).

### Segment formats

`MpegTsOutputFormat` (safest), `CmafOutputFormat` (adds init segments), `AdtsOutputFormat` / `Mp3OutputFormat` / `WavOutputFormat` (single audio track). Arrays pick the first format that fits a playlist's tracks: `segmentFormat: [new AdtsOutputFormat(), new MpegTsOutputFormat()]`.

### File names and options

Defaults: `playlist-{n}.m3u8`, `segment-{n}-{k}{ext}`, `init-{n}{ext}`, single-file `segments-{n}{ext}`. Override with `getPlaylistPath(info)`, `getSegmentPath(info)`, `getInitPath(info)` (relative to root / playlist). Callbacks: `onMaster(content)`, `onPlaylist(content, info)`, `onSegment(target, info)`, `onInit(target, info)`, `onSegmentPopped(path, info)`.

`singleFilePerPlaylist: true` writes one file per playlist with `#EXT-X-BYTERANGE`. With CMAF segments, that file is also a standalone fMP4 (1.53+).

### Live writing

```ts
new HlsOutputFormat({ segmentFormat: new MpegTsOutputFormat(), live: true, maxLiveSegmentCount: 10,
	onSegmentPopped: (path) => deleteFile(path) });
```

- Media playlists appear after their first segment and update on each new segment; master appears once all playlists exist and refines `BANDWIDTH` later.
- The same path is requested many times: return a new `Target` each call.
- Use DATE-TIME tags (`isRelativeToUnixEpoch`) for A/V sync.
- `source.close()` ends a playlist once all its tracks close; `finalize()` ends all (`#EXT-X-ENDLIST`).
- `onSegmentPopped` does not fire in single-file mode.

### Limits

No subtitle tracks in HLS read or write. Not all segment formats are spec-compliant for every player; stay with TS, CMAF, ADTS, MP3.
