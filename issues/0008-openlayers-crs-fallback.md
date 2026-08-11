---
id: 8
title: OpenLayers crs fallback logs "EPSG:4326 instead" but keeps invalid crs
state: closed
labels: [bug]
assignee: pham
created: 2026-08-11
closed: 2026-08-11
---

## Description

The OpenLayers `crs` fallback logs "set EPSG:4326 instead" but returns the
    invalid `crs` unchanged (`src/BasicOpenlayersRenderer.mjs:86`). The log and the
behaviour disagree.

## Tasks

- [x] Drop the misleading fallback: an invalid `crs` now throws so the render step fails directly.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Correctness bugs.
**pham (2026-08-11):** In this case, there should no fallback. Invalid CRS should make rendering fails directly.
