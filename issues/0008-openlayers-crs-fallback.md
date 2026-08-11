---
id: 8
title: OpenLayers crs fallback logs "EPSG:4326 instead" but keeps invalid crs
state: open
labels: [bug]
assignee: pham
created: 2026-08-11
---

## Description

The OpenLayers `crs` fallback logs "set EPSG:4326 instead" but returns the
invalid `crs` unchanged (`src/BasicOpenlayersRenderer.mjs:86`). The log and the
behaviour disagree.

## Tasks

- [ ] Actually fall back to `EPSG:4326` (or drop the misleading log).

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Correctness bugs.
