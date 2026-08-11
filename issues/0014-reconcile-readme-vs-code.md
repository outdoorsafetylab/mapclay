---
id: 14
title: Reconcile README vs. code (default `use`, alias relative paths)
state: open
labels: [docs]
assignee: pham
created: 2026-08-11
---

## Description

README and code disagree: the default `use` fallback is `'Leaflet'`, and aliases
use `./renderers/*.mjs` relative paths that only resolve in the bundled `dist`,
not for npm consumers importing `src`.

## Tasks

- [ ] Align README with actual defaults.
- [ ] Document (or fix) the alias path resolution for `src` consumers vs `dist`.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Docs.
