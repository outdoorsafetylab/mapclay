---
id: 6
title: Sync map cameras across renderers
state: open
labels: [feature]
assignee: pham
created: 2026-08-11
---

## Description

Keep multiple maps' cameras (center/zoom/bearing) in sync so panning one moves
the others. Groundwork for the camera-reset UI and layer-group management.

## Tasks

- [ ] Define a shared camera state / event bus.
- [ ] Wire per-engine camera get/set into it.
- [ ] UI components for camera reset (follow-up).

## Comments

**pham (2026-08-11):** Extracted from TODO.md → Feature TODOs.
