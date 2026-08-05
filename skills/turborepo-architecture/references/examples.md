# Examples (Turborepo layout)

## Good — internal package

```text
packages/credits/
  package.json          # "@org/credits", exports: "./src/index.ts"
  src/index.ts
  src/ledger.ts
  tests/unit/…
```

App depends with `"@org/credits": "workspace:*"` and passes config from env into `Credits.make({ … })`.

## Good — turbo transit

```jsonc
{
  "tasks": {
    "transit": { "dependsOn": ["^transit"] },
    "typecheck": { "dependsOn": ["transit"] },
    "test": { "dependsOn": ["transit"] },
    "dev": { "cache": false, "persistent": true },
    "format": { "cache": false }
  }
}
```

## Bad — env in a package

```ts
// packages/billing/src/client.ts
export const client = createClient(process.env.BILLING_KEY!);
```

Fix: `Billing.make({ apiKey })` called from the app.

## Bad — recursive turbo

```json
"scripts": {
  "test": "turbo run test --filter=@org/api"
}
```

inside `@org/api` while root already runs `turbo run test`.

## Bad — forever shim

```ts
/** @deprecated */
export { oldRoute as route } from "./legacy";
```

kept “for safety” after all callers moved — delete instead.
