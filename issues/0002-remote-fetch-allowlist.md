---
id: 2
title: Allowlist / restrict origins for remote `apply:` and `use:` fetching
state: open
labels: [security]
assignee: pham
created: 2026-08-11
---

## Description

Both `apply:` (`src/mapclay.mjs:82`) and `use:` (`src/mapclay.mjs:169`) pull
config / ES modules from arbitrary URLs. There is no origin restriction, so a
malicious YAML can point the renderer at any host.

## Tasks

- [ ] Add an origin allowlist config for remote fetches.
- [ ] Default to same-origin (or explicit list) and document the override.

## Comments

**pham (2026-08-11):** Extracted from TODO.md → Security. Related: [[0001-eval-opt-in]].
