---
id: 4
title: GPX loading is broken/incomplete across all engines
state: open
labels: [bug]
assignee: pham
created: 2026-08-11
---

## Description

README documents GPX support (`README.md:166`), but no renderer actually loads
a GPX file.

- **MapLibre:** `data.find(...)` returns the record `{type, url}`, so
  `'gpx://' + gpxUrl` becomes `gpx://[object Object]`; needs `gpxUrl.url`. The
  `fitBounds` fallback also assumes `features[0].geometry.coordinates` is a flat
  LineString array (`src/BasicMaplibreRenderer.mjs:152,158,177`).
- **OpenLayers:** passes the whole record object as `url:` instead of
  `gpxUrl.url` (`src/BasicOpenlayersRenderer.mjs:208,223`); the fit-to-extent
  block is commented out.
- **Leaflet:** no `addGPXFile` override — falls through to the base stub that
  returns `{ state: 'skip' }`, so `GPX:` is silently ignored
  (`src/BaseRenderer.mjs:310`).

## Tasks

- [ ] MapLibre: use `gpxUrl.url`; fix `fitBounds` for real geometry shapes.
- [ ] OpenLayers: pass `gpxUrl.url`; re-enable fit-to-extent.
- [ ] Leaflet: implement `addGPXFile`.
- [ ] One happy-path GPX test per engine.

## Comments

**pham (2026-08-11):** Extracted from TODO.md → Correctness bugs.
