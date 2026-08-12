---
id: 13
title: Register the full public API on globalThis.mapclay
state: open
labels: [packaging, size-S]
assignee: pham
created: 2026-08-11
---

## Description

`globalThis.mapclay` currently omits parts of the public API — e.g.
`renderByScriptTarget` and others (`src/mapclay.mjs:444`).

## Tasks

- [ ] Export the complete public API on `globalThis.mapclay`.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Packaging & dependencies.
Related: [[0012-sideeffects-treeshaking]].
