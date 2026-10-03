# ElevenAgents platform (agent config, LLMs, tools, knowledge, workflows, telephony, ops)

Snapshot 2026-10-03. ElevenAgents = former "Conversational AI". REST stays `/v1/convai/*`; JS SDK namespace `client.conversationalAi.*` (camelCase bodies), Python `client.conversational_ai.*`, CLI/REST JSON snake_case. Front-end clients: [agents-clients.md](agents-clients.md). Endpoint list: [api-endpoints.md](api-endpoints.md#agents--agents).

## Contents

- [Build path](#build-path)
- [Create an agent](#create-an-agent)
- [Config map](#config-map)
- [Prompting](#prompting)
- [LLMs, reasoning, backup, custom LLM](#llms-reasoning-backup-custom-llm)
- [Voice, language, turn-taking](#voice-language-turn-taking)
- [Tools](#tools)
- [System tools and transfers](#system-tools-and-transfers)
- [MCP servers as tools](#mcp-servers-as-tools)
- [Knowledge base and RAG](#knowledge-base-and-rag)
- [Workflows](#workflows)
- [Procedures](#procedures)
- [Personalization: dynamic variables, overrides, initiation webhook](#personalization-dynamic-variables-overrides-initiation-webhook)
- [Guardrails](#guardrails)
- [Text, files, DTMF, channels](#text-files-dtmf-channels)
- [Telephony and channels](#telephony-and-channels)
- [Batch and outbound calls](#batch-and-outbound-calls)
- [Testing](#testing)
- [Analysis, conversations, monitoring](#analysis-conversations-monitoring)
- [Post-call webhooks](#post-call-webhooks)
- [Versioning, branches, deployments, environments](#versioning-branches-deployments-environments)
- [Agents as code (CLI)](#agents-as-code-cli)
- [Privacy, compliance](#privacy-compliance)
- [Pricing and limits](#pricing-and-limits)
- [Reception AI](#reception-ai)
- [Gotchas](#gotchas)

## Build path

1. Define the job, channels (web, phone, WhatsApp, chat), languages, and what the agent may do (tools) and know (KB).
2. Create the agent (API/SDK, CLI agents-as-code, dashboard, or hosted MCP). Keep config in version control via the CLI for real projects.
3. Prompt with the structured template below; attach tools by ID; add KB; add `end_call` explicitly.
4. Add evaluation criteria + data collection, and tests (simulation, next-reply, tool-call).
5. Choose auth (signed URL/token vs allowlist), overrides, client events.
6. Connect a front end or phone number; add post-call webhooks.
7. Iterate with branches + traffic splits; watch analytics.

## Create an agent

```ts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
const elevenlabs = new ElevenLabsClient();

const { agentId } = await elevenlabs.conversationalAi.agents.create({
  name: "Acme support",
  tags: ["support", "prod"],
  conversationConfig: {
    agent: {
      firstMessage: "Hi {{user_name}}, this is Acme support. How can I help?",
      language: "en",
      prompt: {
        prompt: SYSTEM_PROMPT,
        llm: "gemini-3.5-flash",
        temperature: 0.2,
        toolIds: [lookupOrderToolId],
        builtInTools: { endCall: { type: "system", name: "end_call", description: "", params: { systemToolType: "end_call" } } },
        knowledgeBase: [{ type: "file", name: "Returns policy", id: kbDocId, usageMode: "auto" }],
      },
    },
    tts: { modelId: "eleven_v4_turbo", voiceId, stability: 0.5, speed: 1.0 },
    asr: { keywords: ["Acme"] },
    turn: { turnTimeout: 7, turnEagerness: "normal" },
    conversation: { maxDurationSeconds: 900, clientEvents: ["audio", "interruption", "agent_response", "user_transcript", "agent_chat_response_part"] },
  },
  platformSettings: {
    auth: { enableAuth: true },
    evaluation: { criteria: [{ id: "resolved", name: "Resolved", type: "prompt", conversationGoalPrompt: "The customer's issue was resolved." }] },
    dataCollection: { order_id: { type: "string", description: "Order ID the user asked about" } },
  },
});
```

Other agent operations: `agents.get(agentId, { branchId?, versionId?, includeDraft? })`, `agents.update(agentId, partial)` (PATCH), `agents.list({ search, tags, pageSize, cursor })`, `agents.duplicate`, `agents.delete`, `agents.link.get` (shareable talk-to page), `agents.summaries.get`.

## Config map

Top-level body: `{ conversation_config, platform_settings, workflow, name, tags }` (`workflow` is a **top-level** field in the OpenAPI, even though one docs page nests it under `conversation_config`).

`conversation_config`:

- `agent`: `first_message` ("" = wait for user), `language` ("en"), `dynamic_variables.dynamic_variable_placeholders` (test defaults), `disable_first_message_interruptions`, `max_conversation_duration_message`, `text_behavior_overrides` (per channel), `hinglish_mode`.
- `agent.prompt`: `prompt`, `llm` (default `gemini-2.5-flash`), `temperature` (0.0), `max_tokens` (-1), `reasoning_effort`, `thinking_budget`, `enable_reasoning_summary`, `tool_ids`, `built_in_tools`, `enable_parallel_tool_calls` (true), `mcp_server_ids`, `native_mcp_server_ids`, `knowledge_base[]`, `rag`, `custom_llm`, `backup_llm_config`, `cascade_timeout_seconds` (4), `timezone`, `ignore_default_personality`. Inline `tools` is **deprecated** — use `tool_ids`.
- `tts`: `model_id` (default `eleven_v4_turbo`; also `eleven_v4`, `eleven_v3_conversational`, `eleven_flash_v2_5`, `eleven_flash_v2`, `eleven_multilingual_v2`, turbo), `voice_id`, `supported_voices[]` (multi-voice), `expressive_mode` (true), `suggested_audio_tags[]`, `agent_output_audio_format` (`pcm_16000` default; `ulaw_8000` telephony), `stability` (0.5), `similarity_boost` (0.8), `speed` (0.7–1.2), `text_normalisation_type` (`system_prompt` | `elevenlabs`), `pronunciation_dictionary_locators`, `enable_phoneme_tags`.
- `asr`: `provider` (`scribe_realtime` default), `quality`, `user_input_audio_format`, `keywords[]`.
- `turn`: `turn_timeout` (7 s, 1–30), `initial_wait_time`, `silence_end_call_timeout` (-1 off), `turn_eagerness` (`patient|normal|eager`), `turn_model` (`turn_v3`), `speculative_turn`, `spelling_patience`, `soft_timeout_config` (filler after N s), `interruption_ignore_terms[]`.
- `conversation`: `text_only`, `max_duration_seconds` (600; 60–7200), `client_events[]`, `file_input`, `dtmf_input_settings`, `background_sound`, `monitoring_enabled`, `source_attribution`.
- `language_presets`: per-language overrides (first message, voice, prompt…).
- `vad.background_voice_detection`.

`platform_settings`: `auth` (`enable_auth`, `allowlist`, `require_origin_header`), `overrides` (which client overrides are allowed), `evaluation.criteria`, `data_collection`, `analysis_items`, `widget`, `guardrails`, `privacy`, `call_limits` (`agent_concurrency_limit`, `daily_limit`, `bursting_enabled`), `queueing_config`, `workspace_overrides` (initiation webhook, post-call webhooks), `testing.attached_tests`, `summary_language`, `analysis_llm`, `alerting`.

Inspect the live schema: `python3 scripts/openapi_lookup.py /v1/convai/agents/create --full`.

## Prompting

Use markdown sections the model is tuned for:

```markdown
# Personality
# Environment        (channel, who calls, what you can see)
# Tone               (spoken style: short sentences, no lists/markdown in voice)
# Goal               (numbered steps; mark critical lines "This step is important.")
# Guardrails         (scope limits, what never to do, escalation)
# Tools
## `lookup_order`    When to use / how to use / error handling
# Error handling
```

- Keep prompts under ~2,000 tokens; move reference material to the KB; split specialists via workflows or agent transfer.
- Voice output: tell the model to speak numbers, emails, URLs naturally, or set `text_normalisation_type: "elevenlabs"`. With `system_prompt` normalization, tool params may arrive spoken ("john at gmail dot com") — specify exact formats in parameter descriptions.
- Expressive models: the LLM may emit audio tags (`[laughs]`, `[whispers]`); steer with `suggested_audio_tags`.
- Disclose AI and recording at the start (required by terms).

## LLMs, reasoning, backup, custom LLM

Supported (Oct 2026, verify with `GET /v1/convai/llm/list`): ElevenLabs-hosted `glm-52`, `deepseek-v41-flash`, `qwen35-397b-a17b`, `qwen36-35b-a3b`; Google `gemini-3.8-flash` … `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-pro-preview`, `gemini-2.5-flash`; OpenAI `gpt-6.1-sol`, `gpt-6-astra|sol|luna`, `gpt-5.6-sol|terra|luna`, `gpt-5.5`, `gpt-5.4(-mini|-nano)`, `gpt-4.1*`, `gpt-4o*`; Anthropic `claude-opus-5-5`, `claude-opus-5`, `claude-sonnet-5-5`, `claude-sonnet-5`, `claude-sonnet-4-6`, `claude-haiku-4-5`; plus `custom-llm`.

- Docs recommendations: balanced default GLM 5.2 or GPT-6 Luna; ultra-low latency DeepSeek Flash 4.1 or Gemini 3.5 Flash-Lite; complex tool orchestration Claude Sonnet 5.5.
- Temperature 0–0.3 for task agents. Reasoning: `reasoning_effort` (`none…max`) or `thinking_budget`; start low for voice.
- LLM cost is pass-through (no markup), billed on top of minutes. Estimate: `client.conversationalAi.llmUsage.calculate({ promptLength, numberOfPages, ragEnabled })` or per agent `agents.llmUsage.calculate(agentId)`.
- Backup LLMs: `backup_llm_config` `{ preference: "default" }` (recommended) | `{ preference: "override", order: [...] }` | `{ preference: "disabled" }`; triggers on errors/timeouts/empty output after `cascade_timeout_seconds`.
- Custom LLM: `prompt.llm = "custom-llm"` and `prompt.custom_llm = { url, model_id, api_key: { secret_id } | { env_var_label }, request_headers, api_type: "chat_completions" | "responses" | "websocket" }`. Your server implements OpenAI-compatible streaming (SSE, `data: [DONE]`), function calling (system tools arrive as functions), and receives `elevenlabs_extra_body` from `customLlmExtraBody` (enable `platform_settings.overrides.custom_llm_extra_body`). Start slow responses with a filler chunk ending in `"... "`. Works with Groq, Together, SambaNova, Cloudflare Workers AI endpoints. For full control of the conversation loop, consider Speech Engine instead ([speech-engine.md](speech-engine.md)).

## Voice, language, turn-taking

- TTS: realtime models only (`eleven_v4_turbo`, `eleven_flash_v2_5`, `eleven_v3_conversational`; `eleven_flash_v2` English). Voices with live moderation cannot be used. PVCs keep their character best on Flash.
- Multi-voice: `tts.supported_voices: [{ label, voice_id, description }]` (≤10 incl. default); the LLM switches with `<Label>text</Label>`.
- Languages: `agent.language` + `language_presets` (per-language first message/voice); `language_detection` system tool switches mid-call.
- Turn-taking: patient eagerness + longer `turn_timeout` for collecting numbers/emails; eager for quick service. `soft_timeout_config.timeout_seconds: 3` plays a filler during slow LLM turns. Interruptions require `"interruption"` in `client_events`; tools can restrict with `interruption_mode`.
- Background ambience: `conversation.background_sound { source_type: "preset", source_id: "office1"|"restaurant"|…, volume: 0.15 }`; disable by setting `source_type` and `source_id` to null.
- Pronunciation dictionaries via `tts.pronunciation_dictionary_locators` (phoneme rules only on v4/v3/flash_v2).

## Tools

Tools are workspace resources: create once, attach by ID.

| Type | Runs | Create |
| --- | --- | --- |
| `webhook` (server) | ElevenLabs calls your HTTPS API | `conversationalAi.tools.create({ toolConfig: { type: "webhook", name, description, apiSchema: { url, method, pathParamsSchema, queryParamsSchema, requestBodySchema, requestHeaders, authConnection } } })` |
| `client` | Your front end (browser/app) | `toolConfig: { type: "client", name, description, parameters, expectsResponse }` + handler in the client SDK |
| `system` | Built-in platform actions | `built_in_tools.<name>` on the agent |
| `mcp` | External MCP servers | `/v1/convai/mcp-servers`, attach via `mcp_server_ids` |
| `api_integration_webhook` | Native integrations (Salesforce, Zendesk, HubSpot, Calendar…) | Dashboard Integrations |
| Code tools | Sandboxed JS on ElevenLabs (Enterprise, dashboard) | Dashboard |

```ts
const tool = await elevenlabs.conversationalAi.tools.create({
  toolConfig: {
    type: "webhook",
    name: "lookup_order",
    description: "Look up an order's status by its ID. Use when the caller asks where their order is.",
    apiSchema: {
      url: "https://api.acme.com/orders/{order_id}",
      method: "GET",
      pathParamsSchema: { order_id: { type: "string", description: "Order ID like AC-12345, uppercase, no spaces" } },
      requestHeaders: { Authorization: { secretId: acmeApiSecretId } },
    },
    responseTimeoutSecs: 10,
    assignments: [{ source: "response", dynamicVariable: "order_status", valuePath: "status" }],
  },
});
await elevenlabs.conversationalAi.agents.update(agentId, { conversationConfig: { agent: { prompt: { toolIds: [tool.id] } } } });
```

Common tool fields: `response_timeout_secs` (webhook 5–300, client 1–120), `interruption_mode` (`allow|disable_during_tool|disable_during_tool_and_turn`), `pre_tool_speech` (`auto|force|off`), `execution_mode` (`immediate|post_tool_speech|async`), `tool_call_sound` (`typing|elevator1-4`), `tool_error_handling_mode` (`auto|summarized|passthrough|hide`), `assignments` (write response fields into dynamic variables), `response_mocks` (for tests).

Parameter schema properties take exactly one value source: `description` (LLM fills it), `dynamic_variable`, `constant_value`, `is_system_provided`, or `is_omitted`; plus `enum` and `allowed_values` (server-side guard). Secrets: `conversationalAi.secrets.create({ type: "new", name, value })` → `{ secretId }`, referenced in headers or `custom_llm.api_key`; `secret__` dynamic variables never reach the LLM. Auth connections (OAuth2 client credentials, JWT, basic, mTLS) live in `workspace.authConnections`. Webhook tool calls come from ElevenLabs egress IPs ([platform-admin.md](platform-admin.md#zero-retention-privacy-ip-allowlisting)).

Client tools: set `expectsResponse: true` ("wait for response") when the agent needs the result; names are case-sensitive and must match the client handler.

## System tools and transfers

Configure under `prompt.built_in_tools.<name>` (`{ type: "system", name, description: "" (default prompt), params: { system_tool_type, … } }`).

| Tool | Purpose / key params |
| --- | --- |
| `end_call` | Hang up. **Only auto-added for dashboard-created agents** — add it via API. |
| `language_detection` | Switch language (needs `language_presets`); `only_at_conversation_start`. |
| `transfer_to_agent` | Hand off to another agent: `transfers: [{ agent_id, condition, delay_ms, transfer_message, enable_transferred_agent_first_message }]`. |
| `transfer_to_number` | Phone/SIP transfer: `transfers: [{ transfer_destination: { type: "phone", phone_number } | { type: "sip_uri", sip_uri } | dynamic-variable variants, condition, transfer_type: "conference" | "blind" | "sip_refer", custom_sip_headers, post_dial_digits }]`. Blind + warm agent messages + post-dial digits only on native Twilio; SIP REFER only on SIP calls. |
| `skip_turn` | Stay silent until the user speaks ("one second"). |
| `play_keypad_touch_tone` | Send DTMF (IVR navigation); phone only. |
| `voicemail_detection` | Detect voicemail; optional `voicemail_message` to leave. |
| `update_state` | Set dynamic variables from expressions (dashboard only). |
| `flag_issue_for_review` | Silently opens a triage ticket (dashboard). |

Agent-transfer child agents inherit client events, audio formats, language, webhooks/analysis from the parent; everything else comes from the child.

## MCP servers as tools

- Enable once per workspace: `conversationalAi.settings.update({ canUseMcpServers: true })` (accept MCP terms). Not available with Zero Retention Mode or HIPAA.
- `conversationalAi.mcpServers.create({ config: { url, name, transport: "SSE" | "STREAMABLE_HTTP", approvalPolicy: "auto_approve_all" | "require_approval_all" | "require_approval_per_tool", secretToken?, requestHeaders?, authConnection? } })` → attach with `prompt.mcpServerIds`. (Docs show `"always_ask"`; the enum is the three values above.)
- Per-tool approvals and overrides: `mcpServers.toolApprovals.*`, `mcpServers.toolConfigs.*`; list tools `mcpServers.tools.list(id)`.
- Approval requests reach clients as `mcp_tool_call` with `state: "awaiting_approval"`; answer with `mcp_tool_approval_result`. Start with approval required; tool annotations (`readOnlyHint`) are not trustworthy.

## Knowledge base and RAG

```ts
const doc = await elevenlabs.conversationalAi.knowledgeBase.documents.createFromUrl({ name: "Help center", url: "https://acme.com/help" });
// createFromText({ name, text }), createFromFile({ name, file }), createFolder({ name }), crawlJobs.create({ url, maxPages })
await elevenlabs.conversationalAi.agents.update(agentId, { conversationConfig: { agent: { prompt: {
  knowledgeBase: [{ type: "url", name: doc.name, id: doc.id, usageMode: "auto" }],
  rag: { enabled: true, embeddingModel: "multilingual_e5_large_instruct", maxRetrievedRagChunksCount: 20 },
} } } });
```

- Docs are workspace-level and reusable. Formats PDF, DOCX, TXT, MD, HTML, EPUB ≤20 MB; full-context limit ~300k chars; system prompt max 2 MB.
- `usage_mode: "prompt"` always injects; `auto` uses RAG when enabled. Folders are RAG-only. RAG adds ~250 ms.
- RAG storage by plan: Free 1 MB … Business 1 GB. Index: `knowledgeBase.document.computeRagIndex(docId, { model })`; test retrieval with `POST /v1/convai/agents/{id}/knowledge-base/rag-query` (REST only).
- Site crawls use user agent `ElevenlabsBot/1.0` and respect robots.txt — allowlist it in your WAF. URL docs can auto-sync (`enableAutoSync`).
- Cannot delete docs while agents depend on them (unless forced).

## Workflows

Visual graph of subagents (top-level `workflow`):

```json
{ "workflow": {
  "nodes": {
    "start": { "type": "start", "edge_order": ["to_triage"] },
    "triage": { "type": "override_agent", "label": "Triage", "additional_prompt": "Find out if this is billing or tech.", "edge_order": ["to_billing", "to_tech"] },
    "billing": { "type": "standalone_agent", "agent_id": "agent_billing" },
    "tech": { "type": "override_agent", "label": "Tech", "additional_tool_ids": ["tool_diag"], "conversation_config": { "agent": { "prompt": { "llm": "claude-sonnet-5-5" } } } },
    "human": { "type": "phone_number", "transfer_destination": { "type": "phone", "phone_number": "+15551234567" }, "transfer_type": "conference" },
    "end": { "type": "end" } },
  "edges": {
    "to_triage": { "source": "start", "target": "triage", "forward_condition": { "type": "unconditional" } },
    "to_billing": { "source": "triage", "target": "billing", "forward_condition": { "type": "llm", "condition": "The issue is about billing or payments." } },
    "to_tech": { "source": "triage", "target": "tech", "forward_condition": { "type": "llm", "condition": "The issue is technical." } } } } }
```

Node types: `start`, `end`, `override_agent` (subagent: extra prompt, KB, tools, model/voice overrides, `entry_behavior`), `standalone_agent` (transfer to another agent), `phone_number` (transfer), `tool` (guaranteed tool execution; edges on `{ type: "result", successful }`). Edge conditions: `unconditional`, `llm`, `result`, `expression` (deterministic AST over dynamic variables). JS SDK uses camelCase field names but keeps your node/edge IDs.

## Procedures

Reusable playbooks loaded when their trigger matches (GA 2026-08).

- `free_form`: markdown with inline references `[tool id="tool_x"]`, `[kb id="kb_x"]`, `[procedure id="agtprc_x"]`, `[system_tool id="end_call"]`, `{{var}}`.
- `deterministic` (structured): JSON steps `ask`, `tell`, `say` (verbatim), `tool_call` (with `on_failure`), `branch` (llm or expression conditions), `retry`, `sub_procedure`, `system_tool` (`end_call`, last).
- Choose: prompt only → free-form → structured (auth, payments, compliance) → workflows for full branching and per-step models.
- Limits: content ≤50,000 chars; the 5 most recently started procedures stay in context.

```ts
const p = await elevenlabs.conversationalAi.agents.procedures.create(agentId, branchId, {
  name: "Refund request", type: "free_form",
  trigger: "When the user asks for a refund or return",
  content: 'Ask for the order ID, then check it with [tool id="tool_abc123"].',
});
await elevenlabs.conversationalAi.agents.update(agentId, { branchId }); // publish drafts on the branch
```

Drafts are per user and per branch; publishing validates structured procedures (400 `procedure_validation_failed` with per-step errors).

## Personalization: dynamic variables, overrides, initiation webhook

- `{{var}}` works in the prompt, first message, tool URLs/params/headers, soft-timeout and voicemail messages, SIP headers. Missing variables block the conversation start; set `dynamic_variable_placeholders` for dashboard tests only.
- System variables: `system__agent_id`, `system__current_agent_id`, `system__conversation_id`, `system__caller_id`, `system__called_number`, `system__call_sid`, `system__call_id`, `system__call_duration_secs`, `system__time_utc`, `system__time`, `system__timezone`, `system__agent_turns`, `system__is_text_only`, `system__conversation_history`, `system__env_<label>`. SIP `X-Foo-Bar` headers become `{{sip_foo_bar}}`.
- `secret__*` variables only go in headers and are redacted everywhere.
- Overrides replace config per conversation and must be enabled field by field (`platform_settings.overrides.conversation_config_override`). Prefer dynamic variables.
- Conversation initiation webhook (inbound phone, SIP, WhatsApp, SMS): ElevenLabs POSTs `{ caller_id, called_number, agent_id, call_sid, conversation_id }`; respond with `conversation_initiation_client_data` (`dynamic_variables`, overrides, `user_id`, `branch_id`, `environment`) including **every** custom variable, ≤256 KB. Configure in agent settings (`conversationalAi.settings.update({ conversationInitiationClientDataWebhook: { url, requestHeaders } })`) and enable on the agent.
- Talk-to page: `https://elevenlabs.io/app/talk-to?agent_id=…&var_user_name=Ana`.

## Guardrails

`platform_settings.guardrails` (`version: "1"`): `focus` (stay on topic), `prompt_injection` (ends conversation), `content` (sexual, violence, harassment, self_harm, profanity, religion_or_politics, medical_and_legal_information with thresholds; alpha), `custom.config.configs[]` (LLM-judged rules; alpha). `execution_mode`: `streaming` (no added latency, may leak <500 ms audio) or `blocking` (+200–500 ms). `trigger_action`: `{ type: "end_call" }` or `{ type: "retry", feedback }` (blocking only, ≤3 retries; `{{trigger_reason}}`, `{{agent_message}}`). REST JSON uses `is_enabled`; JS uses `isEnabled`. Clients receive `guardrail_triggered`.

## Text, files, DTMF, channels

- Chat mode: `conversation.text_only: true` (or allowed override) — billed per message, separate concurrency pool (25× voice).
- File input: `conversation.file_input { enabled, max_files_in_memory, max_files_per_conversation }`; clients upload via `uploadFile` / `POST /v1/convai/conversations/{id}/files`.
- DTMF input: `conversation.dtmf_input_settings { dtmf_input_timeout, hash_terminator, redact_input }` (out-of-band DTMF from Twilio, SIP, Genesys).
- Per-channel text style: `agent.text_behavior_overrides: { slack_integration: { verbosity: "thorough", output_format: "markdown" }, widget: { output_format: "plain_text" } }`.
- Native text channels/integrations: Slack, Zendesk, Intercom, Freshdesk, Salesforce, Telegram, Genesys Bot Connector, Custom Channel (inbound webhook + signed reply webhook), WhatsApp, Twilio SMS.

## Telephony and channels

| Option | Notes |
| --- | --- |
| Native Twilio | Import number (`conversationalAi.phoneNumbers.create({ provider: "twilio", phoneNumber, label, sid, token })`), assign `agentId`; inbound + outbound; SMS conversations; regional routing (`region_config`) for residency. |
| Twilio register-call | Keep your own Twilio logic: `conversationalAi.twilio.registerCall({ agentId, fromNumber, toNumber, direction })` returns TwiML. Agent audio must be `ulaw_8000`; no transfers. |
| SIP trunk | `provider: "sip_trunk"` with inbound/outbound trunk config; URI `sip:<number>@sip.rtc.elevenlabs.io:5061;transport=tls` (TCP 5060); G.711/G.722; digest auth or ACL; SIP headers ↔ dynamic variables; `attributes_to_headers` on BYE. Works with Telnyx, Plivo, Bandwidth, Sinch, Vonage (via WS connector), RingCentral, Five9. |
| Exotel | Native provider; Voicebot applet WS. |
| Genesys / Amazon Connect / Five9 | Audio Connector WS / Connect AI-agent protocol / SIP external transfer. |
| Microsoft Teams | Widget tab, Azure Communication Services bridge, or Graph media bot. |
| WhatsApp | Import WABA in dashboard; messages, voice notes, calls; outbound needs approved templates (`conversationalAi.whatsapp.outboundMessage/outboundCall`). |

Queueing (`queueing_config`, hold audio upload) holds callers when concurrency is full; bursting (`call_limits.bursting_enabled`) allows up to 3× concurrency at 2× price.

## Batch and outbound calls

```ts
await elevenlabs.conversationalAi.twilio.outboundCall({
  agentId, agentPhoneNumberId: "phnum_…", toNumber: "+15551234567",
  conversationInitiationClientData: { dynamicVariables: { user_name: "Ana" } },
});
// SIP: conversationalAi.sipTrunk.outboundCall(...); Exotel: conversationalAi.exotel.outboundCall(...)

await elevenlabs.conversationalAi.batchCalls.create({
  callName: "Delivery reminders", agentId, agentPhoneNumberId: "phnum_…",
  recipients: [{ phoneNumber: "+15551234567", conversationInitiationClientData: { dynamicVariables: { user_name: "Ana" } } }],
  scheduledTimeUnix: Math.floor(Date.now() / 1000) + 3600, timezone: "America/New_York",
});
```

Batch: `batchCalls.get/list/cancel/retry/export`; voicemail detection results per recipient; not allowed with ZRM. **Always confirm with the user before placing real calls**, and follow TCPA/consent rules (consent records, calling hours, DNC, AI disclosure, opt-out).

## Testing

- Test types (`conversationalAi.tests.create`): `llm` next-reply (chat history + success condition + examples), `tool` (expects a tool call with parameter checks, or `verify_absence`), `simulation` (simulated user persona, `success_conditions`, max turns, tool mocks).
- Run: `conversationalAi.agents.runTests(agentId, { tests: [{ testId }], repeatCount: 5, branchId? })` → poll `tests.invocations.get(id)`. Attach tests to the agent (`platform_settings.testing.attached_tests`).
- `simulateConversation` endpoints are deprecated and removed 2026-10-31 — use simulation tests.

## Analysis, conversations, monitoring

- Evaluation criteria (≤30) → `success|failure|unknown` with rationale; data collection items (≤25, or 40 Enterprise); sentiment and topic discovery toggles; re-run analysis `conversations.analysis.run(conversationId)`.
- `conversationalAi.conversations.list({ agentId, callSuccessful, callStartAfterUnix, userId, branchId, pageSize, cursor, … })`, `.get(id)` (transcript, metadata, analysis; `format: "opentelemetry"` adds OTLP traces), `.audio.get(id)`, `.delete(id)`, feedback, tags, text and semantic message search.
- Live: `analytics.liveCount.get({ agentId })`; monitoring WebSocket `wss://api.elevenlabs.io/v1/convai/conversations/{id}/monitor` (Enterprise) streams events and accepts control commands (`end_call`, `transfer_to_number`, `contextual_update`, human takeover for chat).
- Alerts: `platform_settings.alerting` with webhook, Slack, or PagerDuty notifiers.

## Post-call webhooks

Workspace webhook ([platform-admin.md](platform-admin.md#webhooks)) assigned in agent settings: `conversationalAi.settings.update({ webhooks: { postCallWebhookId, events: ["transcript", "audio", "call_initiation_failure"], transcriptFormat: "json" | "opentelemetry" } })` or per agent `platform_settings.workspace_overrides.webhooks`.

- `post_call_transcription`: `data { agent_id, conversation_id, status, user_id, branch_id, environment, transcript[], metadata { call_duration_secs, cost, termination_reason, … }, analysis { evaluation_criteria_results, data_collection_results, call_successful, transcript_summary }, conversation_initiation_client_data }`.
- `post_call_audio`: base64 MP3 in `full_audio`, chunked transfer, never retried.
- `call_initiation_failure`: `failure_reason` `busy|no-answer|unknown` with SIP/Twilio details.
- Verify `ElevenLabs-Signature` on the raw body, return 200 fast, dedupe by `conversation_id` + `event_timestamp`. Retries (opt-in) only for transcription events.
- Pattern: store a summary by `user_id` and pass it back as a dynamic variable next time (memory).

## Versioning, branches, deployments, environments

- **All agents are versioned** (since 2026-06). The `enableVersioning` / `enableVersioningIfNotEnabled` params are deprecated and ignored; every commit to `main` or a branch creates an immutable version.
- Branches: `agents.branches.create(agentId, { parentVersionId, name })`, commit with `agents.update(agentId, { …, branchId })` (+ `versionDescription`), `branches.merge(agentId, sourceBranchId, { targetBranchId })`, `branches.previewMerge`, `branches.rebase`. Drafts: `agents.drafts.create/delete`.
- Traffic split (experiments): `agents.deployments.create(agentId, { deploymentRequest: { requests: [{ branchId, deploymentStrategy: { type: "percentage", trafficPercentage: 90 } }, …] } })` — must sum to 100; routing is deterministic per conversation.
- Merge proposals (PR-like review): `agents.mergeProposals.*` (may be REST-only in older SDKs).
- Environment variables: `client.environmentVariables.create({ label: "api_host", type: "string" | "secret" | "auth_connection", values: { production: "…", staging: "…" } })`; use `{{system__env_api_host}}` in tool/MCP/custom-LLM/webhook URLs (URL must start with literal `https://`). Choose per conversation with `environment` (token/signed URL/start session/outbound call/phone-number pin).

## Agents as code (CLI)

```bash
elevenlabs agents init                         # agents.json, tools.json, tests.json, agent_configs/, tool_configs/, test_configs/
elevenlabs auth login                          # or ELEVENLABS_API_KEY in CI
elevenlabs agents add "Support" --template customer-service
elevenlabs tools add "lookup_order" --type webhook --config-path ./tool_configs/lookup_order.json
elevenlabs agents push --dry-run && elevenlabs agents push
elevenlabs agents pull --update                # sync remote edits back
elevenlabs agents test <agent_id>
elevenlabs agents widget embed <agent_id>
```

Configs are raw snake_case API JSON (round-trip safe). Branch-aware: `agents push --branch staging`. Not covered by the CLI: KB uploads, MCP servers, environment variables (use API/dashboard, then reference IDs).

The hosted MCP server (`https://api.elevenlabs.io/v1/mcp`, OAuth) also creates, edits, compares, and inspects agents and conversations from an MCP client.

## Privacy, compliance

- `platform_settings.privacy`: `record_voice`, `retention_days` (-1 unlimited; docs default 2 years), `delete_audio`, `delete_transcript_and_pii`, `zero_retention_mode`, `conversation_history_redaction` (entity list; Enterprise).
- ZRM: nothing stored; data only via post-call webhooks; disables MCP, native integrations, WhatsApp inbound, triage, batch calls; LLMs limited to a compliant list.
- HIPAA: Enterprise BAA + ZRM + allowed LLMs (Gemini 3.5 Flash/2.5 Flash, Claude Sonnet 5/4.6, GPT-5.x with BAA, GLM-5.2, …; GPT-6, Claude Opus 5/5.5 are not on the list as of the snapshot).
- Disclosure: tell users they talk to an AI and that the call is recorded/shared with providers. US outbound calling: TCPA consent rules.

## Pricing and limits

- Voice: included minutes per plan (Free 15, Starter 75, Creator 275, Pro 1,238, Scale 3,738, Business 12,375), then **$0.08/min** (burst $0.16/min); silence >10 s billed at 5%. Text: $0.003/message. LLM tokens pass-through. File uploads per file.
- Voice concurrency: Free 4, Starter 6, Creator 10, Pro 20, Scale 30, Business 40 (one docs table says 30); chat pool 25×. `call_limits.daily_limit` default 100,000.
- Max conversation 7,200 s; max 10 voices per agent; tool timeouts ≤300 s.

## Reception AI

Separate no-code SMB product (app.reception.ai) built on ElevenAgents: AI phone receptionist that books appointments, takes orders/quotes/messages, transfers to staff, with booking page, CRM, analytics, Google Calendar/Calendly/Cal.com/HubSpot/Zapier/webhook/MCP integrations, and BYO Twilio/SIP numbers. Plans $29 / $79 / $199 per month (credits per minute). No public API — recommend it when a small business wants a receptionist without building an agent.

## Gotchas

1. Add `end_call` (and any other system tool) explicitly when creating agents via API.
2. Every agent is versioned; `enableVersioning` flags are ignored. Use branches for risky changes instead of editing `main` directly.
3. `workflow` is top-level in the API body.
4. REST JSON is snake_case (`is_enabled`); JS SDK is camelCase (`isEnabled`). Docs samples mix them.
5. Initiation webhook responses must include every custom dynamic variable.
6. Register-call (BYO Twilio) needs `ulaw_8000` and cannot transfer.
7. Interruptions are on only when `"interruption"` is in `client_events`.
8. KB crawls fail silently when your WAF blocks `ElevenlabsBot/1.0`.
9. Default/premade voice IDs in agent configs expire 2026-12-31 — use owned or library voices.
10. Deprecated: inline `prompt.tools`, `disable_interruptions` (→ `interruption_mode`), `force_pre_tool_speech` (→ `pre_tool_speech`), `/get_signed_url`, simulate-conversation endpoints.
