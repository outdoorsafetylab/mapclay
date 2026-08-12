---
id: 9
title: setValueByAliases reads `desc` but alias data uses `description`
state: open
labels: [bug, size-S]
assignee: pham
created: 2026-08-11
---

## Description

`setValueByAliases` sets `config.desc` from `aliasResult.desc`, but alias data
uses `description` — so `desc` is never populated (`src/mapclay.mjs:123`).

## Tasks

- [ ] Read `aliasResult.description` (or normalise the field name).

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Correctness bugs.
