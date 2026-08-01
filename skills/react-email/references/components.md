# Components

Import only what you use from `react-email`.

## Available Components

| Component | Role |
| --- | --- |
| `Html` | Root; set `lang` / `dir` |
| `Head` | Meta, title, `Font`, styles |
| `Body` | Email body wrapper |
| `Container` | Centered main column (`max-width: 37.5em` built-in). Use once for the primary column |
| `Section` | Content block (table-based) |
| `Row` / `Column` | Multi-column layout (no flex/grid) |
| `Preview` | Inbox preview text |
| `Heading` | `as="h1"`…`h6` |
| `Text` | Paragraph |
| `Button` | Styled link button (Outlook padding workarounds) |
| `Link` | Hyperlink |
| `Img` | Image (`alt` defaults to `""`) |
| `Hr` | Divider |
| `Tailwind` | Utility classes → email-safe CSS |
| `Font` | Web font + fallbacks |
| `Markdown` | Markdown → email markup |
| `CodeBlock` / `CodeInline` | Code display (Prism themes for blocks) |

Layout tables (`Container`, `Section`, `Row`, `Column`) emit `role="presentation"` by default. Raw hand-written layout `<table>`s need that attribute yourself.

## Canonical Skeleton

```tsx
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Tailwind,
  pixelBasedPreset,
} from 'react-email';

interface WelcomeEmailProps {
  name: string;
  url: string;
}

export default function WelcomeEmail({ name, url }: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: { extend: { colors: { brand: '#007bff' } } },
        }}
      >
        <Head />
        <Body className="bg-gray-100 font-sans">
          <Preview>Welcome — verify your email</Preview>
          <Container className="mx-auto max-w-xl p-5 bg-white">
            <Heading className="text-2xl text-gray-800">Welcome, {name}</Heading>
            <Text className="text-base text-gray-800">Thanks for signing up.</Text>
            <Button
              href={url}
              className="bg-brand text-white px-5 py-3 rounded block text-center no-underline box-border"
            >
              Verify email
            </Button>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

WelcomeEmail.PreviewProps = {
  name: 'Ada',
  url: 'https://example.com/verify',
} satisfies WelcomeEmailProps;
```

## Structure Notes

- `Head` lives **inside** `Tailwind` when using Tailwind (so generated styles land correctly).
- `Preview` should be the **first** child inside `Body`.
- Prefer props over template literals for dynamic URLs and copy.

## Component Tips

### Button

- Always include `box-border`.
- Prefer `block text-center no-underline`.
- `href` is required; `target` defaults to `_blank`.

### Img

- Prefer absolute HTTPS URLs.
- Set `width` / `height` to reduce layout shift.
- Meaningful images: descriptive `alt`. Decorative: explicit `alt=""`.
- **Linked images are never decorative** — `alt` must name the destination.

### Row / Column

```tsx
<Section>
  <Row>
    <Column className="w-1/2 p-2 align-top">Left</Column>
    <Column className="w-1/2 p-2 align-top">Right</Column>
  </Row>
</Section>
```

Widths should sum to the row (e.g. two `w-1/2`).

### CodeBlock

```tsx
import { CodeBlock, dracula } from 'react-email';

<div className="overflow-auto">
  <CodeBlock code={snippet} language="typescript" theme={dracula} />
</div>
```

Wrap in `overflow-auto`. Do not enable `lineNumbers` unless requested. Themes export from `react-email` (e.g. `dracula`, `github`, `nord`).

### Font

```tsx
<Head>
  <Font
    fontFamily="Inter"
    fallbackFontFamily="Arial, Helvetica, sans-serif"
    webFont={{
      url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
      format: 'woff2',
    }}
  />
</Head>
```

Many clients ignore web fonts — always set strong fallbacks.

### Markdown

Use for trusted markdown strings. Prefer real components for branded transactional layouts.
