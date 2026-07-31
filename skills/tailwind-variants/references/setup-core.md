# Setup And Core API

## Install

Requires Tailwind CSS in the project first.

```sh
bun add tailwind-variants
```

Compatibility:

| Tailwind CSS | Tailwind Variants |
| --- | --- |
| v4.x | v3.x (current) |
| v3.x | v0.x |

### Default vs lite (v3+)

Default (with conflict resolution):

```ts
import { tv, createTV, cn, cnMerge, cx } from 'tailwind-variants'
```

Lite (~80% smaller, no merge; no `cnMerge`):

```ts
import { tv, createTV, cn, cx } from 'tailwind-variants/lite'
```

On **v3.3.0+**, do not install `tailwind-merge` only for Tailwind Variants. Keep it if the app still calls `twMerge` / `extendTailwindMerge` directly.

## Minimal `tv` recipe

```ts
import { tv } from 'tailwind-variants'

const button = tv({
  base: 'font-medium bg-blue-500 text-white rounded-full active:opacity-80',
  variants: {
    color: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-purple-500 text-white',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'px-4 py-3 text-lg',
    },
  },
  compoundVariants: [
    {
      size: ['sm', 'md'],
      class: 'px-3 py-1',
    },
  ],
  defaultVariants: {
    size: 'md',
    color: 'primary',
  },
})

button({ size: 'sm', color: 'secondary' })
// => merged class string
```

`ClassValue` may be a string, array of strings, nested arrays, or nullish values.

## Class utilities

| Function | Merge? | Returns | Notes |
| --- | --- | --- | --- |
| `cx` | No | string | Lightweight concat (prefer over `cnBase`) |
| `cn` | Yes (default build) | string | Default merge config; no per-call config |
| `cnMerge` | Optional | curried `(config?) => string` | Per-call `twMerge` / `twMergeConfig` |
| `cnBase` | No | string | Deprecated alias path—use `cx` |

```ts
import { cx, cn, cnMerge } from 'tailwind-variants'

cx('px-2', 'px-4') // "px-2 px-4"
cn('px-2', 'px-4') // "px-4"
cnMerge('px-2', 'px-4')({ twMerge: false }) // "px-2 px-4"
```

Lite `cn` is a curried no-merge adapter; prefer `cx` for simple joins in lite.

## Config surfaces

1. **Per call** — second arg to `tv(options, config)`
2. **Factory** — `createTV({ twMerge, twMergeConfig })`
3. **Global** — mutate exported `defaultConfig` (value export since v3.2.0)

```ts
import { createTV, defaultConfig, tv } from 'tailwind-variants'

tv({ base: 'px-2' }, { twMerge: false })

const tvNoMerge = createTV({ twMerge: false })

defaultConfig.twMerge = true
```

`twMerge` defaults to `true` on the default build. Prefer `twMergeConfig: { extend, override }` for custom utilities. See [production-migration.md](production-migration.md).

## Editor / Prettier

VS Code Tailwind IntelliSense:

```json
{
  "tailwindCSS.classFunctions": ["tv"]
}
```

Prettier plugin:

```js
export default {
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindFunctions: ['tv'],
}
```

## Return shape gotcha

- No `slots` key → calling the recipe returns a **string**.
- With `slots` (including explicit `slots: {}`) → calling returns **slot functions** (and empty `{}` enables slot mode with implicit `base`). Omit `slots` when you want a string.
