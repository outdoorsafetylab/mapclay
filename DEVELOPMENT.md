# Development

Quick guide for working on `mapclay`. For what the library does and how to *use*
it, see [`README.md`](./README.md). For open work, see [`issues/`](./issues/).

## Prerequisites

- Node.js (project developed on Node 26+)
- `pnpm` — a `pnpm-lock.yaml` is committed, so pnpm is the source of truth for the
  lockfile. `npm` works too, but don't commit a `package-lock.json` (it's gitignored).

```bash
pnpm install
```

> Note: one dependency (`maplibre-gl-vector-text-protocol`) is pulled from a GitHub
> branch, and Leaflet is on a `2.0.0-alpha` release. Installs need network access to
> GitHub and may not be reproducible across environments. See `issues/` #5.

## Scripts

| Command | What it does |
|---|---|
| `pnpm build` | Bundle `src/` into `dist/` with Rollup (config: `scripts/rollup.config.js`). |
| `pnpm watch` | Same as build, in watch mode (rebuilds on `src/**` changes). |
| `pnpm lint` | Run `standard --fix` (JavaScript Standard Style, auto-fixing). |
| `pnpm docs` | Generate JSDoc into `docs/` (config: `scripts/jsdoc.conf`). |
| `pnpm test` | Run the Vitest unit/pipeline suite (jsdom) in `test/`. |
| `pnpm test:watch` | Same, in watch mode. |
| `pnpm test:e2e` | Build `dist/`, then run the Playwright happy-path render tests (real browser) in `e2e/`. |

### Tests

- **`test/`** (Vitest + jsdom): parsing (`parseConfigsFromYaml`) and the render
  pipeline. Pipeline tests drive `renderWith()` with a **mock renderer** (`config.use`
  is an object with a `steps` array), then assert on the observable outputs — the
  per-step `results` array and the `data-render` attribute — covering alias resolution,
  `apply` merge (with a stubbed `fetch`), and step `skip`/`depends`/`stop`/`fail`.
- **`e2e/`** (Playwright): one real-browser render per engine
  (Leaflet / MapLibre / OpenLayers). Each fixture in `e2e/fixtures/` uses
  `<base href="/dist/">` so the `./renderers/*.mjs` aliases resolve, and the test waits
  for `data-render="fulfilled"`. A real browser is required because MapLibre needs WebGL
  and OpenLayers/Leaflet need canvas, which jsdom does not provide. First run:
  `pnpm exec playwright install chromium`.

## Issue tracking

Open work lives in [`issues/`](./issues/) — a GitHub-style tracker of one markdown
file per issue (`NNNN-slug.md`), with [`issues/README.md`](./issues/README.md) as the
board. That README documents the file mechanics (create / close / query); the flow for
actually *working* an issue is:

1. **Pick & branch.** Find open work in the board
   (`grep -l 'state: open' issues/[0-9]*.md`). Cut a branch named
   `fix/issue-<N>-<slug>` (or `feat/…`) off `master`.
2. **Fix + test.** Make the change and add coverage: a Vitest test in `test/` and/or
   an `e2e/` fixture + spec (see [Tests](#tests)). Run `pnpm test` (and `pnpm test:e2e`
   when the change touches real rendering) and `pnpm lint`.
3. **Commit.** Reference the issue in the subject, e.g.
   `fix: <summary> (#<N>)`. Keep unrelated board upkeep in its own commit.
4. **Merge.** Merge the branch into `master` (history uses merge commits, e.g.
   `Merge branch 'fix/issue-8-crs-fallback'`).
5. **Close.** In the issue file set `state: closed` and add a `closed: YYYY-MM-DD`
   date, tick its task checkbox(es), then move its line from the relevant **Open**
   subsection to **Closed** in `issues/README.md` (keep the label suffix). New issues
   start from [`issues/TEMPLATE.md`](./issues/TEMPLATE.md).

## Build output

`dist/` and `docs/` are gitignored; they are build artifacts, not source. `pnpm build`
produces, for each entry point, both an ESM (`.mjs`) and a UMD (`.js`) bundle:

- `src/mapclay.mjs` → `dist/mapclay.mjs` (ESM) and `dist/mapclay.js` (UMD)
- `src/BasicLeafletRenderer.mjs` → `dist/renderers/leaflet.{mjs,js}`
- `src/BasicMaplibreRenderer.mjs` → `dist/renderers/maplibre.{mjs,js}`
- `src/BasicOpenlayersRenderer.mjs` → `dist/renderers/openlayers.{mjs,js}`

The UMD bundles append `renderByScriptTarget()` as an `outro`, which is what makes the
`<script src="...mapclay.js?target=...">` auto-render flow work. Rollup is configured
with `context: 'window'`, and terser runs in production builds with `keep_fnames: true`
(function names are relied on — see the renderer/steps model below).

The published package (`package.json` `files`) ships `index.mjs`, `dist/**`, `src/**`,
and `assets/**`. `index.mjs` re-exports the three renderers and everything from
`dist/mapclay.mjs`.

## Source layout (`src/`)

```
mapclay.mjs                 Core: config parsing, alias/apply resolution,
                            renderer preparation, the steps pipeline, public API.
BaseRenderer.mjs            Base Renderer class: fields, option catalog
                            (validOptions), the default `steps` getter, and no-op
                            step defaults ({ state: 'skip' }). Also loadCSS + MapOption.
BasicLeafletRenderer.mjs    Leaflet engine subclass.
BasicMaplibreRenderer.mjs   MapLibre GL engine subclass.
BasicOpenlayersRenderer.mjs OpenLayers engine subclass.
BasicDrawComponent.mjs      terra-draw setup + drawing UI/persistence utils.
```

### The core model

A **Renderer is an object with a `steps` array of functions**. `render()` /
`renderByYaml()` in `mapclay.mjs`:

1. Parse config (YAML/JSON → one or more config objects).
2. Resolve the renderer from `config.use` (an alias, a remote ES-module URL whose
   default export is a Renderer class, or an inline object with `steps`).
3. Copy config properties onto the renderer instance.
4. Run the **prepare** steps (`setValueByAliases`, `applyOtherConfig`,
   `prepareRenderer`, `healthCheck`), then the renderer's **render** steps in order,
   as a promise chain.
5. Record a result per step (`success` / `skip` / `fail` / `stop`) on
   `renderer.results`, and set `data-render="fulfilled" | "unfulfilled"` on the map
   element.

Each step is called bound to the renderer with the renderer as its sole argument, so
steps use destructuring to read options: `function addMap({ target, center, zoom })`.
A step may return `{ state: 'skip' }` to opt out, and steps can declare a `depends`
(see `BaseRenderer.get steps()`) to be skipped when a prior step failed.

### Adding / changing an option

1. Register it in `BaseRenderer.validOptions` (or the engine subclass's `validOptions`)
   as a `MapOption` with a `name`, `desc`, `example`, and `isValid` validator.
2. Handle it in the relevant step. Options that map to map data (tiles, GPX, WMTS) are
   normalized into `config.data` in `setOptionAliases`; camera/control/debug/eval are
   handled in `createView` / `addMap` / `setControl` / `setExtra`.
3. Implement it per engine by overriding the step in each `Basic*Renderer.mjs`. The
   base class provides `{ state: 'skip' }` no-ops so an engine can simply not implement
   an option.

### Adding a new engine (Renderer)

Subclass the default export of `BaseRenderer.mjs`, override the steps you support
(`addMap` is the minimum), extend `get steps()` if you need extra steps, and add a
Rollup entry in `scripts/rollup.config.js` (plus a `use:` alias in
`defaultAliases` in `mapclay.mjs` if it should be a built-in). Follow the existing
renderers: set `this.map` once (the base class throws on reassignment), and return the
map (or a Promise that resolves when the map is ready) from `addMap`.

## Conventions

- **Style:** JavaScript Standard Style via `standard` (run `pnpm lint`). ESM only
  (`"type": "module"`), `.mjs` extensions. Prettier config in `package.json` sets
  `arrowParens: avoid`.
- **Functional core:** `mapclay.mjs` favors small pure functions, currying
  (`renderWith(converter)`), and reducers over promise chains. Match that style.
- **`keep_fnames`:** function identity matters (steps are compared by reference for
  `depends` and result tracking). Don't rely on minified/renamed function names.
- **Security note:** `eval:`, remote `apply:`, and remote `use:` execute arbitrary
  code/fetches by design. Keep this in mind when touching those paths — see `issues/` #1, #2.

## Manual testing

Until there's an automated suite, verify changes in a browser:

```bash
pnpm build
# serve the repo root, then open an HTML file that loads dist/mapclay.js
python3 -m http.server 8000
```

A minimal page:

```html
<pre>
use: Openlayers
width: 400px
height: 300px
center: [121, 24]
zoom: 8
</pre>
<script src="/dist/mapclay.js?target=pre"></script>
```

Check the map element's `data-render` attribute (`fulfilled` / `unfulfilled`) and the
renderer's `results` array to see which steps succeeded, skipped, or failed.
