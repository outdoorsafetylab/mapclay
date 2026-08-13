---
id: 13
title: Register the full public API on globalThis.mapclay
state: closed
labels: [packaging, size-S]
assignee: pham
created: 2026-08-11
---

## Description

`globalThis.mapclay` currently omits parts of the public API — e.g.
`renderByScriptTarget` and others (`src/mapclay.mjs:444`).

## Tasks

- [x] ~~Export the complete public API on `globalThis.mapclay`.~~ Superseded: the global
      was removed (ESM-only migration); consumers `import` from `dist/mapclay.mjs`.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Packaging & dependencies.
Related: [[0012-sideeffects-treeshaking]].

**pham (2026-08-13):** Resolved by dropping the global entirely rather than completing it.
The package went ESM-only: the UMD build (which was the only reason for a `window.mapclay`
global) is gone, and consumers now `import { … }` from `dist/mapclay.mjs`. The hand-written
`globalThis.mapclay = { … }` was also the root cause of the "omits parts of the API" bug —
it clobbered the complete UMD-generated global with a 4-function subset. Both are removed.
