# Mobbin MCP Setup and Gate

## Required before design work

1. Discover available MCP servers and locate **Mobbin** (name may appear as `Mobbin`, `mobbin`, or similar).
2. Inspect Mobbin tools and read each tool’s input schema before the first call.
3. If status is unauthorized / `needsAuth`, run the harness auth flow for that server (browser OAuth to Mobbin), then re-inspect and retry.
4. Only after a successful tool response may UI direction, mockups, or implementation proceed under this skill.

## If Mobbin MCP is missing

Stop inventing UI. Tell the user:

1. MCP needs a **paid** Mobbin plan (Pro / Team / Enterprise).
2. Add the HTTP MCP server: `https://api.mobbin.com/mcp`.
3. For Cursor: Settings → Tools & MCPs → add server, or use the official install deeplink from `https://docs.mobbin.com/mcp/clients/cursor`.
4. Click **Connect** and complete Mobbin OAuth in the browser.
5. Re-run the task after the server shows ready.

Do not substitute guessed layouts while waiting. Optional interim: user browses `https://mobbin.com/` manually and pastes links/screenshots — still cite those; do not fabricate Mobbin hits.

## Auth and plans

- MCP: OAuth, no API key in agent config.
- Same library as the Mobbin website.
- Revoke: `https://docs.mobbin.com/mcp/disconnect`

## Calling conventions

- Always discover schemas first — argument names and enums can drift.
- Expected tools (official docs):
  - `search_screens`
  - `search_flows`
  - `search_sections`
- Prefer parallel searches only when intents are disjoint (e.g. one screen query + one flow query), not duplicate vague queries.
- On `401` / `403` / auth errors: authenticate or report plan limitation; do not invent references.
- On rate limits (`429`): wait, reduce `limit`, switch to `mode: "standard"`, and continue — still no memory-based UI.

## Manual website fallback (secondary only)

Use the Mobbin website when MCP cannot run **and** the user accepts delayed inspiration. Record every reference URL. Never claim MCP results you did not receive.
