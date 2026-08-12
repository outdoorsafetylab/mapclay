---
id: 19
title: More aliases (e.g. leaflet-providers XYZ presets)
state: closed
labels: [feature, size-S]
assignee: pham
created: 2026-08-11
closed: 2026-08-12
---

## Description

Ship more built-in aliases, e.g. leaflet-providers-style XYZ tile presets.

## Tasks

- [x] Add a curated set of provider aliases.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Feature TODOs.

**pham (2026-08-12):** Shipped as `defaultAliases.XYZ` in `src/mapclay.mjs`: OSM,
OSM HOT, OpenTopoMap, CyclOSM, CARTO Light/Dark, Esri World Imagery, plus Taiwan
NLSC EMAP/Photo. Keyless providers only; no `{s}`/`{r}` placeholders (not supported
across renderers); attribution text lives in each preset's `desc`. Scope note:
only a plain string `XYZ: <Alias>` resolves — items inside an `XYZ:` *list* don't,
because `BaseRenderer.setOptionAliases` does a flat `config.aliases[record.url]`
lookup that can't see nested `aliases.XYZ.*` entries. List support would be a
follow-up issue.
