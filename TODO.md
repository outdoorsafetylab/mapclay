# TODO

Checklist derived from a review of `README.md` and `src/`. Grouped by priority.

## Security

- [ ] Make `eval` opt-in (or provide a way to disable it). `eval:` options and bare
      string YAML docs run via `new Function(...)` bound to the renderer
      (`src/BaseRenderer.mjs:355`). Rendering untrusted YAML currently means running
      untrusted JS.
- [ ] Allowlist / restrict origins for remote `apply:` and `use:` fetching
      (`src/mapclay.mjs:82`, `src/mapclay.mjs:169`). Both pull config/ES modules
      from arbitrary URLs.
- [ ] Document the security model prominently in the README (what `eval`, `apply`,
      and `use` can execute, and how to lock them down).

## Correctness bugs

- [ ] `runBySteps`: `dependentResult` can be `undefined` when no matching result is
      found, causing a TypeError on `.match(...)` (`src/mapclay.mjs:211`).
- [ ] `XYZ` validation checks `value.includes('z')` instead of `'{z}'`
      (`src/BaseRenderer.mjs:170`).
- [ ] OpenLayers `crs` fallback logs "set EPSG:4326 instead" but returns the invalid
      `crs` unchanged (`src/BasicOpenlayersRenderer.mjs:86`).
- [ ] Typo `config.aply` in thrown error (`src/mapclay.mjs:142`).
- [ ] `setValueByAliases` sets `config.desc` from `aliasResult.desc`, but alias data
      uses `description` — `desc` is never populated (`src/mapclay.mjs:123`).
- [ ] OpenLayers `setOptionsAliases` calls `super.handleAliases`, which does not exist
      (`src/BasicOpenlayersRenderer.mjs:67`).
- [ ] `document.onclick` in the draw util clobbers other handlers and is global rather
      than per-map (`src/BasicDrawComponent.mjs:149`).
- [ ] GPX support is broken/incomplete across all engines (README documents it at
      `README.md:166`, but none of the renderers actually load a GPX file):
  - MapLibre: `data.find(...)` returns the record object `{type, url}`, so
    `'gpx://' + gpxUrl` becomes `gpx://[object Object]`; needs `gpxUrl.url`. The
    `fitBounds` fallback also assumes `features[0].geometry.coordinates` is a flat
    LineString array (`src/BasicMaplibreRenderer.mjs:152,158,177`).
  - OpenLayers: passes the whole record object as `url:` instead of `gpxUrl.url`
    (`src/BasicOpenlayersRenderer.mjs:208,223`); the fit-to-extent block is
    commented out.
  - Leaflet: no `addGPXFile` override — falls through to the base stub that returns
    `{ state: 'skip' }`, so `GPX:` is silently ignored (`src/BaseRenderer.mjs:310`).

## Packaging & dependencies

- [ ] Replace the git-URL dependency `maplibre-gl-vector-text-protocol` (GitHub branch)
      with a published version — it cannot be resolved behind strict registries.
- [ ] Move Leaflet off `2.0.0-alpha.1` (pre-release) or pin deliberately and document why.
- [ ] Pin/align other map deps for reproducible installs.
- [ ] Fix `sideEffects: false` — top-level `loadCSS(...)` and `globalThis.mapclay`
      assignment are side effects and could be tree-shaken away
      (`src/BaseRenderer.mjs:14`, `src/mapclay.mjs:443`).
- [ ] Register the full public API on `globalThis.mapclay` (currently omits
      `renderByScriptTarget` and others) (`src/mapclay.mjs:444`).

## Tests

- [ ] Add a test script and suite (jsdom-based). The `data-render` attribute and
      per-step `results` array make rendering observable.
- [ ] Cover: alias resolution, `apply` merge, step `skip`/`depends`/`stop` logic,
      and one happy-path render per engine (Leaflet / MapLibre / OpenLayers).

## Docs

- [ ] Reconcile README vs. code: default `use` fallback is `'Leaflet'` and aliases use
      `./renderers/*.mjs` relative paths that only resolve in the bundled `dist`, not
      for npm consumers importing `src`.
- [ ] Generate and/or commit JSDoc output (the `docs` script exists but `docs/` does not).
- [ ] Surface render failures to users beyond `console.warn` + `data-render`
      (misconfigured maps silently fall back to a blank/default OSM map).

## Feature TODOs

- [ ] Sync map cameras
- [ ] UI components for camera reset
- [ ] Management of layer group
- [ ] Show current coordinates
- [ ] More aliases (e.g. leaflet-providers XYZ presets)
- [ ] PMTiles support (Protomaps)
- [ ] Crosshair at center of map
