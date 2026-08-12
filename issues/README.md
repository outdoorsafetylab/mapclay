# Issues

Lightweight, GitHub-style issue tracker living in the repo. One markdown file
per issue in this folder, named `NNNN-slug.md`. This file is the board and is
the single source of truth for open work (there is no separate `TODO.md`).

- **Create:** copy `TEMPLATE.md` to `NNNN-slug.md`, bump the number, fill front-matter,
  add a line under the right section below.
- **Close:** set `state: closed` (+ `closed:` date) in the file, move its line to Closed.
- **Query:** `grep -l 'state: open' issues/[0-9]*.md`, `grep -rl 'security' issues/`.
- History comes free from `git log -- issues/`.

Labels: `security` `bug` `packaging` `docs` `feature` `tests`

Size (rough effort): `size-S` (quick, localized) `size-M` (moderate, multi-file)
`size-L` (design + multi-engine / UI). Query: `grep -l 'size-L' issues/[0-9]*.md`.

## Open

### Security
- [ ] [#1  Make `eval` opt-in / disableable](0001-eval-opt-in.md)
- [ ] [#2  Allowlist origins for remote `apply:` / `use:` fetching](0002-remote-fetch-allowlist.md)

### Correctness bugs
- [ ] [#4  GPX loading broken across all engines](0004-gpx-broken.md)
- [ ] [#9  `setValueByAliases` reads `desc` not `description`](0009-desc-alias-mismatch.md)
- [ ] [#10 OpenLayers calls non-existent `super.handleAliases`](0010-openlayers-handlealiases-missing.md)
- [ ] [#11 draw util `document.onclick` is global / clobbers handlers](0011-document-onclick-global.md)

### Packaging & dependencies
- [ ] [#5  Replace git-URL dependency; deps hygiene](0005-git-url-dep.md)
- [ ] [#12 `sideEffects: false` may tree-shake real side effects](0012-sideeffects-treeshaking.md)
- [ ] [#13 Register the full public API on `globalThis.mapclay`](0013-globalthis-public-api.md)

### Docs
- [ ] [#15 Generate / commit JSDoc output](0015-jsdoc-output.md)
- [ ] [#16 Surface render failures beyond `console.warn`](0016-surface-render-failures.md)

### Features
- [ ] [#6  Sync map cameras (+ reset UI)](0006-sync-cameras.md)
- [ ] [#17 Management of layer groups](0017-layer-group-management.md)
- [ ] [#18 Show current coordinates](0018-show-current-coordinates.md)
- [ ] [#19 More aliases (leaflet-providers XYZ presets)](0019-more-aliases.md)
- [ ] [#20 PMTiles support (Protomaps)](0020-pmtiles-support.md)
- [ ] [#21 Crosshair at center of map](0021-crosshair-center.md)

## Closed

- [x] [#3  `runBySteps` TypeError when `dependentResult` is undefined](0003-runbysteps-undefined.md) `bug`
- [x] [#7  XYZ validation checks `z` instead of `{z}`](0007-xyz-validation.md) `bug`
- [x] [#8  OpenLayers `crs` fallback keeps the invalid crs](0008-openlayers-crs-fallback.md) `bug`
- [x] [#14 Reconcile README vs. code (default `use`, alias paths)](0014-reconcile-readme-vs-code.md) `docs`
- [x] [#22 Typo `config.aply` in thrown error](0022-config-aply-typo.md) `bug`
- [x] [#23 Add test suite (Vitest jsdom + Playwright)](0023-test-suite.md) `tests`
