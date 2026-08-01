# Patterns and i18n

## Template Types (Shapes)

Use these as structural guides — tailor copy, brand colors, and CTAs to the product.

### Password reset

- Clear reason + account identifier
- Primary CTA button (`box-border`)
- Expiry window
- “Ignore if you didn’t request this” footer
- No marketing clutter

### Order confirmation

- Order id + date
- Line items via `Row`/`Column` (image | name/qty | price)
- Subtotal / shipping / tax / total section
- Shipping address block
- Absolute product image URLs

### Notification / alert

- Severity color strip (`Section` with solid background)
- Title + short body
- Optional `CodeBlock` for logs (wrap `overflow-auto`)
- Optional action `Link`/`Button`
- “Automated message” footer

### Team invite

- Inviter + org name
- Accept CTA
- Fallback plain URL as `Text`/`Link` for clients that break buttons
- Expiry if applicable

### Multi-column newsletter

- Stack-friendly `Row`/`Column`
- Assume columns may not collapse gracefully everywhere — keep each column self-contained
- Footer with address + unsubscribe for marketing

## Accessibility (Author Checklist)

React Email defaults help (`lang`/`dir`, decorative `Img` `alt=""`, presentation roles). Still:

- One clear top-level heading; do not skip levels
- Descriptive link text (not “click here”)
- Linked images need destination `alt`
- 4.5:1 text contrast; spot-check dark clients
- Pass `lang` (and `dir` for RTL) per locale

## i18n

Officially documented with **next-intl**, **react-intl**, and **react-i18next**.

Common rules:

1. Make `locale` a required prop.
2. Set `<Html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>`.
3. Translate subject, preview, body, and CTA — not just body copy.
4. Format dates/money with `Intl.DateTimeFormat` / `Intl.NumberFormat` using `locale`.
5. Keep translation keys identical across locale files.
6. Prefer message files per template namespace (`welcome-email`, `order-confirmation`).

### next-intl sketch

```tsx
import { createTranslator } from 'next-intl';

export default async function WelcomeEmail({
  name,
  locale,
  url,
}: {
  name: string;
  locale: string;
  url: string;
}) {
  const t = createTranslator({
    messages: (await import(`../messages/${locale}.json`)).default,
    namespace: 'welcome-email',
    locale,
  });

  return (
    <Html lang={locale}>
      {/* ... */}
      <Preview>{t('preview')}</Preview>
      <Heading>{t('title')}</Heading>
      <Text>
        {t('greeting')} {name}
      </Text>
      <Button href={url}>{t('cta')}</Button>
    </Html>
  );
}
```

Pick the i18n library already used by the app; do not introduce a second stack without approval.

## Behavioral Guardrails

- Change only what the user asked for when iterating on a template.
- Never put `{{mustache}}` tokens in component JSX for normal React sends.
- Prefer unique brand-aligned layouts over generic purple/blue starter clones when the user provided brand input.
- Test mentally against Outlook (border/box-model), Gmail (clipping, CSS stripping), and Apple Mail.
