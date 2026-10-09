# Manifest, Permissions, CSP (in a WXT project)

WXT generates the manifest; this file explains the MV3 fields and rules, and where each lives in WXT. Edit config, not `.output/`.

## Table of contents

- Where manifest keys come from
- Field reference
- Permissions model
- Host access and optional permissions
- CSP, remote code, sandbox
- web_accessible_resources and externally_connectable
- Versioning and stable ID

## Where manifest keys come from

| Source | Produces |
| --- | --- |
| `package.json` | `name` (unless overridden), `version`, `version_name`, `description` |
| `wxt.config.ts` `manifest` (object or function) | `permissions`, `host_permissions`, `optional_*`, `web_accessible_resources`, `minimum_chrome_version`, `key`, `default_locale`, `icons`, `commands`, `content_security_policy`, `externally_connectable`, `incognito`, `oauth2`, `browser_specific_settings`, anything else |
| Entrypoint files | `background`, `content_scripts` (or runtime registration), `action`, `options_ui`, `side_panel`, `chrome_url_overrides`, `devtools_page`, `sandbox` |
| `public/` icon filenames | `icons` and `action.default_icon` |
| WXT modules and `hooks['build:manifestGenerated']` | late edits to the final manifest |

```ts
// wxt.config.ts
export default defineConfig({
  manifest: {
    minimum_chrome_version: '116',
    permissions: ['storage', 'alarms'],
    host_permissions: ['https://www.example.com/*'],
    web_accessible_resources: [{ resources: ['injected.js'], matches: ['https://www.example.com/*'] }],
  },
});
```

Result for a Chrome build: `.output/chrome-mv3/manifest.json` with `manifest_version: 3`, a `background.service_worker`, and `content_scripts` from entrypoints. Check it after every change to `permissions` or entrypoint `matches`. Manifest JSON limits still apply to the generated file: `description` at most 132 characters.

## Field reference

| Key | Notes |
| --- | --- |
| `manifest_version` | WXT sets it from the target (`3` for Chrome/Edge). MV2 cannot be published to Chrome. |
| `version` / `version_name` | From `package.json`. `version` is 1 to 4 dot-separated integers (0 to 65535) and must strictly increase for every store upload. |
| `minimum_chrome_version` | Freezes users on older Chrome at their current extension version. Raise deliberately; use staged rollout. Chrome 116 is a safe floor for WebSocket keepalive and `sidePanel.open`; 148 adopts native `browser.*` and promise `onMessage` without help. |
| `background` | From `entrypoints/background.ts`. `type: 'module'` in `defineBackground` sets ESM. For Firefox, WXT emits `background.scripts` (MV2 event page by default, MV3 with `--mv3`). |
| `action` | From `popup/index.html` (title from `<title>`, icons from `manifest.default_icon` meta). Without a popup, handle `browser.action.onClicked`. |
| `side_panel` | From `sidepanel.html` entrypoint; WXT adds the `sidePanel` permission. Chrome 114+. Firefox gets `sidebar_action`. |
| `options_ui` | From `options/index.html`; `<meta name="manifest.open_in_tab" content="true">`. `open_in_tab` is excluded on Safari. |
| `content_scripts` | From `defineContentScript`. See [content-scripts-spa.md](content-scripts-spa.md). |
| `web_accessible_resources` | In `manifest` config (MV3 object form). Default is nothing exposed. Unlisted scripts, CSS used in the page, and iframe pages all need entries. |
| `externally_connectable` | `{ matches: [...], ids: [...] }` in `manifest`. Lets listed pages or extensions call `runtime.sendMessage(extensionId, ...)`. |
| `commands` | `manifest.commands`. `_execute_action` triggers the action. |
| `declarative_net_request` | `manifest.declarative_net_request.rule_resources` pointing at JSON files in `public/`. See [network-auth-dnr.md](network-auth-dnr.md). |
| `content_security_policy` | `manifest.content_security_policy = { extension_pages, sandbox }`. See below. |
| `incognito` | `spanning` (default), `split`, `not_allowed`. |
| `key` | Public key pinning the extension ID for unpacked loads (native messaging `allowed_origins`, OAuth redirects, `externally_connectable` ids). Not needed for store uploads. |
| `message_serialization` | `"structured_clone"` (Chrome 148+) switches extension messaging from JSON to structured clone. Opt-in; no `SharedArrayBuffer` or transferables. |
| `default_locale` | Needed when `public/_locales/` or `@wxt-dev/i18n` locales exist. Use `__MSG_name__` in `name`/`description`. |
| `oauth2` | For `identity.getAuthToken`; set via the manifest function so env values load. Needs `identity`. |
| `storage.managed_schema` | Enterprise policy schema for `storage.managed`. |
| `browser_specific_settings` | `gecko.id`, `gecko.strict_min_version`, `gecko.data_collection_permissions` (Firefox). |

Other optional keys go through the same `manifest` config: `chrome_url_overrides` (use entrypoints instead), `omnibox`, `homepage_url`, `update_url`.

## Permissions model

Three separate lists, each with different warnings and review cost:

- `permissions`: API permissions (`storage`, `alarms`, `downloads`, `offscreen`, `scripting`, `sidePanel`, `contextMenus`, `cookies`, `declarativeNetRequest`, `nativeMessaging`, `identity`, `tabs`, `webNavigation`, `webRequest`, `unlimitedStorage`, `activeTab`).
- `host_permissions`: match patterns that grant cross-origin `fetch`, programmatic injection, `cookies`, `webRequest`, `declarativeNetRequest` redirect/modify, and reading `tab.url` / `title` / `favIconUrl`.
- `content_scripts[].matches`: also counted as host access in the install prompt.

Common misunderstandings, which the store treats as Purple Potassium (excessive permissions):

- `activeTab`: temporary access to the current tab after a user gesture (click on the action, shortcut, context menu). It is not passive access. It is not needed if you already have host permissions for that site, nor for `action.*`, `tabs.sendMessage`, or basic `tabs.query`.
- `tabs`: only unlocks `url`, `pendingUrl`, `title`, `favIconUrl` on `Tab` objects. You do not need it to call `tabs.create`, `tabs.update`, or `tabs.sendMessage`, and host permissions already give the same fields for those hosts.
- `cookies`: needed for `browser.cookies.*`. Not needed for `document.cookie` or the Cookie Store API.
- `storage`: needed for `browser.storage.*`. Not needed for IndexedDB, and `localStorage` is unavailable in service workers anyway.
- `scripting`: needed for `scripting.executeScript`, `insertCSS`, `registerContentScripts`. Not needed for static manifest `content_scripts`.
- `downloads`, `offscreen`, `alarms`, `contextMenus`, `sidePanel` each show up as one justification row on the privacy tab.
- Do not "future proof". Requesting a permission for a feature not yet shipped is a policy violation.

## Host access and optional permissions

- Request the narrowest patterns: `https://www.youtube.com/*`, not `*://*/*`. Scheme counts: `http://` and `https://` need separate entries. Path is ignored for host permissions (it matters for content-script `matches`).
- Broad patterns (`<all_urls>`, `*://*/*`, `https://*/*`) and sensitive permissions (`cookies`, `webRequest`, `debugger`, `tabs`) lengthen review and raise rejection odds.
- `optional_permissions` and `optional_host_permissions` are granted at runtime. `browser.permissions.request()` must run inside a user gesture (a click handler in a popup, options page, or content script button). Check first with `permissions.contains()`, and react to `permissions.onAdded` / `onRemoved`.
- Users can also revoke host access ("on click" / "on specific sites") in the extensions menu. Feature code must tolerate missing host access and re-request.
- Adding a permission or host in an update can disable the extension for existing users until they accept. Prefer optional for non-core additions.

```ts
// popup or options page, inside a click handler
const granted = await browser.permissions.request({ origins: ['https://www.example.com/*'] });
```

## CSP, remote code, sandbox

Default `extension_pages` CSP is `script-src 'self'; object-src 'self';` (the minimum Chrome allows is `script-src 'self' 'wasm-unsafe-eval'; object-src 'self';`). `script-src`, `object-src`, and `worker-src` may only use `self`, `none`, `wasm-unsafe-eval` (plus localhost for unpacked). `unsafe-eval` and remote origins fail at install.

- WebAssembly needs `'wasm-unsafe-eval'` in `extension_pages`.
- No inline `<script>` or inline event handlers in extension pages. Use external script files.
- `eval`, `new Function`, and string-based `setTimeout` are blocked in extension pages. Use a `sandbox` page (relaxed CSP, no extension APIs, communicates by `postMessage`) if a library needs `eval`, such as a template engine.
- Remote code means any logic fetched at runtime: CDN scripts, remote `<script src>`, `import('https://...')`, code strings from your server, or an interpreter for fetched commands. All of it is rejected under "Additional requirements for Manifest V3" (Blue Argon). Remote data (JSON config, feature flags, remote selector lists treated as data) is allowed as long as it contains no logic.
- Libraries must be bundled. WXT 0.21 removed `url:` imports (bundling remote code by URL); install from npm or vendor the file into the repo and review it. Check dependencies (Firebase-style SDKs) for dynamic runtime fetching of scripts.
- `browser.scripting.executeScript({ func, args })` injects a function from your bundle; `files` injects bundled files. Both are allowed. `code`/string injection is gone.
- Page-world CSP still applies to MAIN-world scripts. A page with strict `script-src` can block inline injection, which is why MAIN-world code should ship as a file (`injectScript('/injected.js')` with a `web_accessible_resources` entry, or `world: 'MAIN'` on the content script), not as inline `<script>` text. On MV2 builds `injectScript` falls back to an inline script, so the page CSP can block it.

## web_accessible_resources and externally_connectable

```json
"web_accessible_resources": [
  { "resources": ["injected.js", "icons/*.svg"], "matches": ["https://www.example.com/*"] }
]
```

- Every exposed file lets matching sites fingerprint your extension (the file URL resolves only if installed). Expose the minimum and only to the matches that need it. `use_dynamic_url: true` randomises the URL per session (Chromium) at the cost of stable links.
- A content script reading its own extension files via `fetch(browser.runtime.getURL(...))` from the page origin needs the file listed here.
- `externally_connectable.matches` must be specific hosts (second-level domain minimum, no `*://*/*`). Always validate `sender.origin`/`sender.id` in `onMessageExternal` and `onConnectExternal`; treat payloads as untrusted.

## Versioning and stable ID

- Bump `version` in `package.json` before every upload. The store rejects equal or lower versions.
- For unpacked loads that need a stable ID, add `manifest.key` (public key from the dashboard Package tab or generated by you). Keep the private key out of the repo.
- Adding a permission or host in an update can disable the extension for existing users until they accept; test with Google's Extension Update Testing tool (Chromium) before shipping. Prefer optional permissions for non-core additions.
