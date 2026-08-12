---
id: 10
title: OpenLayers setOptionsAliases calls non-existent super.handleAliases
state: closed
labels: [bug, size-S]
assignee: pham
created: 2026-08-11
closed: 2026-08-12
---

## Description

OpenLayers `setOptionsAliases` calls `super.handleAliases`, which does not exist
(`src/BasicOpenlayersRenderer.mjs:67`).

## Tasks

- [x] Call the correct base method (or remove the call).
- [x] Add coverage for OpenLayers alias handling.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Correctness bugs.

**pham (2026-08-12):** Root cause was a double naming bug. The override was
named `setOptionsAliases` (plural) while the pipeline in `steps` calls
`setOptionAliases` (singular), so the override never ran and its `super`
call to the non-existent `handleAliases` was masked dead code. Renamed the
override to `setOptionAliases` and pointed the `super` call at
`super.setOptionAliases`. Added `test/openlayers.test.mjs` coverage for the
STYLE alias, the WMTS base handling, and that the override shadows the base
method.
