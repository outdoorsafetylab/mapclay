---
id: 12
title: Fix `sideEffects: false` — top-level side effects may be tree-shaken
state: closed
labels: [packaging, size-S]
assignee: pham
created: 2026-08-11
---

## Description

`sideEffects: false` is set, but top-level `loadCSS(...)` and the
`globalThis.mapclay` assignment are side effects and could be tree-shaken away
(`src/BaseRenderer.mjs:14`, `src/mapclay.mjs:443`).

## Tasks

- [x] List the side-effectful modules in `package.json` `sideEffects`, or refactor
      the side effects out of module top-level.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Packaging & dependencies.
Related: [[0013-globalthis-public-api]].

**pham (2026-08-13):** Resolved by the ESM-only migration. The `globalThis.mapclay`
assignment was deleted outright. `sideEffects` now lists the renderer modules that call
`loadCSS()` at import time (`dist/renderers/*.mjs` + `src/Basic*Renderer.mjs`); `mapclay.mjs`
is intentionally left out so its `?target=` auto-render block can be tree-shaken by app
bundlers.
