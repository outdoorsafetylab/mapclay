---
id: 9
title: setValueByAliases reads `desc` but alias data uses `description`
state: closed
labels: [bug, size-S]
assignee: pham
created: 2026-08-11
closed: 2026-08-12
---

## Description

`setValueByAliases` sets `config.desc` from `aliasResult.desc`, but alias data
uses `description` — so `desc` is never populated (`src/mapclay.mjs:123`).

## Tasks

- [x] Normalise the field name to `desc` across code and docs.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Correctness bugs.

**pham (2026-08-12):** Resolved by standardising on `desc`: `defaultAliases` in
`src/mapclay.mjs` now uses `desc` (matching `setValueByAliases` and
`BaseRenderer`), and the alias example in `README.md` was updated to `desc`.
