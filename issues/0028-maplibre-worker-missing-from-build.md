---
id: 28
title: MapLibre vector maps hang — worker chunk (maplibre-gl-worker.mjs) not emitted by build
state: open
labels: [bug, packaging, size-M]
assignee: pham
created: 2026-08-13
---

## Description

Any MapLibre map that uses a **vector** style never finishes rendering: it stays at
`data-render="rendering"` forever and the tiles never draw. This includes a **bare
`use: Maplibre`** (no `XYZ`), which falls back to the default vector style
`https://demotiles.maplibre.org/style.json` (see `style` in
`src/BasicMaplibreRenderer.mjs:13`).

### Root cause

MapLibre GL parses vector tiles (`.pbf`) in a **Web Worker**. It computes the worker
URL at runtime, relative to the renderer module's own `import.meta.url`:

```js
// as bundled in dist/renderers/maplibre.mjs
let I = h.endsWith('-dev.mjs') ? 'maplibre-gl-worker-dev.mjs' : 'maplibre-gl-worker.mjs'
return new URL(`./${I}`, import.meta.url)   // → dist/renderers/maplibre-gl-worker.mjs
```

But the Rollup build (`scripts/rollup.config.js`) emits **one file per renderer**
(`format: 'esm'`, `dir: 'dist/renderers/'`) and has **no worker/chunk handling**, so
`dist/renderers/` only contains `leaflet.mjs`, `maplibre.mjs`, `openlayers.mjs`. The
worker file is never produced, so loading it fails:

```
FAILED net::ERR_FAILED   .../dist/renderers/maplibre-gl-worker.mjs
```

Without the worker, vector tiles never parse → MapLibre's `'load'` event never fires
→ `renderWithConfig` never resolves to `fulfilled` (see `src/mapclay.mjs:352-362`,
which keys `data-render` off the render steps completing).

### Evidence (chromium via Playwright)

For a bare `use: Maplibre` map:

| Request | Result |
|---|---|
| `demotiles.maplibre.org/style.json` | `200` |
| `demotiles.maplibre.org/tiles/tiles.json` | `200` |
| `dist/renderers/maplibre-gl-worker.mjs` | `net::ERR_FAILED` |

`data-render` was still `"rendering"` after 12s. The remote style host is reachable —
the missing worker is the blocker.

### Why raster (`XYZ`) is unaffected

With an `XYZ` option the renderer builds an inline raster style
(`{ version: 8, sources: {}, layers: [] }` + raster source, see
`src/BasicMaplibreRenderer.mjs:70-72,135-145`). Raster tiles are fetched and decoded
as images on the **main thread**, never touching the worker, so `'load'` fires and the
map reaches `fulfilled`. This is why the e2e MapLibre fixture and the working README
examples all pin a tile source, masking the bug.

### Impact

Production, not just local: on the deployed GitHub Pages playground the `multiple` and
`multi-doc` presets (both bare `use: Maplibre`) hang for real users. Leaflet and
OpenLayers are unaffected (no separate worker file). Relates to [[0026-regenerate-playground-links]].

## Tasks

- [ ] Make the build emit the MapLibre worker alongside `dist/renderers/maplibre.mjs`
      (e.g. a Rollup worker/emitFile step, or use `@surma/rollup-plugin-off-main-thread`,
      or switch to MapLibre's inlined-blob worker build) so
      `new URL('./maplibre-gl-worker.mjs', import.meta.url)` resolves.
- [ ] Add an e2e case with a **vector** style (bare `use: Maplibre`, default demotiles)
      that asserts `data-render="fulfilled"` — the current fixtures all use raster/inline
      styles and miss this.
- [ ] Verify the fix works for both `dist/renderers/maplibre.mjs` (direct import) and the
      `?target=` auto-render path.

## Comments

**pham (2026-08-13):** Found while building the self-hosted playground for #26. The
bare-`use: Maplibre` presets there surface it; left them untouched deliberately so the
playground keeps demonstrating the bug until this is fixed.
