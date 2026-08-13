---
id: 26
title: Replace README "Try it out" links with a self-hosted live playground
state: open
labels: [docs, size-M]
assignee: pham
created: 2026-08-13
---

## Description

Originally scoped as re-encoding the 8 URL-encoded "Try it out" links
(markdown-it.github.io playground) from UMD to ESM after the ESM-only migration
(see [[0012-sideeffects-treeshaking]] and [[0013-globalthis-public-api]]).

Investigation with a real browser (Playwright + chromium) found the premise was
broken: the markdown-it playground can no longer run **any** embedded script, so
re-encoding to ESM would not restore a live map. Instead we replaced the external
playground with our own.

### Why the markdown-it playground stopped working

- Its preview is rendered with `qs('.result-html').innerHTML = md.render(src)`. Raw
  `innerHTML` never executes `<script>` — neither `type="module"` nor classic.
- This is an **upstream regression**. The jQuery-era demo (≤ v13) used
  `$('.result-html').html(...)`, and jQuery's `.html()` extracts and evals classic
  scripts — so the old UMD `<script src=…mapclay.js>` links *did* render live maps.
  markdown-it dropped jQuery/lodash and ported to Vite in **May 2026**
  (commits `4e1cafb`, `d57c1d2`), replacing `.html()` with raw `innerHTML`. Since
  then the preview executes nothing, for UMD or ESM.

## Resolution

Added `examples/playground.html`: a self-contained live playground (left column =
editable YAML, right column = live-rendered map, re-render on input via
`renderByYaml`), with a preset selector driven by `#preset=<name>`. Repointed all 8
README links to
`https://outdoorsafetylab.github.io/mapclay/examples/playground.html#preset=<name>`
(presets: `minimal`, `options`, `multiple`, `eval`, `multi-doc`).

GitHub Pages deployment is maintained manually by the project (no CI workflow added).
The playground only needs `examples/` and `dist/` served with their relative layout
intact — it imports `../dist/mapclay.mjs`, whose internal
`await import('./renderers/*.mjs')` resolves under the same Pages path.

## Tasks

- [x] Build a self-hosted playground to replace the dead markdown-it links
- [x] Repoint all 8 README "Try it out" links to the playground presets
- [x] Verify Leaflet/OpenLayers/raster presets render + live re-render on edit
- [ ] Re-verify the `multiple` / `multi-doc` bare-`use: Maplibre` presets once
      [[0028-maplibre-worker-missing-from-build]] is fixed, then close

## Comments

**pham (2026-08-13):** Deferred from the ESM-only migration. Scope grew from a
size-S re-encode to a size-M new playground once the markdown-it preview was found to
execute no scripts at all. Not wired: the separate empty `[Try it out]()` under the
`apply` option (line ~248) — its `assets/default.yml` isn't in the repo; left for a
follow-up.

**pham (2026-08-13):** Reopened. While verifying the playground, the `multiple` and
`multi-doc` presets (both bare `use: Maplibre`) never reach `fulfilled` — MapLibre's
vector-tile worker is missing from the build. Filed as
[[0028-maplibre-worker-missing-from-build]]. Presets left untouched on purpose so the
playground keeps demonstrating the bug; this issue stays open until #28 is fixed (then
re-verify those two presets and close). Leaflet/OpenLayers presets and the `options`
MapLibre preset render fine.
