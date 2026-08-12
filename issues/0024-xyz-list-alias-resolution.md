---
id: 24
title: Resolve aliases inside XYZ lists
state: open
labels: [feature, size-S]
assignee: pham
created: 2026-08-12
---

## Description

`XYZ: OSM` resolves through the built-in presets shipped in #19, but items inside
an `XYZ:` *list* don't:

```yml
XYZ: [OSM, OpenTopoMap]   # neither item resolves; both fail as literal URLs
```

Two gaps combine here:

- `setValueByAliases` (`src/mapclay.mjs:141`) only resolves top-level values that
  are strings (`typeof value === 'string'`), so array items are never looked up.
- The renderer-level fallback in `BaseRenderer.setOptionAliases`
  (`src/BaseRenderer.mjs:261`) does a *flat* lookup (`config.aliases[record.url]`)
  that can never hit the nested `aliases.XYZ.*` entries.

Stacking basemaps is the main reason to have several presets, so lists should
resolve too. Preferred fix is at the `setValueByAliases` level (resolve each
uppercase-starting string item of an array value per-option), which keeps the
renderer fallback untouched; alternatively teach the `BaseRenderer` fallback to
look under the option key. Watch out for options where an array is a plain value,
not a list of alias candidates (e.g. `center: [121, 24]` — numbers, so per-item
string matching is naturally safe).

## Tasks

- [ ] Resolve aliases for string items inside array option values (at least `XYZ`).
- [ ] Unit test: `XYZ: [OSM, OpenTopoMap]` yields two tile data entries with
      resolved URLs; mixed list with a raw URL passes through.

## Comments

**pham (2026-08-12):** Split out of #19, where scope was deliberately limited to
plain-string resolution.
