# Off-page SEO (white-hat only)

Scope: legal, policy-compliant reputation and links. Do not design, implement, or advise manipulative link acquisition. Do not send outreach email. Do not operate spam sequences.

Label claims:

- **FACT** — stated by a cited official source.
- **JUDGMENT** — operational inference for agents. Do not present as Google policy.

## Links as a signal (high level)

**FACT.** Google ranks using many signals (query meaning, relevance, usability, source expertise, location/settings). Weight varies by query. Source: [How Search ranks results](https://www.google.com/search/howsearchworks/how-search-works/ranking-results/).

**FACT.** Links help Google understand which content may be helpful. Earned, deserved links are acceptable. Acquiring links that violate spam policies is not. Source: [Qualify outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links); [Link tagging reminder](https://developers.google.com/search/blog/2021/07/link-tagging-and-link-spam-update).

**FACT.** Link spam is creating links to or from a site primarily to manipulate rankings. Google detects this with automated systems and, when needed, human review / manual actions. Sites may rank lower or disappear. Source: [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies).

**JUDGMENT.** Treat links as one reputation/discovery signal among many. Do not chase “link equity” as a primary product goal. Prefer inventing useful pages that third parties cite because they solve a problem.

### What Google lists as link spam

**FACT.** Examples include (non-exhaustive): buying or selling links for ranking (money, goods, services, or free product in exchange for a link); excessive link exchanges or partner pages solely for cross-linking; automated link-building programs/services; requiring a link in a contract/ToS without letting the third party qualify the outbound link; advertorials/native ads or guest posts/press releases that pass ranking credit or use optimized anchors; text ads/text links that do not block ranking credit; low-quality directory or bookmark links; keyword-rich, hidden, or low-quality widget links; widely distributed footer/template links; low-value content created mainly to manipulate linking. Source: [Spam policies — Link spam](https://developers.google.com/search/docs/essentials/spam-policies).

**FACT.** Buying/selling links for advertising or sponsorship is allowed only if those links are qualified with `rel="nofollow"` or `rel="sponsored"`. Source: same page.

## Earn attention without schemes

Do this instead of “building links”:

1. Publish **original research** (methods, data, limitations, downloadable tables). Cite sources. Make the URL stable.
2. Ship **useful tools** (calculators, converters, public APIs, status pages) that other sites reference because they work.
3. Write **documentation** that answers a real implementation question better than existing pages.
4. Do **digital PR** as journalism: a newsworthy finding, a clear embargo/asset pack, and named contacts. Recipients choose whether to cover you.
5. Fix product/docs so journalists and developers can quote accurate facts (not keyword-stuffed bios).

**JUDGMENT.** A page that would still exist if search rankings vanished is usually the right asset. A page whose only job is to attract a backlink is usually the wrong asset.

## Never do this

Do not implement, recommend, or “hypothetically walk through” these. They violate Google spam policies and/or are deceptive.

| Practice | Why it is forbidden | Source |
| --- | --- | --- |
| Private blog networks (PBNs) and other networks of sites created to pass ranking credit | Link spam; low-value content for linking/ranking | [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies) |
| Paid links that pass ranking credit without `rel="sponsored"` (or `nofollow`) | Paid links must be qualified | [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies); [Qualify outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links) |
| Comment / forum spam with optimized anchors | Explicit link-spam example | [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies) |
| Buying expired domains to host unrelated commercial content for rankings | Expired domain abuse | [Spam policies — Expired domain abuse](https://developers.google.com/search/docs/essentials/spam-policies) |
| Site reputation abuse / “parasite SEO”: third-party pages on a host mainly to borrow that host’s ranking signals | Site reputation abuse | [Spam policies — Site reputation abuse](https://developers.google.com/search/docs/essentials/spam-policies); [Google on parasite SEO](https://blog.google/company-news/inside-google/company-announcements/defending-search-users-from-parasite-seo-spam/) |
| Cloaking (different content to users vs crawlers to manipulate rankings) | Cloaking | [Spam policies — Cloaking](https://developers.google.com/search/docs/essentials/spam-policies) |
| Sneaky / malicious redirects (user-agent or referrer-based traps) | Hacked-content redirects and deceptive redirects | [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies) |
| Hidden text/links, keyword stuffing, doorway pages, scaled scraped/spun content | Separate spam policies | [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies) |
| Automated programs or services that create links to the site | Link spam | [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies) |

**FACT.** Site reputation abuse is third-party content published on a host mainly because of that host’s established ranking signals. Hosting third-party content is not automatically a violation. Examples of abuse include sponsored payday-loan reviews on an education site, unexpected “best casinos” pages on a medical site, white-label coupons on a news site published to harvest reputation. Not abuse (per Google): wire/press-release services; syndicated news; UGC-first sites (forums, comments); editorial columns; advertorials whose purpose is to inform readers rather than manipulate Search; properly treated affiliate links / ad units; coupons sourced from merchants. Source: [Spam policies — Site reputation abuse](https://developers.google.com/search/docs/essentials/spam-policies).

**FACT.** If violating pages exist, Google’s manual-action guidance includes: move the content to a new domain and `nofollow` any leftover links; do not redirect old URLs to the new host (redirects can reintroduce the issue); `noindex` the violating pages and do not robots.txt-block them; or rewrite as first-party content. Source: [Manual actions report](https://support.google.com/webmasters/answer/9044175).

## Qualify outbound links

**FACT.** Tell Google the relationship of certain outbound links with `rel` on the `<a>` tag. Source: [Qualify outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links).

| Value | Emit when | Notes |
| --- | --- | --- |
| `sponsored` | Ads, paid placements, sponsorships, compensation, **affiliate** links | Preferred for paid/affiliate. `nofollow` still acceptable for paid links. |
| `ugc` | Comments, forum posts, other user-generated links | May drop `ugc` for consistently high-quality trusted contributors. |
| `nofollow` | You do not want to associate the site with the destination, and the other values do not apply | Use robots.txt `Disallow` to stop Google fetching **your own** URLs, not `nofollow` on internal links as a crawl-budget tactic. |

**FACT.** Combine values when true: `rel="ugc sponsored"`. `sponsored`, `ugc`, and `nofollow` are **hints**. Linked pages may still be found via sitemaps or other sites. Source: [Qualify outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links); [Evolving nofollow](https://developers.google.com/search/blog/2019/09/evolving-nofollow-new-ways-to-identify).

**FACT.** The wrong direction is leaving paid/sponsored links unqualified. Using `sponsored` on a non-ad link is not a policy violation in the same way. Source: [Evolving nofollow](https://developers.google.com/search/blog/2019/09/evolving-nofollow-new-ways-to-identify).

**FACT.** Do not rely on `nofollow` to keep a URL out of the index. Allow crawl + `noindex` if the goal is “do not show in results.” Source: [Qualify outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links); [Robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).

Emit on **every** outbound paid, affiliate, or UGC link in templates (product cards, review widgets, comment HTML, footer partners).

## Brand mentions and unlinked mentions

**FACT.** Google does not document “unlinked brand mentions” as a ranking credit equivalent to a hyperlink.

**JUDGMENT.** Track mentions for reputation, accuracy, and legal risk. An unlinked mention is a **PR opportunity**, not a ranking lever. Offer a correct URL, data, or image if the publisher wants it. Do not demand a dofollow link. Do not scrape comment forms to insert your URL.

When you find a mention:

1. Record URL, date, quote, sentiment, whether a link exists, and whether the facts are correct.
2. If facts are wrong, send a **single** factual correction (no link-begging template).
3. If the mention is positive and unlinked, add the publisher to the **target list** below. Do not auto-email.

## Agent outreach rule

**Do not** run outreach sequences, mail merges, guest-post pitches, “resource page” blasts, or comment campaigns. Those patterns become spam.

Deliver only an **asset + target list** for a human to use:

```markdown
## Asset
- URL:
- One-sentence why it is citable (data, method, or tool — not “great content”):
- Embargo / license / attribution:
- Contact the human named (not a scraped editor list):

## Target list (max 15)
| Outlet / site | Why they already cover this topic | Suggested angle (no template email) | Existing mention? |
| --- | --- | --- | --- |
| | | | |
```

Stop after the list. Do not draft 50 personalized emails. Do not invent journalist emails from scraped pages.

## Sources

- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links
- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- https://developers.google.com/search/blog/2019/09/evolving-nofollow-new-ways-to-identify
- https://developers.google.com/search/blog/2021/07/link-tagging-and-link-spam-update
- https://support.google.com/webmasters/answer/9044175
- https://blog.google/company-news/inside-google/company-announcements/defending-search-users-from-parasite-seo-spam/
- https://www.google.com/search/howsearchworks/how-search-works/ranking-results/
