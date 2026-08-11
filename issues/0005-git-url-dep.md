---
id: 5
title: Replace git-URL dependency maplibre-gl-vector-text-protocol
state: open
labels: [packaging]
assignee: pham
created: 2026-08-11
---

## Description

`maplibre-gl-vector-text-protocol` is pinned to a GitHub branch. It cannot be
resolved behind strict registries and is not reproducible.

## Tasks

- [ ] Switch to a published npm version, or vendor it.
- [ ] While here: move Leaflet off `2.0.0-alpha.1` or document the pin.

## Comments

**pham (2026-08-11):** Extracted from TODO.md → Packaging & dependencies.
