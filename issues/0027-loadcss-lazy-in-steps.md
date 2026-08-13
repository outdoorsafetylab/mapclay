---
id: 27
title: Move loadCSS() out of module top-level into renderer steps
state: open
labels: [packaging, size-M]
assignee: pham
created: 2026-08-13
---

## Description

Each renderer calls `loadCSS(...)` at module top level, so importing the module injects a
`<link>` stylesheet into `document.head` as an import-time side effect
(`src/BasicLeafletRenderer.mjs:4`, `src/BasicMaplibreRenderer.mjs:5`,
`src/BasicOpenlayersRenderer.mjs:14`). [[0012-sideeffects-treeshaking]] made this safe by
listing those modules in `package.json` `sideEffects`, but the package is still not
genuinely side-effect-free: a bare `import` writes to the DOM before any map is created.

Refactor so CSS loads lazily — when a renderer is actually instantiated/used — e.g. call
`loadCSS(...)` from the renderer's first `steps` function instead of at module top level.
Then the renderer modules become pure and can be removed from the `sideEffects` list.

## Tasks

- [ ] Move each `loadCSS(...)` call from module top-level into the renderer's first step
      (or constructor), guarding against double-injection (`loadCSS` already no-ops on a
      duplicate `href`).
- [ ] Drop the renderer modules from `package.json` `sideEffects` once they are pure
      (`sideEffects` can likely return to `false`).
- [ ] Confirm e2e renders still load stylesheets (map controls/tiles styled correctly).

## Comments

**pham (2026-08-13):** Follow-up from [[0012-sideeffects-treeshaking]]. That issue only
*declared* the side effect so bundlers preserve it; this issue *eliminates* it. Note the
main runtime path loads renderers via dynamic `import()`, which is never tree-shaken, so
the CSS still loads regardless — the benefit here is a truly pure package for static
importers and a simpler `sideEffects` declaration.
