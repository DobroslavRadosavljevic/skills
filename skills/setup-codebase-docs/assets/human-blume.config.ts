import { defineConfig } from "blume";

/**
 * <Product>'s owner handbook: how the product works, written for a person who must understand
 * every flow, number, cost, and risk. It is private: the host serves it behind the password check
 * in `middleware.ts`, so the build turns off every output that only a public site needs
 * (sitemap, Open Graph cards, RSS, structured data, "open in chat").
 */
export default defineConfig({
  title: "<Product> Handbook",
  description: "How <Product> works, from the first click to the last stored row.",
  content: { root: "docs" },
  theme: { accent: "teal", mode: "system" },
  toc: { minHeadingLevel: 2, maxHeadingLevel: 3 },
  feedback: false,
  lastModified: "git",
  navigation: { sidebar: { display: "group" } },
  markdown: { imageZoom: true, code: { wrap: true } },
  ai: { openInChat: false },
  agents: { catalog: false, skillMd: false },
  seo: { og: { enabled: false }, rss: { enabled: false }, sitemap: false, structuredData: false },
  poweredBy: false,
});
