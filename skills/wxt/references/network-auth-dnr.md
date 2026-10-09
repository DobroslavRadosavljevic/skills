# Network, CORS, declarativeNetRequest, Auth

## Table of contents

- Where requests should run
- Cross-origin fetch from the background
- Forbidden headers and Referer/Origin rewriting
- declarativeNetRequest in a WXT project
- webRequest
- Cookies and logged-in sessions
- identity, OAuth, and tokens
- Secrets and your backend
- Downloads

## Where requests should run

| Context | Cross-origin rules |
| --- | --- |
| Content script (`defineContentScript`) | Page's origin and CORS apply, even with `host_permissions`. Uses the page's cookies for same-site calls. |
| Background service worker | Bypasses CORS for hosts in `host_permissions`. No page cookies by default; `credentials: 'include'` sends the browser's cookies for that host. Must finish a `fetch` response within 30 s or the worker may stop. |
| Popup, options, side panel, offscreen document | Same as the background (extension origin). Good for long downloads and streaming parse. |
| MAIN world (injected script) | Acts as the page. No extension APIs. |

Pattern: content script asks the background (`browser.runtime.sendMessage({ type: 'fetch-json', url })`), the background validates the URL against an allow-list, fetches, and replies. Never forward arbitrary URLs from page-controlled data without an allow-list: the background has elevated network reach.

## Cross-origin fetch from the background

- Add the origins to `manifest.host_permissions` in `wxt.config.ts`. Scheme counts (`https://` and `http://` are separate), paths are ignored.
- Use `fetch` (not `XMLHttpRequest`) in the worker. Check `res.ok`, `Content-Type`, and size before reading; return structured errors to the caller.
- Treat fetched content as untrusted: do not assign it to `innerHTML` in popup/offscreen pages (XSS in a privileged page). Use `textContent` or a sanitizer.
- Long transfers: stream with `res.body`, enforce a byte cap and timeout (`AbortSignal.timeout(...)`), and keep large bodies out of messages (messages cap at 64 MiB). Hand bytes over as a `blob:` URL from an offscreen document or via IndexedDB.

## Forbidden headers and Referer/Origin rewriting

`fetch` cannot set `Referer`, `Origin`, `Cookie`, or `User-Agent`. Some CDNs require a matching `Referer`. Use a DNR session rule scoped to the extension's own requests:

```ts
await browser.declarativeNetRequest.updateSessionRules({
  removeRuleIds: [1001],
  addRules: [{
    id: 1001, priority: 1,
    action: { type: 'modifyHeaders', requestHeaders: [
      { header: 'referer', operation: 'set', value: 'https://www.example.com/' },
    ] },
    condition: {
      urlFilter: '||cdn.example.com/',
      initiatorDomains: [browser.runtime.id],     // only requests started by this extension
      resourceTypes: ['xmlhttprequest', 'media'],
    },
  }],
});
```

Needs `declarativeNetRequest` plus host permission for the target (or `declarativeNetRequestWithHostAccess`). Scope tightly (`initiatorDomains`/`requestDomains`) so you do not rewrite the user's normal browsing. Verify `initiatorDomains` behavior with the extension ID on the target Chrome version.

## declarativeNetRequest in a WXT project

Permissions: `declarativeNetRequest` (block/allow/upgradeScheme without host access; redirect and modifyHeaders still need host permissions), or `declarativeNetRequestWithHostAccess` (all actions, host-gated, shows weaker warning). `declarativeNetRequestFeedback` (debug `getMatchedRules`, `onRuleMatchedDebug`; unpacked/dev use).

Static rulesets live in `public/` and are declared in the manifest config:

```json
// public/rules/ads.json
[{ "id": 1, "priority": 1, "action": { "type": "block" },
   "condition": { "urlFilter": "||ads.example.com^", "resourceTypes": ["script", "image", "xmlhttprequest"] } }]
```

```ts
// wxt.config.ts
manifest: {
  permissions: ['declarativeNetRequest'],
  host_permissions: ['https://*.example.com/*'],
  declarative_net_request: { rule_resources: [{ id: 'ads', enabled: true, path: 'rules/ads.json' }] },
},
```

Runtime control (background): `browser.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds, disableRulesetIds })`, `updateDynamicRules({ addRules, removeRuleIds })` (persist across sessions), `updateSessionRules` (cleared on browser restart), `getAvailableStaticRuleCount()`, `testMatchOutcome()` (debug).

Action types: `block`, `redirect`, `allow`, `allowAllRequests`, `upgradeScheme`, `modifyHeaders`. Conditions: `urlFilter` or `regexFilter` (not both), `domains`/`initiatorDomains`, `requestDomains`, `excludedInitiatorDomains`, `resourceTypes`, `excludedResourceTypes`, `requestMethods`, `tabIds`, `isUrlFilterCaseSensitive`. Highest `priority` wins; `allow` outranks `block` at equal priority.

Limits (current docs): up to 100 static rulesets, 50 enabled at once, at least 30,000 guaranteed static rules across enabled rulesets (more depend on global quota; `getAvailableStaticRuleCount()`); 30,000 dynamic rules (5,000 of them may be "unsafe": redirect/modifyHeaders types); 5,000 session rules; 1,000 regex rules per type, each under 2 KB compiled. Disabled extensions' static rules stop counting toward the global limit (Chrome 128+).

Notes:

- Rules apply across browsers with small differences; Firefox supports DNR in MV3 and still allows blocking `webRequest`.
- `public/` files are copied as-is, so rule JSON must be strict JSON (no comments).
- Rulesets that only change data (filter lists) can be updated by the extension via dynamic rules; shipping a changed logic still requires a store update. Rule data is data, not remote code, but do not build an interpreter on top of fetched rules.

## webRequest

In MV3 `webRequest` is observe-only for normal extensions (no blocking, no request modification). Use it only to read request/response metadata (`onBeforeRequest`, `onCompleted`, `onHeadersReceived` without blocking), with host permissions. It extends review scrutiny. Prefer a MAIN-world fetch hook or DNR when possible.

## Cookies and logged-in sessions

- `browser.cookies` needs the `cookies` permission and host permissions for the cookie's origin. It is a sensitive permission: reviewers ask why. Do not read auth cookies of third-party sites to reuse their sessions elsewhere.
- Prefer letting the browser attach cookies: a background `fetch(url, { credentials: 'include' })` sends the user's cookies for that host when host permission exists, and a content-script call to the same site runs as the logged-in user without touching cookie values.
- `document.cookie` and the Cookie Store API do not require the `cookies` permission.
- Partitioned (CHIPS) cookies are addressed with `partitionKey`; check the API reference before relying on `getAll` for embedded third-party contexts.
- Never log, persist, or transmit cookie values. If a native helper or server needs access, ask for the minimum (a one-time token) rather than the session cookie, and disclose it in the privacy tab (authentication information and website content are regulated data types).
- `SameSite`/`Secure`/`HttpOnly` flags matter when setting cookies; `browser.cookies.set` needs the full `url`.

## identity, OAuth, and tokens

- `browser.identity.launchWebAuthFlow({ url, interactive: true })` for any provider; redirect to `browser.identity.getRedirectURL()` (`https://<extension-id>.chromiumapp.org/`). Register that exact redirect with the provider; the ID must be stable, so set `manifest.key` for unpacked testing. Use authorization code with PKCE; store the result in `storage.session` (short-lived) or `storage.local` (it is unencrypted on disk).
- `browser.identity.getAuthToken` (Google accounts only) needs the `identity` permission and `oauth2` in the manifest (`client_id`, `scopes`); set it in the `manifest` function so `import.meta.env.WXT_*` values load. Firefox does not support `getAuthToken`.
- `launchWebAuthFlow` is allowed to run past the 5-minute worker limit (it shows a prompt).
- Refresh tokens stay on your backend where possible; the extension holds an access token with the shortest useful lifetime.
- Extension sign-in pages (`options` entrypoint) can use the provider's popup flow; do not embed login forms for third-party sites.

## Secrets and your backend

- Everything in the zip and in `import.meta.env.WXT_*` / `VITE_*` is public. Never ship API keys, signing secrets, or private keys; `.env.submit` and `.env.publish` hold store credentials and must not be bundled or zipped into sources.
- Put paid-API keys on your server; have the extension call it with a short-lived token tied to the user. Rate-limit and authenticate server-side, because anyone can extract the extension and replay calls.
- Verify requests server-side that arrive from your extension by user auth, not by `Origin` (spoofable; extension origin is `chrome-extension://<id>`).
- Disclose every network destination that receives user data (page content, URLs, identifiers) in the privacy fields and policy. Send only what the feature needs. No remote logic.

## Downloads

- `downloads` permission, `browser.downloads.download({ url, filename, saveAs, conflictAction })`. `filename` is relative to the Downloads folder, no `..`. React in `downloads.onChanged` (`state.current` `complete` or `interrupted`) and keep job state in `storage.session`.
- The browser sends its own cookies for the download URL. For signed or header-sensitive URLs, fetch in the background/offscreen document, validate (status, content-type, magic bytes, size cap), keep a `blob:` URL in the offscreen document, download that, then `URL.revokeObjectURL` on completion.
- Respect copyright and site terms: facilitating unauthorized downloads is a store-policy violation (see [publishing-review.md](publishing-review.md)).
