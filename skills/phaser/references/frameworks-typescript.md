# Vite, TypeScript, and Framework Integration

## Vite setup

Official templates use Vite with a separate dev and prod config and a manual `phaser` chunk. A minimal modern setup:

```ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 8080 },
  build: {
    chunkSizeWarningLimit: 1500, // phaser.min.js is ~1.4 MB
  },
});
```

- Chunk splitting: on Vite 7 and older use `build.rollupOptions.output.manualChunks: { phaser: ['phaser'] }` (what the templates do). On Vite 8 (Rolldown) object-form `manualChunks` is removed and the function form is deprecated; use Rolldown `output.codeSplitting` under `build.rolldownOptions`. Check the project's Vite major first.
- Assets live in `public/assets` and are referenced as `assets/...` relative URLs. `base: './'` makes builds portable.
- Imports: `import Phaser from 'phaser'` (default export restored in the ESM build in 4.1) or named imports `import { Game, Scene, AUTO } from 'phaser'`. Both work with the package `exports` map: `import` -> `dist/phaser.esm.js`, `require` -> `dist/phaser.js`. Deep imports like `phaser/dist/...` are not exported.
- Phaser touches `window`/`document` at import; never import it in server-only code (SSR, Node tests). Use dynamic client-only import.
- 4.2.1 fixed namespace access that broke the ESM build in `CombineColorMatrix`, `ImageLight`, `Texture`; stay on 4.2.1+ for ESM-only bundlers.
- Tree shaking is limited: Phaser is a large IIFE-style bundle. Use the CDN or a long-cache vendor chunk.
- Verify with `bun run build`, `bunx vite preview`, and a browser smoke test.

## TypeScript

- Types ship in the package (`types/phaser.d.ts`) and declare a global `Phaser` namespace plus the `'phaser'` module, so `Phaser.GameObjects.Image`, `Phaser.Types.Core.GameConfig`, `Phaser.Physics.Arcade.Sprite` work with or without imports.
- Recommended `tsconfig`: `"strict": true`, `"moduleResolution": "bundler"`, `"skipLibCheck": true`, `"strictPropertyInitialization": false` (scene fields are assigned in `create`), `"lib": ["ES2020", "DOM", "DOM.Iterable"]`, `"noEmit": true`. Vite does not typecheck; run `bunx tsc --noEmit`.

```ts
import { Scene, Types } from 'phaser';

export const config: Types.Core.GameConfig = { type: Phaser.AUTO, width: 1024, height: 768, scene: [Boot, Play] };

export class Play extends Scene {
  player!: Phaser.Physics.Arcade.Sprite;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  constructor() { super('Play'); }
  create() {
    this.cursors = this.input.keyboard!.createCursorKeys();     // keyboard may be null if input.keyboard is disabled
    this.player = this.physics.add.sprite(100, 100, 'hero');
  }
  update() {
    const body = this.player.body as Phaser.Physics.Arcade.Body; // `body` is Body | StaticBody | null
    body.setVelocityX(this.cursors.left.isDown ? -160 : 0);
  }
}
```

- Typed registry/data: wrap in helper functions with explicit types; DataManager is `any`-valued.
- Typed scene keys: export `as const` key objects instead of string literals.
- Use `Phaser.Types.*` for configs (`Types.Animations.Animation`, `Types.Tweens.TweenBuilderConfig`, `Types.Input.Keyboard.CursorKeys`).
- Custom game objects: extend `Phaser.GameObjects.Sprite` and add via `scene.add.existing(this)` (and `scene.physics.add.existing(this)`), then register `Phaser.GameObjects.GameObjectFactory.register('hero', fn)` with declaration merging if you want `this.add.hero()`.

## Embedding in frameworks

Principles
1. Create exactly one `Phaser.Game` per mount, with a container element id or ref.
2. Destroy it on unmount: `game.destroy(true)` (removes the canvas). Guard against React StrictMode's double mount and hot reload.
3. Communicate through a small shared emitter; keep it outside both trees.
4. Keep Phaser out of framework state. Do not store `Game`, scenes, or game objects in reactive stores that proxy them (Vue `reactive`, Svelte stores); use `shallowRef`/plain variables.
5. Make the parent element sized; use `Scale.RESIZE` or `FIT` with a CSS-sized container.

### EventBus (official template pattern)

```ts
// game/EventBus.ts
import { Events } from 'phaser';
export const EventBus = new Events.EventEmitter();
```

Scene side:

```ts
create() {
  EventBus.emit('current-scene-ready', this);
  const onScore = (n: number) => this.setScore(n);
  EventBus.on('set-score', onScore);
  this.events.once('shutdown', () => EventBus.off('set-score', onScore));
}
```

### React 19

```tsx
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { createGame } from './game/main';        // returns new Phaser.Game({ parent: id, ... })
import { EventBus } from './game/EventBus';

export interface PhaserRef { game: Phaser.Game | null; scene: Phaser.Scene | null }

export const PhaserGame = forwardRef<PhaserRef, { onScene?: (s: Phaser.Scene) => void }>(({ onScene }, ref) => {
  const game = useRef<Phaser.Game | null>(null);
  const scene = useRef<Phaser.Scene | null>(null);
  useImperativeHandle(ref, () => ({ get game() { return game.current; }, get scene() { return scene.current; } }));

  useLayoutEffect(() => {
    game.current = createGame('game-container');
    return () => { game.current?.destroy(true); game.current = null; };
  }, []);

  useEffect(() => {
    const handler = (s: Phaser.Scene) => { scene.current = s; onScene?.(s); };
    EventBus.on('current-scene-ready', handler);
    return () => { EventBus.off('current-scene-ready', handler); };
  }, [onScene]);

  return <div id="game-container" />;
});
```

The official template guards with `if (game.current === null)` and removes listeners by name; use specific handler references so other listeners are not removed.

### Vue 3

Create the game in `onMounted`, destroy in `onUnmounted`, keep the instance in a plain `let` or `shallowRef`, and expose events with `defineExpose`. Template: `phaserjs/template-vue-ts`.

### Svelte / SvelteKit

Create in `onMount`, return a cleanup that calls `game.destroy(true)`; import Phaser dynamically inside `onMount` to avoid SSR. `@phaserjs/create-game` lists Svelte as a supported option; there is no standalone `template-svelte` repo at the snapshot, so follow the same pattern.

### Next.js

Render the Phaser component client-only: `dynamic(() => import('./PhaserGame'), { ssr: false })` inside a client component. Official `phaserjs/template-nextjs` does this. Do not import `phaser` in server components.

### Angular, Solid, Remix

Same rules: client-only, one game per mount, destroy on teardown, a shared emitter.

### Other targets

- Electron, Capacitor, Cordova: serve built assets from a local scheme; set `loader.localScheme` if needed.
- Telegram, Discord, itch.io iframes: use relative `base`, avoid third-party fonts blocked by CSP, test fullscreen (`allowfullscreen`).

## Testing

- Unit-test pure game logic (state machines, scoring, pathfinding) outside Phaser.
- For scene behaviour run `type: Phaser.HEADLESS` with a DOM (jsdom or browser mode); WebGL-only features need a real browser.
- Prefer a real browser E2E smoke (load, click start, assert canvas and no console errors) over mocking Phaser.
