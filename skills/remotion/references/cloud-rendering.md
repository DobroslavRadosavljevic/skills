# Cloud and Browser Rendering

Lambda, Vercel Sandbox, Cloud Run, other hosts, and client-side rendering with `@remotion/web-renderer`. Snapshot: 4.0.532.

## Contents

1. Choosing where to render
2. Lambda architecture and package split
3. Lambda setup and deploy
4. Lambda render, progress, webhooks (Next.js example)
5. Lambda limits, sizing, cost, credentials
6. Lambda troubleshooting
7. Vercel Sandbox (`@remotion/vercel`)
8. Cloud Run and other hosts
9. Client-side rendering (`@remotion/web-renderer`)
10. Production checklist

---

## 1. Choosing where to render

| Option | Package | Status | Distributed | Pick when |
| --- | --- | --- | --- | --- |
| Own server / CI | `@remotion/renderer` + `@remotion/bundler` | Stable | No | Steady volume, long videos, GPU needs, full control. You build queueing and retries. |
| AWS Lambda | `@remotion/lambda` (deploy) + `@remotion/lambda-client` (render) | Stable, recommended default | Yes, ≤200 functions | Fast, bursty, scalable renders. No AV1, no PDF stills, no GPU. |
| Vercel Sandbox | `@remotion/vercel` | Experimental (4.0.426+) | No | Already on Vercel; simplest setup; output to Vercel Blob. |
| Cloud Run | `@remotion/cloudrun` | Alpha, unmaintained | No | Only if locked to GCP; h264/vp8/prores only, no webhooks. |
| Cloudflare Containers / Azure | none (demos/community) | PoC | No | Experiments. |
| Browser | `@remotion/web-renderer` | Stable since 4.0.491 | No | No server, user-triggered exports, editors. CSS subset only. |

Edge runtimes (Vercel Edge, Cloudflare Workers) cannot call the Lambda client or render. Never call render APIs from the browser with cloud credentials.

## 2. Lambda architecture and package split

- One Remotion-owned function (arm64, Node 24 runtime) + one S3 bucket per region (`remotionlambda-<region>-<hash>`). Your code is not in the function: it is a **site** (bundle) in S3, addressed by a serve URL. One function can render any site of the same Remotion version.
- A render invokes the main function, which runs `calculateMetadata`, splits frames into chunks, invokes renderer functions recursively, streams chunks back, concatenates, and writes the output to S3. `concurrency: 1` (4.0.517+) renders everything in the main function.
- Each chunk downloads the assets it needs → host big assets on a CDN and use `@remotion/media` (range requests).
- Chrome on Lambda forces `gl: 'swangle'` (software WebGL) — WebGL-heavy videos render slowly there.
- Fonts on Lambda: Noto + Noto Color Emoji; CJK by default. Prefer web fonts loaded by the composition.

| Import from | Contains |
| --- | --- |
| `@remotion/lambda/client` or `@remotion/lambda-client` (light, bundle-safe) | `renderMediaOnLambda`, `renderStillOnLambda`, `getRenderProgress`, `cancelRenderOnLambda`, `getCompositionsOnLambda`, `presignUrl`, `speculateFunctionName`, `validateWebhookSignature`, `appRouterWebhook`, `pagesRouterWebhook`, `expressWebhook`, `deleteRender`, `getFunctions`, `getSites`, `estimatePrice`, types |
| `@remotion/lambda` (heavy, Node scripts / CLI) | `deployFunction`, `deleteFunction`, `getFunctionInfo`, `deploySiteFromBundle`, `deploySite` (deprecated), `deleteSite`, `getOrCreateBucket`, `downloadMedia`, `getRegions`, `getUserPolicy`, `getRolePolicy`, `simulatePermissions`, `getAwsClient` |

Render/progress functions in the `@remotion/lambda` root are deprecated re-exports (they throw in v5). `cancelRenderOnLambda`, `speculateFunctionName`, and the webhook helpers exist only in the client package.

## 3. Lambda setup and deploy

One-time AWS setup (ask the user to do the console steps; never ask them to paste keys into chat):

1. `bun add @remotion/lambda@<exact remotion version>`.
2. IAM policy named exactly `remotion-lambda-policy` from `bunx remotion lambda policies role`.
3. IAM role named exactly `remotion-lambda-role` (use case Lambda) with that policy.
4. IAM user with an access key + inline policy from `bunx remotion lambda policies user`.
5. `.env`: `REMOTION_AWS_ACCESS_KEY_ID`, `REMOTION_AWS_SECRET_ACCESS_KEY` (and `REMOTION_AWS_REGION` for the CLI).
6. `bunx remotion lambda policies validate`; `bunx remotion lambda quotas` (new accounts may have a concurrency limit of 10).

Deploy (CLI):

```bash
bunx remotion lambda functions deploy --memory=2048 --disk=10240 --timeout=240
bunx remotion lambda sites create src/index.ts --site-name=my-video-prod
bunx remotion lambda render my-video-prod Promo --props=./props.json
bunx remotion lambda still my-video-prod Thumbnail --frame=10
```

Deploy (Node script, `bun scripts/deploy.ts`):

```ts
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {deployFunction, deploySiteFromBundle, getOrCreateBucket} from '@remotion/lambda';

const region = 'us-east-1';
const {functionName} = await deployFunction({
  region,
  memorySizeInMb: 2048,
  diskSizeInMb: 10240,
  timeoutInSeconds: 240,
  createCloudWatchLogGroup: true,
});
const {bucketName} = await getOrCreateBucket({region});
const bundleDir = await bundle({entryPoint: path.resolve('src/index.ts')});
const {serveUrl} = await deploySiteFromBundle({bucketName, region, bundleDir, siteName: 'my-video-prod'});
console.log({functionName, serveUrl});
```

- `deployFunction` is idempotent per (version, memory, disk, timeout, region) and does not apply changed settings to an existing function — delete and redeploy to change VPC, layers, Insights.
- Redeploy the **site** after every code change. Redeploy the **function** after every Remotion upgrade. Function, site, and client package versions must match exactly (also Python/PHP/Ruby/Go clients).
- Function name convention: `remotion-render-<version>-mem<MB>mb-disk<MB>mb-<sec>sec`. `speculateFunctionName({memorySizeInMb, diskSizeInMb, timeoutInSeconds})` computes it without an API call. Always pass `functionName` explicitly (with several compatible functions, the CLI picks one at random).
- Zero-downtime upgrade: upgrade packages → deploy new function (old remains) → deploy site → ship app with new function name → delete the old function after in-flight renders finish.
- Separate sites per environment (`my-video-staging`, `my-video-prod`); one function config can serve all.

## 4. Lambda render, progress, webhooks (Next.js App Router)

```ts
// lib/remotion-lambda.ts
import {speculateFunctionName, type AwsRegion} from '@remotion/lambda/client';
export const REGION: AwsRegion = 'us-east-1';
export const SITE = 'my-video-prod'; // site name or full serve URL
export const FUNCTION_NAME = speculateFunctionName({memorySizeInMb: 2048, diskSizeInMb: 10240, timeoutInSeconds: 240});
```

```ts
// app/api/render/route.ts
import {renderMediaOnLambda} from '@remotion/lambda/client';
import {FUNCTION_NAME, REGION, SITE} from '@/lib/remotion-lambda';

export const runtime = 'nodejs'; // the client does not run on edge

export async function POST(req: Request) {
  // authenticate + rate limit: every call costs money
  const {inputProps} = await req.json();
  const {renderId, bucketName} = await renderMediaOnLambda({
    region: REGION,
    functionName: FUNCTION_NAME,
    serveUrl: SITE,
    composition: 'Promo',
    codec: 'h264',
    inputProps,
    privacy: 'private',
    downloadBehavior: {type: 'download', fileName: 'promo.mp4'},
    webhook: {url: `${process.env.APP_URL}/api/render/webhook`, secret: process.env.REMOTION_WEBHOOK_SECRET!, customData: {jobId: '…'}},
    licenseKey: process.env.REMOTION_LICENSE_KEY,
  });
  return Response.json({renderId, bucketName}); // store both
}
```

```ts
// app/api/render/progress/route.ts — client polls every 1–2 s
import {getRenderProgress, presignUrl} from '@remotion/lambda/client';
import {FUNCTION_NAME, REGION} from '@/lib/remotion-lambda';

export async function POST(req: Request) {
  const {renderId, bucketName} = await req.json();
  const p = await getRenderProgress({renderId, bucketName, functionName: FUNCTION_NAME, region: REGION, skipLambdaInvocation: true});
  if (p.fatalErrorEncountered) return Response.json({type: 'error', message: p.errors[0]?.message});
  if (p.done) {
    const url = await presignUrl({region: REGION, bucketName, objectKey: p.outKey!, expiresInSeconds: 3600});
    return Response.json({type: 'done', url});
  }
  return Response.json({type: 'progress', progress: Math.max(0.03, p.overallProgress)});
}
```

```ts
// app/api/render/webhook/route.ts
import {appRouterWebhook} from '@remotion/lambda/client';

export const POST = appRouterWebhook({
  secret: process.env.REMOTION_WEBHOOK_SECRET!,
  testing: false,
  onSuccess: async (payload) => {/* payload.renderId, outputUrl, outputFile, costs, customData */},
  onError: async (payload) => {/* payload.errors */},
  onTimeout: async (payload) => {/* static fields only */},
});
```

Key options of `renderMediaOnLambda` (defaults in parentheses): `codec` (required; h264, h265, vp8, vp9, prores, gif, mp3, aac, wav — no av1), `inputProps` (`{}`; >~194 KB auto-uploaded to S3), `privacy` (`'public'`; `'private'` + `presignUrl`, `'no-acl'` for ACL-less buckets/R2), `framesPerLambda` or `concurrency` (auto; ≥5 frames per function, ≤200 functions), `imageFormat` (`jpeg`), `jpegQuality` (80), `maxRetries` (1), `timeoutInMilliseconds` (30000 — delayRender, not the function timeout), `outName` (string key or `{bucketName, key, s3OutputProvider}` for R2/GCS/other clouds), `overwrite` (false; true in v5), `downloadBehavior`, `webhook` (`customData` ≤1 KB), `enableCancellation` (false), `deleteAfter` (`'1-day'…'30-days'`, needs folder expiry on the bucket), `chromiumOptions`, `envVariables`, `encodingMaxRate`/`encodingBufferSize`, `licenseKey`, `isProduction`.

- `getRenderProgress` returns `overallProgress`, `done`, `outputFile`, `outKey`, `errors`, `fatalErrorEncountered`, `costs`, `artifacts`, `renderMetadata`. `skipLambdaInvocation: true` reads `progress.json` directly (cheaper). Pass the site's bucket, not a custom output bucket.
- `renderStillOnLambda` resolves when the still is done (`{url, outKey, sizeInBytes, estimatedPrice}`); no progress polling.
- `cancelRenderOnLambda` only works for renders started with `enableCancellation: true`.
- Webhooks: header `X-Remotion-Signature` (HMAC-SHA512 of the JSON body), statuses success/error/timeout, 10 s timeout, 2 retries → respond 200 fast and make handlers idempotent (key on `renderId`). Pages Router: `pagesRouterWebhook`; Express: `expressWebhook`; manual: `validateWebhookSignature({secret, body, signatureHeader})`.

## 5. Lambda limits, sizing, cost, credentials

- Function: memory 512–10240 MB (default 2048), disk 512–10240 MB (default 2048 in v4, 10240 in v5 — pass it explicitly and keep `speculateFunctionName` inputs identical), timeout 15–900 s (default 120). Output can be at most about half the disk.
- Account concurrency: 1000/region by default (new accounts may be 10). `TooManyRequestsException` → lower `concurrency`, request a quota increase, or spread across regions.
- Cost ∝ memory × duration. Lower memory until it fails; prefer fewer, larger chunks for cheaper renders; use `skipLambdaInvocation` or webhooks instead of heavy polling; host assets on a cached CDN (R2 with a custom domain + cache rule) to cut chunk download time.
- Credentials lookup order: `REMOTION_AWS_PROFILE` → `REMOTION_AWS_ACCESS_KEY_ID`/`SECRET` (+`SESSION_TOKEN`) → `AWS_PROFILE` → `AWS_*` keys → AWS SDK default chain. Use the `REMOTION_` names on Vercel/AWS (platform `AWS_*` vars cause `UnrecognizedClientException`). The CLI reads `.env`; Node APIs do not.
- Sites must stay publicly readable (the headless browser loads them). Do not put secrets in the bundle; pass them via `inputProps` or `envVariables`.

## 6. Lambda troubleshooting

| Symptom | Fix |
| --- | --- |
| No compatible function / version mismatch | Redeploy function and site after upgrading; pin exact versions |
| `UnrecognizedClientException` | Use `REMOTION_AWS_*` env names |
| AccessDenied right after setup | Wait 2–3 min; re-paste user/role policies; `policies validate` |
| `TooManyRequestsException` / rate exceeded | Lower `concurrency`; `bunx remotion lambda quotas increase` |
| "This render would cause [X] functions to spawn" | Raise `framesPerLambda` or set `concurrency` ≤200 |
| `AccessControlListNotSupported` | `privacy: 'no-acl'` |
| Main function timed out | Raise function timeout; check CloudWatch `method=launch,renderId=…`; optimize slow frames |
| One chunk stuck loading media | Cache the CDN; set media `delayRenderTimeoutInMilliseconds` below the function timeout + retries |
| Transparent WebM seams | ProRes 4444, larger chunks, or `concurrency: 1` |
| Import errors on edge runtime | `export const runtime = 'nodejs'` |
| Code changes not visible | Redeploy the site |

Debug: `bunx remotion lambda render <site> <id> --log=verbose` prints CloudWatch and `progress.json` links.

## 7. Vercel Sandbox (`@remotion/vercel`, experimental)

```ts
import {addBundleToSandbox, createSandbox, renderMediaOnVercel, getRenderProgress} from '@remotion/vercel';

const sandbox = await createSandbox(); // or restore a snapshot created at build time (template does this)
await addBundleToSandbox({sandbox, bundleDir: '.remotion'});
const {sandboxId, cmdId} = await renderMediaOnVercel({
  sandbox,
  compositionId: 'Promo',
  inputProps,
  codec: 'h264',
  detached: true, // required for renders that may exceed the 800 s function limit
  vercelBlob: {blobToken: process.env.BLOB_READ_WRITE_TOKEN!, access: 'public'},
});
// later, in a progress route:
const progress = await getRenderProgress({sandboxId, cmdId}); // stages … 'done' {url} | 'error' | 'expired'
```

- Start from `bunx create-video@latest --template vercel` (Blob store + build-time sandbox snapshot for fast cold starts).
- Non-detached: `renderMediaOnVercel` returns `{sandboxFilePath}`, then `uploadToVercelBlob({sandbox, sandboxFilePath, contentType, blobToken, access})`, then `sandbox.stop()` in `finally`.
- Stop sandboxes after terminal stages; clean up snapshots and Blob data (they persist). Set spend limits. No auth or rate limiting in the template — add it.
- Alternative on Vercel: trigger Lambda from a Node route with `@remotion/lambda/client`.

## 8. Cloud Run and other hosts

- Cloud Run (`@remotion/cloudrun`): alpha, no longer developed. Single instance per render, `renderMediaOnCloudrun` awaits the whole render. Prefer Lambda or Vercel for new projects.
- DIY distributed rendering with `renderMedia({frameRange, compositionStart, codec: 'h264-ts', enforceAudioTrack: true, …})` per chunk + `combineChunks()` is possible but strongly discouraged versus Lambda.
- Any static host can serve a bundle (`bunx remotion bundle`); that URL works as a serve URL for every SSR API.

## 9. Client-side rendering (`@remotion/web-renderer`)

```ts
import {canRenderMediaOnWeb, renderMediaOnWeb} from '@remotion/web-renderer';
import {Promo} from './remotion/Promo';

const check = await canRenderMediaOnWeb({width: 1920, height: 1080, container: 'mp4'});
if (!check.canRender) throw new Error(check.issues.map((i) => i.message).join('\n'));

const controller = new AbortController();
const {getBlob} = await renderMediaOnWeb({
  composition: {id: 'Promo', component: Promo, width: 1920, height: 1080, fps: 30, durationInFrames: 300},
  inputProps: {title: 'Hello'},
  container: 'mp4', // mp4 | webm | mkv | mov | wav | mp3 | aac | ogg | flac
  videoBitrate: 'high',
  signal: controller.signal,
  licenseKey: 'free-license',
  onProgress: ({progress}) => console.log(progress),
});
const blob = await getBlob();
```

- Renders single-threaded in the user's tab with WebCodecs (Chrome 94+, Firefox 130+, Safari 26+). Long renders: stream to disk with `outputWritable` (file picker stream) to avoid running out of memory.
- Supported: `@remotion/media` Video/Audio, `<Img>`, `<Gif>`, `<AnimatedImage>` (Chrome), `<Lottie>`, Rive, `<ThreeCanvas>`, `<SkiaCanvas>`, `<HtmlInCanvas>`. Not supported: `<OffthreadVideo>`, `<Html5Video>`, `<Html5Audio>`, `<IFrame>`, `<AnimatedEmoji>`.
- CSS is re-drawn from a supported subset: layout, transforms, opacity, borders, radius, linear gradients, text styling, basic box-shadow, simple masks, common filters (not Safari), clip-path shapes. Not supported: `z-index` (order the DOM back-to-front), `perspective`, blend modes, `backdrop-filter`, `object-position`, inset shadows. `allowHtmlInCanvas: true` captures full fidelity in Chromium with the HTML-in-canvas flag.
- Use `useDelayRender()` and `useRemotionEnvironment()` (globals conflict). All assets need CORS. `getInputProps()` does not work.
- `renderStillOnWeb({composition, frame, inputProps})` → `{blob({format}), canvas(), url()}`.
- Always sends telemetry (origin + IP).

## 10. Production checklist

- Authenticate and rate-limit every endpoint that triggers renders; cap video length and input sizes.
- Validate `inputProps` server-side with the same Zod schema the composition uses.
- Persist `renderId` + `bucketName`; make webhook handlers idempotent.
- Private outputs + short-lived presigned URLs; set `deleteAfter` for temporary renders.
- Pin exact Remotion versions; redeploy function + site together on upgrade.
- Track cost (`getRenderProgress().costs`, `estimatePrice`) and set AWS/Vercel budgets.
- Pass `licenseKey` if the company needs a license.
