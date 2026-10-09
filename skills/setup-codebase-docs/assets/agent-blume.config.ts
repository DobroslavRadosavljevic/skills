import { defineConfig } from "blume";
import { z } from "zod";

/**
 * <Product>'s reference for coding agents: exact files, owners, invariants, commands, change
 * recipes, and runbooks. Agents read the Markdown sources in `docs/` straight from the repository
 * (root AGENTS.md links them); the built site is a private view of the same files. The host
 * serves it behind the password check in `middleware.ts`.
 */
export default defineConfig({
  title: "<Product> Agent Reference",
  description: "Code map, contracts, invariants, change recipes, and runbooks for coding agents.",
  content: {
    root: "docs",
    types: {
      /**
       * Runbook pages set `type: runbook`. Blume then requires `last-verified`, so a runbook
       * without it fails the build. YAML reads an unquoted date as a Date, so the schema coerces.
       * The runbook checker script does the strict checks (real date, not in the future, index
       * row, named paths and scripts exist).
       */
      runbook: { frontmatter: { "last-verified": z.coerce.date() } },
    },
  },
  theme: { accent: "violet", mode: "system" },
  toc: { minHeadingLevel: 2, maxHeadingLevel: 3 },
  feedback: false,
  lastModified: "git",
  navigation: { sidebar: { display: "group" } },
  markdown: { code: { wrap: true } },
  ai: { openInChat: false },
  agents: { llmsTxt: true, catalog: false, skillMd: false },
  seo: { og: { enabled: false }, rss: { enabled: false }, sitemap: false, structuredData: false },
  poweredBy: false,
});
