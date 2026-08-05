# Patterns and Framework Injection

## XSS-safe serialization

Never dump raw `JSON.stringify` into HTML without escaping characters that can break out of a `<script>` tag:

```ts
import type {Thing, WithContext} from 'schema-dts';

function safeJsonLd(data: WithContext<Thing> | object): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}

// <script type="application/ld+json">${safeJsonLd(product)}</script>
```

## Common page schemas

### Organization + WebSite

```ts
import type {Organization, WebSite, WithContext} from 'schema-dts';

const org: WithContext<Organization> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Acme Corp',
  url: 'https://acme.com',
  logo: 'https://acme.com/logo.png',
  sameAs: [
    'https://twitter.com/acme',
    'https://www.linkedin.com/company/acme',
  ],
};

const site: WithContext<WebSite> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Acme Corp',
  url: 'https://acme.com',
};
```

### Product + Offer

```ts
import type {Product, WithContext} from 'schema-dts';

const product: WithContext<Product> = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Classic Leather Wallet',
  description: 'Full-grain leather bifold wallet with RFID blocking.',
  image: 'https://shop.example/images/wallet.jpg',
  sku: 'WALLET-001',
  brand: {'@type': 'Brand', name: 'Example Shop'},
  offers: {
    '@type': 'Offer',
    price: 89,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: 'https://shop.example/products/classic-wallet',
  },
};
```

### FAQPage

```ts
import type {FAQPage, WithContext} from 'schema-dts';

const faq: WithContext<FAQPage> = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Do you ship internationally?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we ship to over 50 countries.',
      },
    },
  ],
};
```

### Article

```ts
import type {Article, WithContext} from 'schema-dts';

const article: WithContext<Article> = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to choose a leather wallet',
  datePublished: '2026-03-01',
  dateModified: '2026-03-15',
  author: {
    '@type': 'Person',
    name: 'Jane Smith',
    url: 'https://blog.example/authors/jane',
  },
  image: 'https://blog.example/images/wallet-guide.jpg',
  description: 'A practical guide to choosing a leather wallet that lasts.',
};
```

Also common: `BreadcrumbList`, `LocalBusiness`, `JobPosting`, `Event`, `Recipe`, `HowTo`, `SoftwareApplication`. Match Google’s required/recommended properties for the rich-result type when SEO is the goal — typings alone do not enforce those.

## Framework wiring

### React — `react-schemaorg`

[`react-schemaorg`](https://github.com/google/react-schemaorg) provides a typed `JsonLd` component with safe serialization:

```tsx
import {JsonLd} from 'react-schemaorg';
import type {Product} from 'schema-dts';

export function ProductPage() {
  return (
    <JsonLd<Product>
      item={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Classic Leather Wallet',
        offers: {
          '@type': 'Offer',
          price: 89,
          priceCurrency: 'USD',
        },
      }}
    />
  );
}
```

### Next.js — `Script`

```tsx
import Script from 'next/script';
import type {Article, WithContext} from 'schema-dts';

export default function BlogPost() {
  const article: WithContext<Article> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'How to choose a leather wallet',
    datePublished: '2025-03-01',
    author: {'@type': 'Person', name: 'Jane Smith'},
  };

  return (
    <Script
      id="article-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: safeJsonLd(article)}}
    />
  );
}
```

### Astro

```astro
---
import type {FAQPage, WithContext} from 'schema-dts';
const faq: WithContext<FAQPage> = { /* … */ };
---
<script type="application/ld+json" set:html={safeJsonLd(faq)} />
```

### Svelte

```svelte
<svelte:head>
  {@html `<script type="application/ld+json">${safeJsonLd(org)}</script>`}
</svelte:head>
```

### Vanilla

```ts
const script = document.createElement('script');
script.type = 'application/ld+json';
script.textContent = JSON.stringify(site); // DOM textContent is safe; HTML templates need escaping
document.head.appendChild(script);
```

## Multiple scripts vs one Graph

- Separate `WithContext` scripts per concern (Organization, WebSite, Product) is fine and common.
- Prefer a single `Graph` when many nodes cross-reference each other via `@id`.

## Adjacent tooling

Upstream `examples.md` also mentions build-time injection helpers such as [agentmarkup](https://github.com/agentmarkup/agentmarkup). Keep typing in `schema-dts`; let other tools handle injection/validation if the project already uses them.
