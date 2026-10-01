# Source Map

Snapshot date: 2026-10-01.

This reference records the official documentation and package evidence used to create the skill. Refresh sources for latest/current questions, editor APIs, Tailwind email behavior, major upgrades, or version mismatches.

## Research Snapshot

- Context7 libraries: `/resend/react-email` (primary), `/websites/react_email` (docs site).
- Product: https://react.email/
- Docs index (llms): https://react.email/docs/llms.txt
- Official agent skill in upstream repo (canary): https://github.com/resend/react-email/tree/canary/skills/react-email
- npm `latest` versions observed on 2026-10-01:
  - `react-email`: `6.11.0` (CLI + components + re-exports `render`; published 2026-09-23)
  - `@react-email/render`: `2.1.0`
  - `@react-email/ui`: `6.11.0`
  - `@react-email/editor`: `1.7.10`
  - `create-email`: `1.2.6`
  - Legacy: `@react-email/components` `1.0.12`, `@react-email/preview-server` `5.2.10` (v5 line; do not add to v6 projects).
- Peers: `react` / `react-dom` `^18` or `^19`.
- Engines: `react-email` requires Node `>=20.19` (CLI enforces it from 6.10).
- Ignore stale `canary` dist-tags (`react-email@6.0.0-canary.*`, `@react-email/editor@1.0.0-canary.*`); they predate `latest`.

## Release Notes Since 6.9.1

- `react-email@6.11.0`: `--esbuild-plugins <path>` on `email dev`, `email build`, `email export` (module default-exports an esbuild plugin array or a function returning one).
- `react-email@6.10.0`: `chokidar` v5; CLI/dev server needs Node 20.19+ and fails fast with the installed version in the error.
- `react-email@6.9.5`: responsive padding on `Container` / `Section` now reaches the inner `td`.
- `@react-email/editor@1.7.x`: basic theme centers the container (1.7.0); paragraph `style`/`class` kept on Enter split (1.7.2); buttons render `box-sizing: border-box` (1.7.4); left-alignment state fixes (1.7.6); table header cells kept in send HTML (1.7.7); placeholders on empty headings (1.7.8).
- `create-email@1.2.6`: fails on registry errors instead of writing `undefined` versions.

Earlier 6.x notes still relevant: `--extension` / `-e` on `email export` (6.7), preview Props tab for live-editing props (6.8), per-module tree-shakable build (6.8), `<Tailwind>` `@media` variants with `tailwindcss@4.3.3+` fixed (6.9.1).

Do not assume patch versions stay aligned forever. Check the lockfile before upgrades.

## Official Core Docs

- Introduction: https://react.email/docs/introduction
- Automatic setup: https://react.email/docs/getting-started/automatic-setup
- Manual setup: https://react.email/docs/getting-started/manual-setup
- Updating majors: https://react.email/docs/getting-started/updating-react-email
- CLI: https://react.email/docs/cli
- Render utility: https://react.email/docs/utilities/render
- Deployment (preview app): https://react.email/docs/deployment
- Components index: https://react.email/components
- Templates demo: https://demo.react.email/

## Integrations

- Overview: https://react.email/docs/integrations/overview
- Resend: https://react.email/docs/integrations/resend
- Nodemailer: https://react.email/docs/integrations/nodemailer
- SendGrid: https://react.email/docs/integrations/sendgrid
- Mailgun: https://react.email/docs/integrations/mailgun
- Postmark: https://react.email/docs/integrations/postmark
- AWS SES: https://react.email/docs/integrations/aws-ses

## Editor

- Overview: https://react.email/docs/editor/overview
- Getting started: https://react.email/docs/editor/getting-started
- composeReactEmail: https://react.email/docs/editor/api-reference/compose-react-email
- EmailEditor: https://react.email/docs/editor/api-reference/email-editor

## i18n Guides

- next-intl: https://react.email/docs/guides/internationalization/next-intl
- react-i18next: https://react.email/docs/guides/internationalization/react-i18next
- react-intl: https://react.email/docs/guides/internationalization/react-intl

## Related References

- Email CSS support: https://www.caniemail.com
- Resend docs (ESP): https://resend.com/docs/llms.txt
- Accessibility practices (upstream): https://github.com/resend/email-best-practices

## Primary Repositories

- Monorepo: https://github.com/resend/react-email
- Brought to you by Resend: https://resend.com

## Refresh Triggers

Refresh the relevant official pages and package metadata when:

- The user asks for latest/current behavior, a migration, or an upgrade.
- Installed `react-email` major differs from **6**.
- The task touches Tailwind 4 email inlining, `@react-email/editor`, monorepo workspace wiring, or `email export` vs `render`.
- Imports still reference `@react-email/components` or `renderAsync`.
