# Source Map

This reference captures the docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-08-03
- Stable npm package: `decimal.js@10.6.0` (published 2025-07-06)
- Official repository: https://github.com/MikeMcl/decimal.js
- Official API: https://mikemcl.github.io/decimal.js/
- Types: bundled `decimal.d.ts` (`"types": "./decimal.d.ts"`)
- Context7 selection: `/mikemcl/decimal.js`
- Related packages observed: `decimal.js-light@2.5.1`, `bignumber.js@11.x`, `big.js@7.x`

Treat prerelease/legacy tags (`version4` → 4.0.4) as unavailable unless the project depends on them.

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check package registry metadata:

   ```sh
   bun info decimal.js
   ```

3. Prefer the official API page and repo README/CHANGELOG. If docs and package metadata disagree, report the mismatch.
4. Check the local project version before applying BigInt construction (10.5.0+), types (10.6.0+), or `exports` (10.4.0+).
5. For ecosystem comparisons, also check `decimal.js-light`, `bignumber.js`, and `big.js` READMEs / the [big.js wiki](https://github.com/MikeMcl/big.js/wiki).

## Official Pages

- GitHub: https://github.com/MikeMcl/decimal.js
- API reference: https://mikemcl.github.io/decimal.js/
- npm: https://www.npmjs.com/package/decimal.js
- README: https://github.com/MikeMcl/decimal.js/blob/master/README.md
- CHANGELOG: https://github.com/MikeMcl/decimal.js/blob/master/CHANGELOG.md
- Types: https://github.com/MikeMcl/decimal.js/blob/master/decimal.d.ts
- decimal.js-light: https://github.com/MikeMcl/decimal.js-light
- big.js: https://github.com/MikeMcl/big.js
- bignumber.js: https://github.com/MikeMcl/bignumber.js
- Ecosystem wiki: https://github.com/MikeMcl/big.js/wiki

## Source Files Used

- `README.md`
- `doc/API.html` / https://mikemcl.github.io/decimal.js/
- `decimal.d.ts`
- `decimal.mjs` / `decimal.js` entry points
- `CHANGELOG.md`
- Context7 `/mikemcl/decimal.js` autodocs (configuration, types, class API)

## Version Line Orientation

| Line | Role |
| --- | --- |
| **v10.x** | Current; ESM/CJS exports; BigInt (10.5+); modern TS |
| v9.x | Prior major; soft break into v10 |
| v7+ | `config` alias; crypto default false |
| v5 | Historical large break (trig, `clone`, removed APIs) |
| `decimal.js-light` | Separate smaller package, truncated arithmetic |
