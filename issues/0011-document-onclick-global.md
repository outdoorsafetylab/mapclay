---
id: 11
title: draw util's document.onclick clobbers other handlers and is global
state: open
labels: [bug, size-M]
assignee: pham
created: 2026-08-11
---

## Description

`document.onclick` in the draw util clobbers other handlers and is global rather
than per-map (`src/BasicDrawComponent.mjs:149`).

## Tasks

- [ ] Use `addEventListener` scoped to the map element instead of `document.onclick`.
- [ ] Ensure listeners are cleaned up per map instance.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Correctness bugs.
