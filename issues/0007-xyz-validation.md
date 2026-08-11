---
id: 7
title: XYZ validation checks `value.includes('z')` instead of `'{z}'`
state: open
labels: [bug]
assignee: pham
created: 2026-08-11
---

## Description

XYZ tile-URL validation checks `value.includes('z')` instead of `'{z}'`
(`src/BaseRenderer.mjs:170`), so any URL containing the letter `z` passes.

## Tasks

- [ ] Check for the `{z}` placeholder (and likely `{x}`/`{y}`).
- [ ] Add a test with a URL that contains `z` but no `{z}`.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Correctness bugs.
