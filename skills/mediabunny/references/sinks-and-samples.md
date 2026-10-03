# Sinks, Packets, and Samples

Contents: sink rules · ordering · `EncodedPacketSink` · `VideoSampleSink` · `CanvasSink` · `AudioSampleSink` · `AudioBufferSink` · `EncodedPacket` · `VideoSample` · `AudioSample` · WebCodecs interop · playback pattern.

## Sink rules

- A sink is a cheap, stateless view over one track. Make one per track and kind; call its methods many times. (`CanvasSink` with `poolSize` is stateful.)
- Iterators (`packets()`, `samples()`, `canvases()`, `buffers()`) read lazily and prefetch ahead. `break` inside `for await` cleans up decoders.
- When you drive an iterator by hand (`it.next()`), call `await it.return()` when done.
- Every sink method takes a final `PacketRetrievalOptions`: `{ metadataOnly?, verifyKeyPackets?, skipLiveWait? }`.
- Timestamp lookups return the **last item with timestamp ≤ t** (presentation order), or `null`. `Infinity` gets the last one.

## Decode vs presentation order

- **Presentation order**: sorted by timestamp. All sample sinks use it.
- **Decode order**: the order the decoder needs (B-frames reorder). `EncodedPacketSink.packets()`, `getNextPacket()`, and `getFirstPacket()` use it.
- `packet.sequenceNumber` orders packets in decode order (compare only; negative = undefined order; equal = same sample).

## `EncodedPacketSink` (any track)

Raw compressed packets; no decoding.

```ts
const sink = new EncodedPacketSink(track);
await sink.getFirstPacket();          // decode order
await sink.getFirstKeyPacket();
await sink.getPacket(5);              // presentation lookup
await sink.getKeyPacket(5);           // last key packet at or before 5 s
await sink.getNextPacket(packet);     // decode-order successor
await sink.getNextKeyPacket(packet);
await sink.getPacket(Infinity);       // last packet

for await (const p of sink.packets(startPacket?, endPacketExclusive?, options?)) { … }
```

- `{ metadataOnly: true }`: packets carry timestamp, duration, type, `byteLength`, but `data` is empty. Faster on some formats. Good for timelines, keyframe indexes, bitrate graphs.
- `{ verifyKeyPackets: true }`: checks the bitstream so `type: 'key'` is guaranteed. Use when files mislabel keyframes and decoders error. Not combinable with `metadataOnly`.
- `packets()` beats a manual `getNextPacket` loop because it prefetches.

## `VideoSampleSink`

Decoded frames as `VideoSample` (wraps `VideoFrame`).

```ts
const sink = new VideoSampleSink(videoTrack, {
	hardwareAcceleration: 'no-preference', // | 'prefer-hardware' | 'prefer-software' (1.48+)
	optimizeForLatency: false,
});
using frame = await sink.getSample(5);
for await (using s of sink.samples(10, 20)) { … }           // contiguous range [10, 20)
for await (const s of sink.samplesAtTimestamps([0, 1, 2])) { // sparse; s may be null
	s?.close();
}
```

`samplesAtTimestamps` accepts any iterable or async iterable of seconds, in any order, with repeats. It decodes each packet once. Feed it an async generator to stream timestamps (for example, keyframe timestamps from an `EncodedPacketSink`) instead of collecting them first.

## `CanvasSink`

Decoded frames drawn onto canvases, with rotation, flip, crop, and resize applied. Yields `WrappedCanvas { canvas, timestamp, duration }`. `HTMLCanvasElement` on the main thread, `OffscreenCanvas` in workers. You never close anything.

```ts
const sink = new CanvasSink(videoTrack, {
	width: 320,            // other side follows aspect ratio
	// height: 180, fit: 'contain' | 'cover' | 'fill' (fit is REQUIRED when both are set)
	rotation: undefined,   // default: track rotation; set 0 + flip:false for raw orientation
	flip: undefined,
	crop: { left, top, width, height }, // display-pixel space, after rotate/flip, before resize
	poolSize: 2,           // reuse N canvases round-robin; 1 is enough for a plain loop
	alpha: false,          // true for transparent video
	decoderOptions: { hardwareAcceleration: 'prefer-hardware' },
});
await sink.getCanvas(t);
sink.canvases(start?, end?);
sink.canvasesAtTimestamps(iterable);
```

With a pool, a canvas you keep gets overwritten `poolSize` yields later. Copy it (`drawImage`, `createImageBitmap`, `convertToBlob`) if you keep it longer.

## `AudioSampleSink` / `AudioBufferSink`

```ts
const samples = new AudioSampleSink(audioTrack);   // AudioSample (close them)
const buffers = new AudioBufferSink(audioTrack);   // { buffer: AudioBuffer, timestamp, duration }
samples.getSample(t); samples.samples(s, e); samples.samplesAtTimestamps(ts);
buffers.getBuffer(t); buffers.buffers(s, e); buffers.buffersAtTimestamps(ts);
```

Audio chunks are short (codec frame size, often ~20 ms). `AudioBufferSink` needs Web Audio (`AudioBuffer`), so use `AudioSampleSink` on the server.

## `EncodedPacket`

```ts
new EncodedPacket(data: Uint8Array, type: 'key' | 'delta', timestamp: number, duration: number,
	sequenceNumber?: number, byteLength?: number, sideData?: { alpha?: Uint8Array, alphaByteLength?: number });
packet.data; packet.type; packet.timestamp; packet.duration; packet.byteLength; packet.sideData;
packet.isMetadataOnly; packet.microsecondTimestamp; packet.microsecondDuration;
packet.toEncodedVideoChunk(); packet.toEncodedAudioChunk(); packet.alphaToEncodedVideoChunk();
EncodedPacket.fromEncodedChunk(chunk, sideData?);
packet.clone({ timestamp: 10 }); // shallow edit: data, type, timestamp, duration, sequenceNumber, sideData
```

Packet bytes and `decoderConfig` must follow the Codec Registry (https://mediabunny.dev/codec-registry/overview). Key rules:

- AVC / HEVC: access units in either length-prefixed form (`description` = avcC / hvcC record) or Annex B (`description` undefined; key packets must carry parameter sets). One form per stream. Quantizer range 0–51.
- AAC: raw frames (`description` = AudioSpecificConfig) or ADTS frames (`description` undefined). Always `'key'`. Codec strings `mp4a.40.2` (LC), `mp4a.40.5` (HE), `mp4a.40.29` (HEv2), `mp4a.67`.
- PCM: interleaved bytes, codec string = codec id (`'pcm-s16'`), no `description`, always `'key'`.
- VP9 quantizer 0–63; AV1 quantizer 0–255.
- Transparent VP8/VP9: alpha travels as packet `sideData.alpha`.

## `VideoSample`

Constructors (seconds, not microseconds):

```ts
new VideoSample(videoFrame);                                     // wraps, zero-copy; copies timestamp
new VideoSample(canvasOrImageOrBitmap, { timestamp, duration?, rotation?, flip? });
new VideoSample(pixelBuffer, { format: 'RGBA' | 'RGBX' | 'BGRA' | 'I420' | 'NV12' | …, codedWidth, codedHeight, timestamp, duration? });
new VideoSample(customResource, { timestamp });                  // VideoSampleResource subclass (GPU / native frames)
```

Properties: `format`, `codedWidth/Height`, `squarePixelWidth/Height`, `displayWidth/Height`, `rotation`, `flip`, `pixelAspectRatio`, `timestamp`, `duration`, `microsecond*`, `colorSpace`, `visibleRect`, `hasAlpha`, `encodeOptions`. Setters: `setTimestamp`, `setDuration`, `setRotation`, `setFlip`, `setEncodeOptions`.

Use it:

```ts
sample.draw(ctx, dx, dy, dw?, dh?);                // honors rotation + flip
sample.draw(ctx, sx, sy, sw, sh, dx, dy, dw?, dh?);
sample.drawWithFit(ctx, { fit: 'contain', rotation?, flip?, crop? }); // fills ctx.canvas
sample.toCanvasImageSource();  // raw orientation; use immediately (internal frames close next microtask)
const frame = sample.toVideoFrame(); /* … */ frame.close(); // separate lifetime
const bytes = new Uint8Array(sample.allocationSize({ format: 'RGBA' }));
await sample.copyTo(bytes, { format: 'RGBA' });  // returns PlaneLayout[]
const small = await sample.transform({ width: 640, height: 360, fit: 'cover', rotate?, flip?, crop?, alpha?, roundDimensionsTo? });
const copy = sample.clone();    // close separately
sample.close();
```

`transform()` uses canvas in browsers. On the server it throws unless a transformer is registered (`@mediabunny/server` registers one, or call `registerVideoSampleTransformer((sample, description) => VideoSample | null)`). Order: pixel-aspect normalize → rotate → flip → crop → resize.

## `AudioSample`

```ts
new AudioSample(audioData);
new AudioSample({ data: Float32Array, format: 'f32-planar', numberOfChannels: 2, sampleRate: 48000, timestamp: 0 });
AudioSample.fromAudioBuffer(audioBuffer, timestamp); // => AudioSample[] (splits long buffers)
```

Formats: `u8`, `s16`, `s32`, `f32` and their `-planar` versions. Properties: `format`, `sampleRate`, `numberOfFrames`, `numberOfChannels`, `timestamp`, `duration`, `microsecond*`.

```ts
const opts = { planeIndex: 0, format: 'f32' } as const;   // always set format explicitly
const data = new Float32Array(sample.allocationSize(opts) / 4);
sample.copyTo(data, opts);                // converts to ANY format (WebCodecs only guarantees f32-planar)
sample.copyTo(dst, { planeIndex: ch, format: 'f32-planar', frameOffset?, frameCount? });
sample.trim(startFrame, endFrame?);       // new sample, timestamp shifted
sample.toAudioBuffer(); sample.toAudioData(); sample.clone(); sample.setTimestamp(t); sample.close();
```

## WebCodecs interop

| Mediabunny | WebCodecs |
| --- | --- |
| `EncodedPacket` | `EncodedVideoChunk` / `EncodedAudioChunk` |
| `VideoSample` | `VideoFrame` |
| `AudioSample` | `AudioData` |

Manual decode loop (when you need full decoder control):

```ts
const sink = new EncodedPacketSink(videoTrack);
const decoder = new VideoDecoder({ output: f => { /* … */ f.close(); }, error: console.error });
decoder.configure((await videoTrack.getDecoderConfig())!);
let p = await sink.getKeyPacket(37, { verifyKeyPackets: true });
while (p && p.timestamp < 50) {
	decoder.decode(p.toEncodedVideoChunk());
	p = await sink.getNextPacket(p);
}
await decoder.flush();
```

## Playback pattern (official media-player example)

- Clock: the `AudioContext` clock, even without audio: `playbackTime = ctx.currentTime - ctxStartTime + playbackTimeAtStart`.
- Video: `CanvasSink(track, { poolSize: 2, fit: 'contain', … })`. On seek, `await iterator.return()`, create `sink.canvases(seekTime)`, draw the first frame, hold the second as `nextFrame`. Each `requestAnimationFrame`, draw `nextFrame` once `nextFrame.timestamp <= playbackTime`, then pull frames until one lies in the future. Guard async races with an incrementing id.
- Audio: iterate `audioSink.buffers(seekTime)`. For each `{ buffer, timestamp }`, create an `AudioBufferSourceNode`; start time = `ctxStartTime + timestamp - playbackTimeAtStart`, rounded to the sample grid. If it is in the past, `node.start(ctx.currentTime, ctx.currentTime - startTime)`. Throttle the loop when more than ~1 s ahead. On pause or seek, stop queued nodes and `return()` the iterator.
- Start the clock at `await track.getFirstTimestamp()`; end at `await input.computeDuration()`.
- A backup `setInterval` render keeps frames moving when the tab is hidden.
