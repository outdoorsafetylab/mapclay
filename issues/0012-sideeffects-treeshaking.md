---
id: 12
title: Fix `sideEffects: false` — top-level side effects may be tree-shaken
state: open
labels: [packaging]
assignee: pham
created: 2026-08-11
---

## Description

`sideEffects: false` is set, but top-level `loadCSS(...)` and the
`globalThis.mapclay` assignment are side effects and could be tree-shaken away
(`src/BaseRenderer.mjs:14`, `src/mapclay.mjs:443`).

## Tasks

- [ ] List the side-effectful modules in `package.json` `sideEffects`, or refactor
      the side effects out of module top-level.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Packaging & dependencies.
Related: [[0013-globalthis-public-api]].
