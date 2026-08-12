---
id: 10
title: OpenLayers setOptionsAliases calls non-existent super.handleAliases
state: open
labels: [bug, size-S]
assignee: pham
created: 2026-08-11
---

## Description

OpenLayers `setOptionsAliases` calls `super.handleAliases`, which does not exist
(`src/BasicOpenlayersRenderer.mjs:67`).

## Tasks

- [ ] Call the correct base method (or remove the call).
- [ ] Add coverage for OpenLayers alias handling.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Correctness bugs.
