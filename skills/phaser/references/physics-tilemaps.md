# Physics and Tilemaps

## Pick a physics system

| Need | Use |
| --- | --- |
| Platformer, shooter, top-down, many bodies, simple triggers | Arcade |
| Polygons, compound shapes, joints/constraints, stacking, realistic spin | Matter |
| No physics, just overlap tests | `Phaser.Geom` + `Phaser.Geom.Intersects`, or Zones |

Enable in config:

```ts
physics: { default: 'arcade', arcade: { gravity: { y: 900 }, debug: false } }
// or per scene: super({ key: 'Level1', physics: { arcade: { debug: true } } })
// Arcade-only build (no Matter) exists as dist/phaser-arcade-physics(.min).js for script-tag use;
// the package exports map does not expose it as an import path, so bundler users get the full build.
```

## Arcade

```ts
this.player = this.physics.add.sprite(100, 300, 'hero').setCollideWorldBounds(true).setBounce(0.1);
const platforms = this.physics.add.staticGroup();
platforms.create(400, 568, 'ground').setScale(2).refreshBody();

this.physics.add.collider(this.player, platforms);
this.physics.add.overlap(this.player, coins, (p, coin) => (coin as Phaser.Physics.Arcade.Sprite).disableBody(true, true));
this.physics.add.collider(bullets, enemies, onHit, (b, e) => b.active && e.active, this); // processCallback gates the hit
```

Body facts:
- `velocity` px/s, `acceleration` px/s^2, `drag` applies only when acceleration is 0, `maxVelocity` default 10000, `bounce`, `mass`, `immovable` (never moved), `pushable` (false reflects velocity), `gravity` (per-body, added to world), `moves`, `enable`.
- State: `body.blocked`, `body.touching`, `body.wasTouching`, `onFloor()`.
- Shapes: box by default; `setCircle(r, offsetX, offsetY)`; `setSize(w, h)`, `setOffset(x, y)`.
- `useDamping: true` treats drag as a multiplier (e.g. 0.05).
- Events need opt-in: `body.onCollide = true`, `onOverlap = true`, `onWorldBounds = true`; then `this.physics.world.on('collide'|'overlap'|'worldbounds', ...)`.
- One-shot checks (`this.physics.collide(a, b)`) must run every frame; prefer persistent `add.collider/overlap`.
- Static bodies: after moving/scaling call `refreshBody()` (or `body.reset()`).
- Bodies: `disableBody(true, true)` for pickups; `enableBody(true, x, y, true, true)` to respawn from a pool.
- World: `this.physics.world.setBounds(x, y, w, h)`, `setBoundsCollision(left, right, up, down)`, `setFPS(120)`, `timeScale`, `pause()/resume()`, `fixedStep`, `useTree: false` for 5000+ dynamic bodies.
- Categories: bodies share category `0x0001` by default; `this.physics.nextCategory()` gives up to 32; use `body.setCollisionCategory`, `setCollidesWith`.
- Helpers: `physics.moveToObject`, `accelerateToObject`, `velocityFromRotation`, `closest`, `furthest`, `overlapRect`.
- Do not put physics bodies on Container children unless the container sits at 0,0.
- Never ship `debug: true`.

### Moving platforms and riding

`platform.body.setImmovable(true); platform.body.setAllowGravity(false); platform.body.setVelocityX(60);` Default `friction` is `(1, 0)`, so riders inherit horizontal motion.

### Fixed vs variable step

Arcade steps at `fps` (default 60) with fixed step; use `delta` only for non-physics motion. For frame-rate independent movement set velocity, not position.

## Matter

```ts
physics: { default: 'matter', matter: { gravity: { y: 1 }, debug: true } }

const ball = this.matter.add.image(400, 100, 'ball', undefined, { restitution: 0.9, friction: 0.01 });
ball.setCircle(16);
this.matter.world.setBounds(0, 0, 800, 600);
this.matter.add.mouseSpring();
this.matter.add.constraint(a.body as MatterJS.BodyType, b.body as MatterJS.BodyType, 80, 0.8);
```

- Forces are tiny (`applyForce` 0.01-0.1); velocity 1-15.
- Position is center of mass.
- `setBody`, `setRectangle`, `setCircle` reset mass, friction, filters, and callbacks; set them after shaping.
- Constraints target the parent body, not compound `parts`.
- Collision filters: `category`, `mask`, `group` (positive group = always collide, negative = never; overrides category/mask). Max 32 categories.
- Sensors (`isSensor: true`) still need compatible collision filters to fire events.
- Sleep events: `sprite.setSleepEvents(true, true)`.
- Events: `this.matter.world.on('collisionstart', (event, a, b) => {})`, `collisionactive`, `collisionend`.
- Tilemaps: call `layer.setCollisionByProperty(...)` first, then `this.matter.world.convertTilemapLayer(layer)`.

## Tilemaps (Tiled)

```ts
preload() {
  this.load.tilemapTiledJSON('map', 'level1.json');
  this.load.image('tiles', 'tilesheet.png');             // single-image tileset
}
create() {
  const map = this.make.tilemap({ key: 'map' });          // or this.add.tilemap('map')
  const tileset = map.addTilesetImage('tilesheet', 'tiles')!; // Tiled tileset NAME, Phaser texture KEY
  const ground = map.createLayer('Ground', tileset)!;     // Tiled layer NAME
  ground.setCollisionByProperty({ collides: true });
  this.physics.add.collider(this.player, ground);
  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

  const spawn = map.findObject('Objects', (o) => o.name === 'spawn');
  map.createFromObjects('Objects', { name: 'coin', key: 'coin' });
}
```

Rules:
- Tileset name must match Tiled exactly; wrong name returns `null`.
- Each Tiled layer can become a game object once; second `createLayer` returns `null`.
- Tilesets must be a single image with embedded tilesets in the exported JSON ("collection of images" is unsupported). Export with embedded tilesets; extrude/pad tiles (1-2 px) to avoid seams with scaling or zoom.
- Layer position defaults to the Tiled layer offset, not 0,0.
- `setCollision([ids])`, `setCollisionBetween(a, b)`, `setCollisionByProperty({ key: true })`, `setCollisionByExclusion([-1])`, `setCollisionFromCollisionGroup()` must run before colliders work.
- Tile index `-1` is empty; many getters return `null` unless `nonNull: true`.
- `setTileIndexCallback` / `setTileLocationCallback` fire only while a collider or overlap with the layer is active.
- `createFromTiles`, `replaceByIndex`, `putTileAt`, `removeTileAt`, `fill`, `forEachTile`, `getTilesWithinWorldXY`, `worldToTileXY`.
- Tile animations defined in Tiled's tileset editor are parsed automatically (both layer types).
- Group layers: name is `Group/Layer`.
- Use `insertNull: true` for large sparse maps to save memory (blocks dynamic placement in empty cells).
- Dynamic layers (`map.createBlankLayer`) for procedural levels.
- `TilemapLayer` supports orthogonal, isometric, staggered, and hexagonal maps; GPU layers are orthogonal only.

### GPU layers (v4)

```ts
const gpu = map.createLayer('Ground', tileset, 0, 0, true); // 5th arg: gpu
gpu.putTileAt(5, 10, 10);
gpu.generateLayerDataTexture();                             // required after edits
```

Single tileset, orthographic only, up to 4096x4096 tiles, WebGL only, tile flip + animation supported, no per-tile tint, cost per pixel not per tile. GPU layers share the tile query and collision methods of the base layer class; confirm collider behaviour in your game, and use a normal `TilemapLayer` when in doubt.

## Verification tips

- Turn on physics `debug: true` temporarily; confirm body sizes and offsets before tuning feel.
- Check that colliders exist for every tile layer and group you expect.
- Test pause/resume: `this.physics.pause()` and scene `pause` both stop bodies.
- Test restart: bodies and colliders are rebuilt with the scene; do not keep module-level references to destroyed bodies.
