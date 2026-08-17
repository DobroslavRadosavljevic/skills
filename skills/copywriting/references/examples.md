# Examples

Visitor copy. Numbers are made up for the sample.

## CMS talk

**Fail**

> This catalog lists Bright Data as a proxy SKU. We only catalog residential pools; there is not a separate page here for ISP.

**Pass**

> Bright Data sells residential and ISP proxies from the same account. If you need sticky sessions for logins, start on residential; ISP is cheaper when the target only checks ASN.

## Research residue

**Fail**

> We do not invent pricing. Pages we used did not show EU list price, so treat the USD figure as history.

**Pass**

> Public pricing starts at $500/month for the pay-as-you-go residential pool. EU list price is not published; ask sales if you bill in euro.

Unknown → drop the sentence.

## Template sameness

**Fail** (same H2s on every vendor)

> ## Who it fits
> ## How you connect
> ## What to open next

**Pass**

> ## Sticky sessions without a dedicated ISP pool
> ## When the dashboard rate limit bites
> ## Oxylabs vs this plan on 10M requests

## Instruction voice

**Fail**

> Do not mix both methods. Always include the product name in the H1. Bright Data is a proxy platform.

**Pass**

> Bright Data is a proxy platform. Use the residential gateway for sticky sessions. Use the unlocker API when the site blocks datacenter IPs. Pick one path per job.

## Vocabulary slop

**Fail**

> In today’s fast-paced scraping landscape, unlocking robust, seamless proxy infrastructure is a game-changer. Whether you’re a beginner or a pro, we’ve got you covered.

**Pass**

> If your crawler dies after 20 minutes, you need sticky residential IPs and a retry budget, not another all-in-one platform paragraph.

## Sentence-shape slop

**Fail**

> It’s not a proxy network. It’s peace of mind. Fast. Simple. And that matters. In short, Bright Data helps you navigate the complexities of data collection.

**Pass**

> Bright Data is a proxy network with sticky sessions you can set in the dashboard. Peace of mind is a refund policy, not a slogan.

## Forced triple + adjective pair

**Fail**

> Tailwind is fast, flexible, and developer-friendly. A simple and effective workflow.

**Pass**

> Tailwind ships only the utilities you use, so production CSS stays small.

## It’s not X, it’s Y

**Fail**

> It’s not compliance. It’s stalling.

**Pass**

> They’re stalling.

## Summary closer

**Fail**

> In conclusion, ExampleVPN is a comprehensive solution for anyone seeking to unlock privacy at the end of the day.

**Pass**

> Buy ExampleVPN for two TVs on the 30-day refund. Skip it if you need five dedicated IPs; they sell two per account.

## Awareness mismatch

**Fail** (product-aware visitor, unaware hero)

> Reimagine the future of secure connectivity.

**Pass**

> ExampleVPN: 6,400 servers, 30-day refund, 2024 no-logs audit. Dedicated IPs: two per account.

## Visitor YAML

**Fail**

```yaml
shortDescription: "This directory entry describes ExampleVPN, a best-in-class VPN solution."
seoDescription: "ExampleVPN VPN VPN service best VPN for streaming privacy security."
verdict: "A comprehensive solution for anyone seeking to unlock privacy."
pros:
  - Easy to use
  - Robust features
  - Great for everyone
```

**Pass**

```yaml
shortDescription: "ExampleVPN: 6,400 servers, 30-day refund, no-logs audit from 2024. Weak on dedicated IPs."
seoDescription: "ExampleVPN pricing, server count, and refund window for streaming and torrenting."
verdict: "Buy it for streaming on two TVs. Skip it if you need five dedicated IPs; they sell only two per account."
pros:
  - 30-day refund with a one-click cancel
  - Split-tunnel apps on Windows and macOS
  - Port forwarding on the Plus plan
```

## PAS used as thinking, not as H2s

**Fail**

> ## Problem
> ## Agitate
> ## Solution

**Pass** (same PAS order, distinctive headings)

> ## The session drops at minute 21
> ## What a ban costs on a 2M-URL crawl
> ## Sticky residential on the $500 pool

## Website hero and CTA

**Fail**

> Reimagine the future of invoicing. Learn more | Get started

**Pass**

> Invoicing for solo accountants who file under 50 returns a year.
>
> Start 14-day trial — no card until day 14.

## Comparison page skip-condition

**Fail**

> Both tools are robust, seamless, and great for teams of all sizes.

**Pass**

> Use A if you need QuickBooks sync today. Use B if you live in Stripe and can wait a quarter for payroll.

## Button / command

**Fail:** `OK` · `Submit` · `Click here` · `Delete` (ambiguous) · `Playing` (current state)

**Pass:** `Save draft` · `Start 14-day trial` · `Delete folder` · `Pause` (next state)

## Error message

**Fail**

> Invalid input. Oops! You entered an illegal email.

**Pass**

> That address is missing an @. Example: alex@acme.com.

Keep the typed value. Put the message next to the field.

## Empty state

**Fail:** blank panel, or `No data` while a query still runs.

**Pass**

> No invoices in this date range.
>
> [Create invoice]

## Destructive confirm

**Fail:** `Are you sure?` / `OK`

**Pass:** `Delete “Q3 forecast”? This cannot be undone.` / `Delete forecast`

## Onboarding / success

**Fail:** `You’re all set!! Let’s unlock your journey.`

**Pass:** `Invite sent to alex@acme.com. They have 7 days to accept.`

## Docs: mixed jobs on one page

**Fail** — tutorial, philosophy, and every flag on one scroll.

**Pass** — split:

- Tutorial: `Install the CLI and deploy a sample app` (one success path)
- How-to: `Rotate an API key`
- Reference: `cli deploy` flags table
- Explanation: `Why deploys are immutable`

## Docs: heading and steps

**Fail**

> ## Migrating to the new API
> You can easily just add the header.

**Pass**

> ## Migrate webhooks to API v2
>
> If the endpoint still returns `410`, rotate the signing secret, then send a test event.

Condition before the action. No `easily` / `just`.

## Docs: first paragraph

**Fail:** history of the company, then the task.

**Pass**

> This page shows how to rotate a signing secret without dropping events. For flag names, see `cli secrets`. For why rotation is two-step, see Immutable deploys.

## README

**Fail:** feature soup and no install.

**Pass**

> QueueMail sends transactional email from a Redis queue when your app cannot wait on SMTP.
>
> ```
> bun add queuemail
> ```
>
> Then: how to get help. Not the full API.

## Notification / email

**Fail**

> In today’s fast-paced world, your invoice journey has been updated. Click here!

**Pass**

> Subject: Invoice 1842 is overdue (due 12 Aug)
>
> Invoice 1842 for Acme ($420) was due 12 Aug. Pay now, or we pause the workspace on 20 Aug.

## Link text

**Fail:** `Click here` · `Read more` · `here`

**Pass:** `Rotate an API key` · `Invoice 1842` · `Error-message guidelines` (destination in the words)

## Helper text vs slogan

**Fail** (under password field): `Unlock a robust, seamless experience.`

**Pass:** `16+ characters, at least one number. Spaces allowed.`

## Jargon vs plain

**Fail**

> Asynchronously hydrate the client cache to facilitate subsequent reconciliation of the billing artifact.

**Pass**

> Load the list again. Then the invoice total will match Stripe.

## STE instruction

**Fail**

> In the event that the authentication token has expired, it is recommended that the user initiate a refresh prior to retrying the original request.

**Pass**

> If the token expired, refresh it. Then send the request again.
