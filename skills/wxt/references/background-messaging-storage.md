# Background, Messaging, Storage, Extension UI (in WXT)

In WXT the service worker is `entrypoints/background.ts` using `defineBackground`; everything below runs inside its `main`. Examples use the auto-imported `browser` global.

## Table of contents

- Service worker lifecycle and termination
- Listener and startup patterns
- Messaging
- browser.storage
- Alarms
- Offscreen documents
- Side panel, action, popup, options
- Downloads and native messaging
- Context menus and commands

## Service worker lifecycle and termination

Chrome stops the extension service worker when:

- it has been idle 30 seconds (receiving an event or calling an extension API resets the timer),
- one event or API call runs longer than 5 minutes,
- a `fetch()` response takes longer than 30 seconds to arrive.

Keepalive facts (version-specific): API calls reset timers since Chrome 110; messages from an offscreen document since 109; long-lived messaging (`sendMessage` over a port) since 114 (opening a port alone does not); active WebSocket traffic since 116; active `browser.debugger` sessions since 118; an open `runtime.connectNative()` port since 105 (reconnect in `onDisconnect`). Prompt-based calls (`permissions.request`, `identity.launchWebAuthFlow`, `desktopCapture.chooseDesktopMedia`, `management.uninstall`) may exceed 5 minutes.

Design for termination, do not fight it:

- No state in module globals. Persist to `browser.storage.session` (in-memory, cleared on browser restart, 10 MB) or `storage.local` / IndexedDB. Web Storage (`localStorage`) does not exist in service workers.
- Do not use `setTimeout`/`setInterval` for long waits: they die with the worker. Use `browser.alarms`.
- Long jobs (downloads, transcoding, big parsing): do the work in an offscreen document, a content script, a popup/side panel page, or a native host; the worker only orchestrates.
- Do not "keep alive" with pings. If you must (WebSocket, native port), keep it as narrow as the task.
- Install order is `install` (SW), `runtime.onInstalled`, `activate`. `onInstalled` fires on first install, extension update, and Chrome update, so check `details.reason`. `runtime.onStartup` fires on profile start but wakes no SW handlers by itself. Put one-time setup (context menus, default storage values, alarms) in `onInstalled`.
- Updating or reloading kills existing content scripts' connection. Old content scripts keep running in open tabs and throw `Extension context invalidated` on any `chrome.*` call.

## Listener and startup patterns

```ts
// entrypoints/background.ts
export default defineBackground({
  type: 'module',                      // optional: ESM worker (MV3 only)
  main() {                             // must be synchronous; register everything here
    browser.runtime.onInstalled.addListener(async ({ reason }) => {
      if (reason === 'install') await settings.setValue({ enabled: true });
      browser.contextMenus.create({ id: 'save', title: 'Save', contexts: ['selection'] });
    });

    browser.runtime.onMessage.addListener((message, sender) => {
      if (message?.type !== 'ping') return;     // not ours: return undefined
      return handle(message, sender);            // Promise (Chrome 148+); else use return true + sendResponse
    });

    browser.alarms.onAlarm.addListener((alarm) => { void onAlarm(alarm); });
    browser.contextMenus.onClicked.addListener((info, tab) => { void onMenu(info, tab); });
  },
});
```

- WXT imports the file in Node at build time, so listeners must sit inside `main`, and `main` cannot be `async`. Registering after an `await`, inside `onInstalled`, or conditionally means the event that restarted the worker is missed.
- Split a big worker into modules (`background/alarms.ts`, `background/messaging.ts`) that export `registerAlarms()`-style functions called synchronously from `main`.
- Use `void promise` or catch errors; unhandled rejections vanish into the worker console.
- Guard against duplicate in-flight work after a restart with a persisted job record, not an in-memory `Set` (a `Set` is fine only as a per-run optimisation).
- `browser.action.onClicked` only fires when no `default_popup` is set (that is, no `popup` entrypoint).
- `defineBackground`'s `persistent` option applies to MV2/Firefox event pages only. MV3 Chrome workers are always non-persistent.

## Messaging

One-time: `browser.runtime.sendMessage(msg)` (to extension pages and the worker) and `browser.tabs.sendMessage(tabId, msg, { frameId })` (to content scripts). Long-lived: `browser.runtime.connect({ name })` from the content script, `browser.tabs.connect(tabId)` from the extension side; both ends get a `Port`.

Responses:

- Pre-148 pattern: `return true` (the literal `true`) and call `sendResponse` later.
- Chrome 148+: return a Promise or use an `async` listener. Rolling out gradually, so `return true` stays the portable option. Not active when the extension declares a `devtools_page`.
- An `async` listener that returns nothing resolves `undefined` and Chrome sends `null`, which can win over another listener's real reply. Return `undefined` synchronously for messages you do not handle (check `message.type` first, do not make the listener `async`).
- From Chrome 146 a thrown error or rejected Promise in a listener rejects the sender's `sendMessage` (reject with an `Error` instance). Unserializable replies also reject. Only the first listener to respond/throw affects the sender.
- `sendMessage` rejects with "Could not establish connection. Receiving end does not exist." when no listener exists: the tab has no content script yet (page not reloaded after install, restricted page, wrong frame), or the worker died mid-request. Catch it.
- Messages are JSON-serialized by default. Opt in to structured clone (`"message_serialization": "structured_clone"`, Chrome 148+) to pass `Map`, `Set`, `Date`, `BigInt`, `Error`, `Blob`, `File`. `SharedArrayBuffer` and transfer lists are unsupported. Do not rely on it if you target Firefox/Safari.
- Message size cap is 64 MiB. For blobs and large media, use `blob:` URLs from an offscreen document, IndexedDB, or `storage.session`, not messages.

Validate on every receiver:

```ts
browser.runtime.onMessage.addListener((message, sender) => {
  if (sender.id !== browser.runtime.id) return;            // external senders use onMessageExternal
  if (message?.type !== 'download') return;
  if (!/^https:\/\/(www\.)?example\.com\//.test(sender.url ?? '')) return; // trust the sender URL, not the payload
  if (sender.frameId !== 0 || !sender.tab?.id) return;
  if (!/^\d{1,20}$/.test(message.id)) return;
  return run(sender.tab.id, message.id);
});
```

External messaging: `runtime.onMessageExternal` / `onConnectExternal` need `externally_connectable`. Web pages call `browser.runtime.sendMessage(EXTENSION_ID, msg)`. Treat the page as hostile.

WXT ships no messenger. Its docs recommend a wrapper over the vanilla APIs: `@webext-core/messaging` (typed, light), `@webext-core/proxy-service` (call a function from anywhere, run it in the background), `webext-bridge`, `trpc-chrome`, or `Comctx`. Typed protocol sketch:

```ts
// utils/messaging.ts
import { defineExtensionMessaging } from '@webext-core/messaging';
interface ProtocolMap { download(data: { id: string }): { ok: boolean }; }
export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
// background: onMessage('download', async ({ data, sender }) => ({ ok: true }));
// content:    await sendMessage('download', { id });
```

Plain `{ type }` messages are fine for small extensions; keep one shared discriminated union of message types.

Naming convention that scales: `{ target: 'offscreen' | 'background', type: 'verb-noun', ...payload }`, with every receiver ignoring messages whose `target` is not itself, so the worker and the offscreen document do not answer each other's messages.

## browser.storage

Needs `"storage"` permission.

| Area | Limits and behavior |
| --- | --- |
| `local` | Persistent on disk, 10 MB (raise with `unlimitedStorage`). Survives restarts. Cleared on uninstall. |
| `sync` | Synced across signed-in Chrome profiles. 102,400 bytes total, 8,192 bytes per item, 512 items, 120 writes/min and 1,800 writes/hour. Falls back to local behavior when sync is off. Do not store secrets or large blobs. |
| `session` | In-memory, 10 MB, cleared on browser restart, disable, reload, or update. Not exposed to content scripts by default (`setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' })` opens it). Best for tokens and caches in the worker. |
| `managed` | Read-only enterprise policy values (needs `storage.managed_schema`). |

- Values are JSON-like. `Map`, `Set`, `Date`, and class instances do not round-trip; convert first.
- `browser.storage.onChanged` fires in all contexts (`changes`, `areaName`). Use it as the cross-context state bus instead of broadcasting messages to every tab.
- Writes are async. Batch with one `set({ a, b })`. Use `getBytesInUse()` when near quota. A quota failure rejects the promise.
- Version your data: store `schemaVersion` and migrate in `onInstalled` (`reason === 'update'`). WXT `storage.defineItem` has `version` plus `migrations`.
- Content scripts can read `local`/`sync` directly, but write through the worker if several tabs race.
- IndexedDB is available in the worker, popup, and offscreen document; use it for large structured data or blobs.

WXT storage (`@wxt-dev/storage`, built in; `import { storage } from '#imports'` or auto-import). Add `permissions: ['storage']` to the manifest config yourself.

```ts
// utils/storage.ts
export const settings = storage.defineItem<{ enabled: boolean }>('local:settings', {
  fallback: { enabled: true },            // returned by getValue() when missing
  version: 2,
  migrations: { 2: (old: { on: boolean }) => ({ enabled: old.on }) },   // keyed by target version
});
export const installId = storage.defineItem('local:install-id', { init: () => crypto.randomUUID() }); // saved immediately

await settings.setValue({ enabled: false });
const unwatch = settings.watch((value, old) => {});
await storage.setItems([{ item: installId, value: 'x' }, { key: 'local:other', value: 1 }]);
```

Rules: keys must start with `local:`, `session:`, `sync:`, or `managed:`; unversioned items are treated as version 1, so add `version: 2` plus a `2` migration when the shape changes; migrations run on `defineItem` and reads/writes wait for them; metadata lives at `key$` (`getMeta`, `setMeta`, `watchMeta`); bulk APIs are `getItems`, `setItems`, `getMetas`, `setMetas`, `removeItems`. `storage.watch` works in every context, so use it as the state bus between popup, content scripts, and worker. Use `@wxt-dev/storage` outside WXT with `import { storage } from '@wxt-dev/storage'`. Under `WxtVitest`, storage runs against `fakeBrowser` with no mocking.

## Alarms

Needs `"alarms"`. Minimum period is 30 seconds (Chrome 120+). Alarms keep running while the device sleeps but do not wake it; missed repeating alarms fire once on wake and re-schedule from wake time. Alarm names are limited to 1,024 bytes from Chrome 150 (longer throws `TypeError`).

```ts
// inside defineBackground main()
browser.runtime.onInstalled.addListener(() => {
  browser.alarms.create('refresh', { delayInMinutes: 1, periodInMinutes: 15 });
});
// Alarms can vanish across browser restarts in older Chrome/other browsers: recreate on each worker start.
async function ensureAlarm() {
  if (!(await browser.alarms.get('refresh'))) await browser.alarms.create('refresh', { periodInMinutes: 15 });
}
void ensureAlarm();
browser.alarms.onAlarm.addListener((a) => { if (a.name === 'refresh') void refresh(); });
```

`persistAcrossSessions` exists from Chrome 150; do not rely on it cross-browser.

## Offscreen documents

Needs `"offscreen"` (Chrome 109+). In WXT the document is an unlisted page: `entrypoints/offscreen/index.html` (+ `main.ts`), built to `offscreen.html`. A hidden extension page with DOM access, for work the service worker cannot do: parsing HTML (`DOM_PARSER`), `BLOBS` (create and hold `blob:` URLs, validate bytes), `CLIPBOARD`, `AUDIO_PLAYBACK` (closes after 30 s of silence), `USER_MEDIA`, `DISPLAY_MEDIA`, `WEB_RTC`, `WORKERS`, `LOCAL_STORAGE`, `IFRAME_SCRIPTING`, `MATCH_MEDIA`, `GEOLOCATION`, `TESTING`. `createDocument` needs `url` (a bundled static HTML file), `reasons`, and `justification` (the justification is read in review).

Rules:

- One offscreen document per profile at a time. Create it lazily and guard concurrent creates.
- Only the `browser.runtime` API is available inside. Talk to it by messages with a `target` field; it cannot focus.
- It stays open until closed; no idle timer except `AUDIO_PLAYBACK`.

```ts
let creating: Promise<void> | undefined;
async function ensureOffscreen() {
  const url = browser.runtime.getURL('offscreen.html');
  const existing = await browser.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [url] });
  if (existing.length) return;
  creating ??= browser.offscreen
    .createDocument({ url: 'offscreen.html', reasons: ['BLOBS'], justification: 'Hold validated file bytes until the download finishes.' })
    .finally(() => { creating = undefined; });
  await creating;
}
```

A `blob:chrome-extension://...` URL created in the offscreen document can be passed to `browser.downloads.download`; revoke it (`URL.revokeObjectURL`) when `downloads.onChanged` reports `complete` or `interrupted`.

## Side panel, action, popup, options

- Side panel: add `entrypoints/sidepanel/index.html` (WXT adds the `sidePanel` permission and builds `sidebar_action` for Firefox). Chrome 114+. Global `side_panel.default_path` comes from that entrypoint; per-tab control uses `sidePanel.setOptions({ tabId, path, enabled })`. Open from the toolbar icon with `sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`. `sidePanel.open({ tabId | windowId })` (Chrome 116+) must run inside a user gesture, and it is lost if you `await` something slow first. `sidePanel.getLayout()` (Chrome 140+) tells which side it sits on, for RTL. It is an extension page with full API access, so keep one app and message the worker for background work.
- Popup: closes when focus leaves, so never hold the only copy of state or an in-flight upload there. Read state from `storage`, send commands to the worker, subscribe with `storage.onChanged`.
- Options: prefer `options_ui` with `open_in_tab: true`. Settings written with `storage.sync` or `storage.local` and read by `onChanged` everywhere.
- Action icon: `action.setBadgeText({ text, tabId })`, `setIcon`, `enable`/`disable`. Chrome 153 is experimenting with pinning icons by default; do not depend on the unpinned state.
- Page actions are merged into `action` in MV3 (Chromium, Safari); Firefox keeps `page_action`.

## Downloads and native messaging

- `browser.downloads.download({ url, filename, conflictAction, saveAs })` needs `"downloads"`. `filename` is relative to the Downloads folder and may not contain `..`. Drive follow-up logic from `downloads.onChanged` (state `complete`/`interrupted`), and keep `id -> job` records in `storage.session`. Chrome sends the browser's cookies for the request URL; when a signed or cookie-free CDN URL must be validated first, fetch the bytes yourself (service worker `fetch`), validate (status, content-type, magic bytes), hold them as a `blob:` URL in an offscreen document, then download.
- Native messaging (`"nativeMessaging"`): `browser.runtime.connectNative(host)` for a persistent port (keeps the worker alive) or `sendNativeMessage`. The host manifest JSON lives in the OS-specific `NativeMessagingHosts` directory with `allowed_origins: ["chrome-extension://<ID>/"]`, so the extension needs a stable ID (`key`). Messages are length-prefixed JSON on stdin/stdout; the host must validate everything and never shell out with message content. A fixed local helper is a way to run `yt-dlp` or `ffmpeg`, but it makes the extension non-portable and is unlikely to pass store review for media downloaders.

## Context menus and commands

- `contextMenus` creation belongs in `onInstalled`; handle clicks with `contextMenus.onClicked` (Firefox event pages break on the `onclick` parameter). Chrome 150 adds a `"tab"` context for the tab strip menu.
- `commands` keyboard shortcuts: `browser.commands.onCommand`. Users can rebind shortcuts at `chrome://extensions/shortcuts`, and a suggested key that conflicts is silently left unassigned.
