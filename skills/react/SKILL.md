---
name: react
description: Build, review, debug, migrate, or plan React applications and components using current React documentation. Use for React, React DOM, hooks, JSX, Server Components, Server Functions, Actions/forms, React Compiler, hydration, rendering roots, React 19 upgrades, or questions about modern React patterns and best practices.
---

# React

Use this skill to make React choices from current docs plus the local app's actual version, framework, and conventions.

## Workflow

1. Identify the React surface before changing code:
   - Read the nearest project guidance files and package manifests.
   - Check installed or declared versions of `react`, `react-dom`, the framework, build tool, test stack, TypeScript, and ESLint.
   - Determine whether the target is a client-only app, SSR, framework-managed app, React Server Components app, React Native app, component library, or migration.
2. Refresh docs when the user asks for latest/current behavior, when versions are unclear, or when using React 19+ APIs:
   - Prefer current docs tooling or official docs pages.
   - Use [source-map.md](references/source-map.md) for the captured latest-version snapshot and official source links.
3. Load the focused reference file for the task:
   - [core-react.md](references/core-react.md): component design, JSX, state, effects, hooks, purity, performance, and testing judgment.
   - [react-19.md](references/react-19.md): React 19/19.2 APIs, upgrades, Actions, forms, Server Components, Server Functions, Compiler, and release-channel caveats.
   - [react-dom.md](references/react-dom.md): `createRoot`, `hydrateRoot`, DOM forms, hydration, server/static rendering, resources, and escape hatches.
4. Implement in the existing project style:
   - Prefer framework primitives over direct React DOM APIs when the framework owns routing, data fetching, SSR, RSC, or hydration.
   - Preserve local component boundaries, accessibility conventions, tests, and styling patterns.
   - Avoid introducing React 19.2-only or canary-only APIs unless the app's dependencies support them.
5. Verify the smallest meaningful surface:
   - Run the project's relevant typecheck, lint, test, build, story, or browser verification command.
   - For visible UI changes, inspect the real screen state when feasible.
   - Report any verification you could not run.

## React Judgment

- Keep render pure and idempotent. Do not read time, randomness, browser-only globals, or mutate non-local values during render unless the value is safely isolated and repeatable.
- Derive values during render when they can be calculated from props or state. Do not add state plus an Effect just to mirror another value.
- Use Effects only to synchronize with external systems such as the DOM, subscriptions, timers, imperative widgets, analytics, or non-framework data fetching.
- Keep Effect dependencies honest. Prove a value is non-reactive by moving it out of the component or into an Effect/Event boundary instead of suppressing the linter.
- Put user-caused side effects in event handlers or Actions. Put render-caused external synchronization in Effects.
- Prefer local state. Lift state only when multiple components need to coordinate. Use reducers for complex transitions and `useSyncExternalStore` for external stores.
- Treat Server Components, Server Functions, and React DOM server/static APIs as framework integration territory unless the task is explicitly building framework infrastructure.
- Treat canary and experimental docs as unavailable in stable apps unless the project explicitly uses those channels.
