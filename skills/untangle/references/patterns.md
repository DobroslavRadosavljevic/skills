# Tangle patterns and fixes

## Barrel fan-out

Symptom: `import { formatDate } from "@/lib"` and `lib/index.ts` re-exports 40 modules, one of which imports a charting library.

Check: list what the barrel re-exports and what each of those imports. Tree shaking often does not help in dev servers, tests, server runtimes, or when any re-exported module has side effects.

Fix: import from the source file (`@/lib/format-date`). Delete internal barrels that only serve as shortcuts; keep a barrel only as a package's intended public entry, and keep it free of side effects.

## Side-effect imports

Symptom: a module creates a client, registers a plugin, patches a global, reads env, or opens a connection at top level. Anything that imports it, even for one constant, pays that cost and order matters.

Check: search for top-level calls, `new`, and bare imports (`import "./setup"`).

Fix: wrap in a function or lazy singleton and call it at the composition root (app start, request handler, test setup). Move the constants and types out of that file so importers of the constants do not trigger it. Keep intended setup imports, but in one known place.

## Hub modules

Symptom: `utils.ts`, `helpers.py`, `common/`, `types.ts`, `constants.ts` imported by most of the codebase; changing one line rebuilds or retests everything.

Check: for each export, list which features use it.

Fix: move single-feature exports into that feature. Group the rest by reason to change (dates, money, ids), one module each. Do not leave a re-export of the old hub.

## Wrong-direction edges

Symptom: `lib/` imports from `features/`, domain logic imports a UI component, a shared package imports an app.

Fix: move the needed piece down to the lower layer, or invert: the lower layer accepts a callback, interface, or config, and the higher layer passes it in.

## Cycles

Symptom: A imports B and B imports A, directly or through a chain. Causes undefined-at-import bugs, init-order bugs, and blocks splitting.

Fix: find the one piece both sides need and move it to a new lower module, or invert one edge. Re-check, because barrels often hide a second cycle.

## Boundary leaks

Symptom: a client bundle includes server code, a DB driver, secrets, or Node built-ins; production code imports test fixtures, mocks, stories, or dev tools.

Check: bundle analyzer output, or trace from client entry points to server-only modules.

Fix: split the shared file into a client-safe part and a server part. Use the framework's server-only markers or boundary lint rules where they exist. Move fixtures under test-only paths.

## Heavy transitive pulls

Symptom: a 5-line helper lives in a file that also imports a large library, so every user of the helper loads the library.

Fix: move the helper into its own file. If the heavy dependency is needed only on a rare path, load it lazily there.

## Type-only imports as values

Symptom: a module is loaded at runtime only to get types or interfaces.

Fix: use the language's type-only form (`import type` in TypeScript with `verbatimModuleSyntax`, `if TYPE_CHECKING:` in Python). Turn on the compiler or lint rule that enforces it.
