# Render and Sending

## `render`

```tsx
import { render, toPlainText } from 'react-email';
import WelcomeEmail from './emails/welcome';

const html = await render(
  <WelcomeEmail name="Ada" url="https://example.com/verify" />,
);

// Option A
const text = await render(
  <WelcomeEmail name="Ada" url="https://example.com/verify" />,
  { plainText: true },
);

// Option B
const textFromHtml = toPlainText(html);
```

Notes:

- `render` is **async** (Node uses React DOM server streams under the hood).
- `renderAsync` was removed in render 2 / react-email 6 — do not revive it.
- Options include `pretty`, `plainText`, and (when `plainText: true`) `htmlToTextOptions` or `unstableTextConversion`.
- Elements with `data-skip-in-text="true"` are omitted from plain-text conversion.
- Prefer rendering **at send time** with real props over baking static HTML via `email export`.

## ESP Pattern

Universal pattern for providers that accept HTML:

1. `const html = await render(<Template {...props} />)`
2. Optionally `plainText: true`
3. Pass `html` / `text` to the provider SDK
4. Use a **verified** domain in `from`

### Resend (React prop)

Resend's Node SDK can take the component directly and handle HTML + plain text:

```tsx
import { Resend } from 'resend';
import WelcomeEmail from './emails/welcome';

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: 'Acme <onboarding@your-verified-domain.com>',
  to: ['user@example.com'],
  subject: 'Welcome to Acme',
  react: <WelcomeEmail name="Ada" url="https://example.com/verify" />,
});
```

You can also pass pre-rendered `html` / `text`. CLI: `bunx email resend setup` to store an API key for template upload from the preview UI.

### Nodemailer

```tsx
import { render } from 'react-email';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  /* SMTP config */
});

const html = await render(<WelcomeEmail name="Ada" url="https://example.com/verify" />);
const text = await render(<WelcomeEmail name="Ada" url="https://example.com/verify" />, {
  plainText: true,
});

await transporter.sendMail({
  from: 'noreply@example.com',
  to: 'user@example.com',
  subject: 'Welcome',
  html,
  text,
});
```

### SendGrid

```tsx
import { render } from 'react-email';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const html = await render(<WelcomeEmail name="Ada" url="https://example.com/verify" />);

await sgMail.send({
  to: 'user@example.com',
  from: 'noreply@example.com',
  subject: 'Welcome',
  html,
});
```

### Mailgun / Postmark / AWS SES

Same idea: `render` → provider `html` / `HtmlBody` / SES `Message.Body.Html.Data`. See official integration pages linked from [source-map.md](source-map.md).

## Deliverability Checklist

- Verified domain + aligned SPF/DKIM/DMARC (provider-specific)
- Meaningful `subject` and `Preview` text
- HTML + plain text
- Absolute image URLs on a reliable host
- Unsubscribe / physical address where required (marketing)
- Keep payload under Gmail's ~102KB clip threshold
- Never put secrets in templates; pass only send-time props

## Mustache / Foreign Templating

If an ESP forces `{{variable}}` placeholders:

- Keep React props typed and real in the component body
- Put mustache strings **only** in `.PreviewProps` for preview, or use `email export` for the static host
- Do not leave mustache tokens in JSX that `render` would send as literal text unless that is the intentional static-export workflow
