# Publishing and Store Review

## Table of contents

- Build and zip with WXT
- wxt submit
- Chrome Web Store: first listing and dashboard fields
- Review process and timing
- Rejection reasons and fixes
- Permission justifications
- Updates, staged rollout, and API v2
- Firefox AMO
- Edge Add-ons
- Pre-submission checklist

## Build and zip with WXT

```sh
bun run zip              # wxt zip           -> .output/<name>-<packageVersion>-chrome.zip  (use for Chrome and Edge)
bun run zip:firefox      # wxt zip -b firefox -> firefox zip + <name>-<packageVersion>-sources.zip
bunx wxt zip -b edge     # only if you have Edge-specific entrypoints or manifest values
bunx wxt zip -b safari   # Safari output is a web extension folder, not a store zip (see cross-browser.md)
```

- Zip names come from `zip.artifactTemplate` / `zip.sourcesTemplate` (defaults use `{{packageVersion}}`, `{{browser}}`, `{{modeSuffix}}`). Customize filters with `zip.exclude` (extension zip), `zip.excludeSources`, `zip.includeSources`, `zip.dotSources`, `zip.downloadPackages`, `zip.compressionLevel`.
- The manifest must sit at the zip root. WXT does this; verify by unzipping.
- Bump `package.json` `version` first. Store uploads require a strictly higher version.
- Test the zip contents, not the folder.

## wxt submit

WXT wraps `publish-browser-extension` (v6.x with WXT 0.21.3+). First submission to each store is manual: create the listing yourself.

```sh
bunx wxt submit init                 # writes .env.submit with store secrets and options
bunx wxt submit --dry-run \
  --chrome-zip .output/<name>-<version>-chrome.zip \
  --firefox-zip .output/<name>-<version>-firefox.zip --firefox-sources-zip .output/<name>-<version>-sources.zip \
  --edge-zip .output/<name>-<version>-chrome.zip
bunx wxt submit ...same flags without --dry-run
```

Environment variables (any CLI flag works as an UPPER_SNAKE env var; do not commit `.env.submit`):

| Store | Variables |
| --- | --- |
| Chrome | `CHROME_EXTENSION_ID`, `CHROME_API_VERSION` (`v1.1` or `v2`), and for v2 `CHROME_PUBLISHER_ID` plus either `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` + `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` or `CHROME_SERVICE_ACCOUNT_ACCESS_TOKEN`; optional `CHROME_PUBLISH_TYPE=STAGED_PUBLISH`, `CHROME_DEPLOY_PERCENTAGE`, `CHROME_CANCEL_PENDING`, `CHROME_SKIP_SUBMIT_REVIEW`. Deprecated v1.1: `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`. |
| Firefox | `FIREFOX_EXTENSION_ID`, `FIREFOX_JWT_ISSUER`, `FIREFOX_JWT_SECRET`, `FIREFOX_CHANNEL` (`listed` or `unlisted`), sources zip via `--firefox-sources-zip` |
| Edge | `EDGE_PRODUCT_ID`, `EDGE_CLIENT_ID`, `EDGE_API_KEY` |

Run `wxt submit init` to see the exact prompts for the installed version. Chrome Web Store API v1 stopped being the latest in October 2025; v2 uses publisher-scoped URLs (`https://chromewebstore.googleapis.com/v2/publishers/{publisherId}/items/{extensionId}:upload` / `:publish` / `:fetchStatus` / `:cancelSubmission` / `:setPublishedDeployPercentage`) and supports service accounts. Verify the installed `publish-browser-extension` supports the auth method you set up; if not, call the REST endpoints directly. Use `--dry-run` first, and in CI add all variables to the submit step (GitHub Actions secrets).

## Chrome Web Store: first listing and dashboard fields

- Requirements: developer account (one-time registration fee, currently $5), 2-step verification on the Google account, ZIP up to 2 GB, new publishers start limited to 2 published extensions (request an increase in the dashboard).
- Listing tab: name, summary (manifest `description`, 132 characters max), detailed description, category, icon (128x128), screenshots (1280x800 or 640x400), optional promo tiles.
- Privacy tab (required before first publish): single purpose description, permission justifications (one per permission and host pattern), remote code declaration ("No, I am not using remote code" if true), data usage disclosures and certification of the Limited Use policy, privacy policy URL (required when handling user data).
- Distribution tab: visibility (public, unlisted, private/trusted testers), regions, pricing.
- Test instructions tab: credentials or steps reviewers need for login-gated features. Provide a test account when the extension works only on logged-in sites.
- Submit for review. Optionally defer publishing: after approval you have up to 30 days to publish manually before the staged submission reverts to a draft.
- Roles: since April 2026 you can invite team members to a publisher account with one of four roles at no cost, and publish privately to external organizations (February 2026).

## Review process and timing

- Most reviews finish in a few days; up to a few weeks. Contact support if pending over three weeks.
- Longer reviews: new developers or extensions, broad host permissions (`<all_urls>`, `*://*/*`, `https://*/*`), sensitive permissions (`tabs`, `downloads`, `cookies`, `webRequest`, `debugger`), significant code changes, large or hard-to-read code. Obfuscation is not allowed (minification is). Submit readable code where possible.
- Published items are re-reviewed periodically and after policy changes. Outcomes: no action, warning with a deadline, immediate takedown, or malware takedown without notice.
- Appeals go through the dashboard item page (appeals process revamped April 2026).

## Rejection reasons and fixes

The store assigns each violation a color-element ID in the rejection email.

| ID | Meaning | Typical cause | Fix |
| --- | --- | --- | --- |
| Blue Argon | Remote hosted code (MV3) | `<script src="https://...">`, `eval`, `new Function`, CDN libraries, interpreter for fetched commands | Bundle everything, no remote logic; remote JSON data only; declare "No remote code" truthfully |
| Yellow Magnesium | Functionality not working | Manifest references a missing file (icons), case mismatch (`Background.js` vs `background.js`), broken server, feature not matching listing | Test the packed zip; verify every path; show clear errors when a service/login is needed |
| Purple Potassium | Excessive permissions | Unused permission, broad host patterns, "future-proofing" | Remove unused entries from `permissions`, `optional_permissions`, `host_permissions`; narrow hosts; use `activeTab`/optional permissions |
| Yellow Zinc | Missing or misleading metadata | Missing icon/title/screenshots/description, meaningless text | Complete the listing; describe what it does |
| Purple Lithium | Privacy policy / disclosure | Handles user data without a valid policy link | Add policy URL in the privacy field; it must work and match the declared data use |
| Purple Nickel | Prominent disclosure and consent | Collects data without explicit in-product disclosure | Disclose in listing and UI before collection; get affirmative consent; offer opt-out |
| Purple Copper | Insecure transmission | Sends user data over HTTP | HTTPS only, modern crypto |
| Purple Magnesium | Other user data requirements | Selling/transferring data, unrelated uses, ads based on data | Follow Limited Use; collect only for the single purpose |
| Red Magnesium / Copper / Lithium | Single purpose violations | Unrelated bundled features, search/new-tab hijacking | Narrow the extension to one narrow purpose or split it |
| Red Titanium | Obfuscation | Base64/character encoding, concealed functionality | Ship readable or minified-only code |
| Red Nickel / Potassium | Deceptive behavior | Misleading claims, hidden functionality, impersonation | Make the listing match behavior |
| Red Zinc | Deceptive installation | Misleading install flows, hidden listing content | Honest marketing |
| Yellow Argon | Keyword stuffing | Irrelevant or repeated keywords, anonymous testimonials | Plain, accurate description |
| Yellow Lithium / Nickel | Redirection / spam | Opening unrelated pages, repeated submissions | Remove; do not resubmit variants |
| Yellow Potassium | Minimum functionality | Almost no value, template-copy extensions | Add real utility |
| Blue Zinc / Copper / Lithium / Magnesium | Prohibited products | Facilitating paywall or login bypass, downloading YouTube videos, downloading copyrighted media, crypto mining | Remove the feature; unlisted/personal builds only if appropriate |
| Blue Nickel / Potassium | Circumventing the overrides API | Replacing new tab or search by other means | Use the official override entrypoints |
| Grey Titanium | Affiliate ads | Injecting affiliate links without clear benefit and disclosure | Follow affiliate ad rules |
| Blue Titanium | Enforcement circumvention | Reposting a removed item | Appeal instead |

Do not reuse the same manifest with a new listing after a removal. Appeal with specific explanations.

## Permission justifications

Write one clear line per permission, in terms of the single purpose, for the privacy tab:

- `storage`: saves user settings and download history locally.
- `alarms`: schedules the periodic refresh while the service worker is asleep.
- `offscreen`: holds validated file data until the download finishes (reason `BLOBS`).
- `scripting`: injects the content script on user request (only if actually used).
- `downloads`: saves the file the user chose.
- host `https://x.com/*`: adds the button to posts on x.com.

Reviewers compare justifications to code. Remove any permission you cannot justify in a sentence. Note that `tabs`, `activeTab`, `cookies`, and `storage` are frequently over-requested; see the misconceptions in [manifest-permissions.md](manifest-permissions.md).

## Updates, staged rollout, and API v2

- Every update is reviewed like a new submission; changes in permissions can disable the extension until users accept. Test with Google's Extension Update Testing tool.
- Percentage rollout is available once an item has over 10,000 seven-day active users (`setPublishedDeployPercentage`); `CHROME_DEPLOY_PERCENTAGE` in `wxt submit`.
- `minimum_chrome_version` freezes users on older Chrome; raise it through a staged rollout.
- Cancel a pending review with `cancelSubmission` (or `CHROME_CANCEL_PENDING`) to upload a fix.
- Publishing through the API keeps the dashboard's visibility settings; if you changed visibility manually, publish once manually first.

## Firefox AMO

- `wxt zip -b firefox` creates the extension zip and a sources zip. AMO requires sources so reviewers can rebuild; check the sources zip manually (no secrets), delete or deliberately include `.env` files (they change chunk hashes), and add `README.md` or `SOURCE_CODE_REVIEW.md` with: `bun install` then `bun run zip:firefox`. Confirm the rebuilt output equals `wxt build -b firefox`.
- Private npm packages: `zip.downloadPackages` plus a `.npmrc` (WXT uses `npm pack`, even with Bun).
- Required: `browser_specific_settings.gecko.id` and, for new extensions since 2025-11-03, `browser_specific_settings.gecko.data_collection_permissions`: `{ required: ['none'] }` if nothing is collected, or list types (`personallyIdentifyingInfo`, `healthInfo`, `financialAndPaymentInfo`, `authenticationInfo`, `personalCommunications`, `locationInfo`, `browsingActivity`, `websiteContent`, `websiteActivity`, `searchTerms`, `bookmarksInfo`, ...) in `required`/`optional`; `technicalAndInteraction` is always optional. Built-in consent exists from Firefox 140 desktop and 142 Android; set `strict_min_version` accordingly or provide a custom flow for older versions.
- `userScripts` is accepted only for user script managers. Firefox forbids remote code and cross-origin `fetch` from content scripts under MV3.
- Lint: `bunx web-ext lint -s .output/firefox-mv3`.

## Edge Add-ons

- Chrome zip works unchanged unless you use Edge-only features. First listing is manual in Partner Center; `wxt submit` handles updates with `EDGE_PRODUCT_ID`, `EDGE_CLIENT_ID`, `EDGE_API_KEY`.

## Pre-submission checklist

- Manifest: version bumped, `description` at most 132 characters, icons present, `minimum_chrome_version` intentional, no unused permission or host.
- No remote code, no obfuscation, no CDN scripts; dependencies do not fetch code at runtime.
- Single purpose statement written; permission justifications written; data disclosures match actual behavior (check every `fetch` destination and message to third parties).
- Privacy policy URL live and specific; Limited Use certification accurate.
- Test instructions and credentials provided if login is required.
- Screenshots reflect the current UI; listing does not promise unsupported behavior or mention unaffiliated brands as endorsements.
- Packed zip tested in a clean profile; works signed-out and signed-in; failure states show messages.
- Not a media downloader for copyrighted/protected content on third-party sites; if it is, expect rejection and ship privately.
