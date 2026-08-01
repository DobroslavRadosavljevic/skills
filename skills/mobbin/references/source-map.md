# Mobbin Source Map

Snapshot date: 2026-08-01.

## What Mobbin Is

[Mobbin](https://mobbin.com/) is a curated UI/UX reference library of **real shipped** iOS apps, web apps, and websites (hundreds of thousands of screens and flows, updated weekly). It is used to benchmark patterns before building — not to browse speculative portfolio mockups.

Product pages:

- Home: `https://mobbin.com/`
- MCP landing: `https://mobbin.com/mcp`
- Docs index: `https://docs.mobbin.com/llms.txt`
- Overview: `https://docs.mobbin.com/overview`

## Mobbin MCP

Remote MCP server for AI agents. Returns design references (including images inline for agent consumption) via natural-language search.

| Item | Value |
| --- | --- |
| Server URL | `https://api.mobbin.com/mcp` |
| Transport | Streamable HTTP |
| Auth | OAuth (browser sign-in; no API key for MCP) |
| Plans | Pro, Team, Enterprise |
| Official tools | `search_screens`, `search_flows`, `search_sections` |

Docs:

- Introduction: `https://docs.mobbin.com/mcp/introduction`
- Features / tools: `https://docs.mobbin.com/mcp/features`
- Cursor setup: `https://docs.mobbin.com/mcp/clients/cursor`
- Client list: `https://docs.mobbin.com/mcp/clients/overview`
- Disconnect: `https://docs.mobbin.com/mcp/disconnect`
- Build custom MCP client: `https://docs.mobbin.com/mcp/build-an-integration`

## REST API (not the skill default)

Team/Enterprise API key access at `https://api.mobbin.com`. Useful for custom integrations; **this skill prefers MCP tools** in agent sessions.

- Quick start: `https://docs.mobbin.com/api/quickstart`
- Screens search: `https://docs.mobbin.com/api-reference/screens/search-screens-with-natural-language`
- OpenAPI: `https://docs.mobbin.com/openapi.json`

Query-writing guidance in the OpenAPI `query` field is authoritative for good search phrasing (also used by MCP screen search).

## Cursor install (reference)

Deeplink install is documented at `https://docs.mobbin.com/mcp/clients/cursor`. Manual `mcp.json` shape:

```json
{
  "mcpServers": {
    "Mobbin": {
      "type": "http",
      "url": "https://api.mobbin.com/mcp",
      "headers": {}
    }
  }
}
```

Then Connect / OAuth with a paid Mobbin account.
