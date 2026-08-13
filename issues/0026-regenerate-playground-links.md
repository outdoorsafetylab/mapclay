---
id: 26
title: Regenerate README "Try it out" playground links for ESM-only
state: open
labels: [docs, size-S]
assignee: pham
created: 2026-08-13
---

## Description

The ESM-only migration (see [[0012-sideeffects-treeshaking]] and
[[0013-globalthis-public-api]]) updated every visible code block in `README.md`, but the
8 URL-encoded "Try it out" links (markdown-it.github.io playground) still embed the old
UMD patterns: `dist/mapclay.js`, classic `<script>` tags, `data-target`, and the global
`mapclay.render()` / `mapclay.renderByYaml()` calls. Once the ESM-only version is
published to unpkg, these demos will break.

## Tasks

- [ ] Re-encode each `#md3=` payload to the ESM form:
      - auto-render → `<script type="module" src='…/dist/mapclay.mjs?target=…'>`
      - API calls → `<script type="module">import { … } from '…/dist/mapclay.mjs'</script>`
      - drop the `data-target` variant (removed feature)
- [ ] Confirm the markdown-it playground preview runs module scripts + imports from unpkg.

## Comments

**pham (2026-08-13):** Deferred from the ESM-only migration; visible code blocks are
already correct, only the encoded playground links remain.
