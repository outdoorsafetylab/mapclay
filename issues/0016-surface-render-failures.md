---
id: 16
title: Surface render failures to users beyond console.warn
state: open
labels: [docs]
assignee: pham
created: 2026-08-11
---

## Description

Misconfigured maps silently fall back to a blank/default OSM map; failures only
appear via `console.warn` + the `data-render` attribute. Users get no visible
signal.

## Tasks

- [ ] Provide a visible error state / callback for render failures.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Docs (UX-adjacent).
