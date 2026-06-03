# Sudocidio Map Package

`mapa/` contains the Phaser map and puzzle engine for Sudocidio.

It has two roles:

- Standalone Phaser/Webpack app for developing the map in isolation.
- Source package imported directly by the root Next.js app through `src/components/gameplay/PhaserMapWrapper.tsx`.

The main Sudocidio app does not need a separate `mapa` server running during normal gameplay. Next imports `mapa/src/scenes/preload.scene.ts` and `mapa/src/scenes/game.scene.ts` directly and creates the Phaser game inside the `/game` page.

## What It Does

The map package owns the procedural mansion and the Phaser gameplay layer:

- Loads all map, room, NPC, weapon, furniture, cursor, and highlight textures.
- Builds runtime tilesets.
- Generates deterministic maps from a seed.
- Creates room layouts and merges grid cells into larger rooms.
- Assigns room types.
- Places suspects, victim, weapons, and furniture.
- Generates clue/hint text.
- Renders tilemaps, furniture, highlights, and placed entities.
- Handles drag/drop placement onto the Phaser canvas.
- Checks correct placements and accusation results.
- Applies sabotage effects received from the React/Socket.IO layer.
- Sends progress, hint, entity, and result events back to React through browser custom events.

## Project Structure

```text
mapa/
|-- README.md
|-- package.json
|-- package-lock.json
|-- webpack.config.js
|-- tsconfig.json
|-- index.html                  # Standalone HTML host
|-- style.css                   # Standalone styles
|-- assets/                     # Source art used by the standalone package
`-- src/
    |-- app.ts                  # Standalone Phaser entry point
    |-- scenes/
    |   |-- preload.scene.ts    # Loads textures and builds tilesets
    |   `-- game.scene.ts       # Main Phaser scene and gameplay bridge
    |-- generators/
    |   |-- map.generator.ts    # Main procedural map orchestrator
    |   |-- layout.generator.ts
    |   |-- tilemap.builder.ts
    |   |-- entity.generator.ts
    |   |-- furniture.generator.ts
    |   |-- hint.generator.ts
    |   `-- utils/
    |       |-- room.assigner.ts
    |       `-- room.merger.ts
    |-- core/
    |   |-- random.core.ts
    |   |-- camera.controller.ts
    |   |-- texture.loader.ts
    |   |-- tileset.builder.ts
    |   |-- placement.manager.ts
    |   `-- furniture.manager.ts
    |-- components/
    |   |-- tilemap.renderer.ts
    |   `-- highlight.manager.ts
    |-- ui/
    |   |-- HUD.component.ts
    |   |-- HUD.styles.ts
    |   |-- entity.panel.ts
    |   `-- guess.panel.ts
    |-- types/
    |   |-- interfaces.ts
    |   |-- npc.registry.ts
    |   `-- furniture.registry.ts
    `-- utils/
        |-- coordinates.utils.ts
        |-- DOM.utils.ts
        `-- highlightTexture.utils.ts
```

## Important Dependencies

From `mapa/package.json`:

Runtime dependencies:

- `rot-js`: procedural/random generation support.
- `qs`: query-string parsing support.

Development/build dependencies:

- `phaser`: Phaser 3 runtime for the standalone map.
- `typescript`: TypeScript compiler.
- `webpack`, `webpack-cli`: standalone bundle pipeline.
- `ts-loader`: TypeScript loader for Webpack.
- `http-server`: serves the standalone build.
- `concurrently`: helper for running watch/server commands together manually.

Note: the root app also has its own `phaser` dependency. In normal gameplay, `PhaserMapWrapper` imports Phaser from the root app and imports scene source files from `mapa/src`.

## How It Fits Into the Main App

The root game page renders:

```text
src/components/gameplay/PhaserMapWrapper.tsx
```

That component dynamically imports:

```text
mapa/src/scenes/preload.scene.ts
mapa/src/scenes/game.scene.ts
```

Before creating the Phaser game, the wrapper stores the multiplayer seed on:

```ts
window.__sudocidio_seed
```

`GameScene` reads the seed in this order:

1. `window.__sudocidio_seed`
2. `?seed=` from the current URL
3. random fallback

Then it calls:

```ts
MapGenerator.generate(seed)
```

This is why both players receive identical maps after the Socket.IO server emits the same seed to both clients.

React and Phaser communicate with browser custom events. Examples:

Phaser to React:

- `sudocidio:entitiesGenerated`
- `sudocidio:newHint`
- `sudocidio:progressUpdate`
- `sudocidio:accusationResult`
- `sudocidio:victory`

React to Phaser:

- `sudocidio:requestHint`
- `sudocidio:makeAccusation`
- `sudocidio:applySabotage`
- `sudocidio:volumeChange`

## Prerequisites

- Node.js 18 or newer should work for the repo as a whole.
- npm.
- mapa/ dependencies installed separately, because this repo is not configured as an npm workspace.

## Install

From the `mapa/` directory:

```bash
npm install
```

## Run Standalone

Build the standalone bundle:

```bash
npm run build
```

Serve it:

```bash
npm run serve
```

Open:

```text
http://localhost:8085
```

For active standalone development, use two terminals:

```bash
npm run watch
```

```bash
npm run serve
```

Webpack writes the standalone bundle to:

```text
mapa/dist/app.js
```

## Normal App Development

For normal Sudocidio gameplay, you usually do not run `mapa/` separately. Start the root app and realtime server instead:

Terminal 1, repo root:

```bash
npm run dev
```

Terminal 2, `server/`:

```bash
npx tsx server.ts
```

Then open:

```text
http://localhost:3000/game
```

The root app will load the Phaser scenes from `mapa/src` automatically.

## Asset Notes

The map source assets live in:

```text
mapa/assets/
```

The running Next app loads browser assets from:

```text
public/assets/
```

When adding or changing map art, make sure the runtime path used by Phaser, such as `/assets/weapons/knife.png`, exists under `public/assets` for the integrated Next app. Keep `mapa/assets` and `public/assets` in sync when needed.

## Gotchas

- `mapa/` is not configured as an npm workspace. Install its dependencies separately.
- The standalone package uses Phaser 3, while the root package currently lists Phaser 4.
- The standalone entry point is `mapa/src/app.ts`; the integrated Next app does not use that entry point.
- The integrated app imports scene files from `mapa/src` directly, so TypeScript errors in `mapa/src` can affect the root app.
- `GameScene` can use a URL seed with `?seed=123`, but in multiplayer the root app injects the seed through `window.__sudocidio_seed`.
