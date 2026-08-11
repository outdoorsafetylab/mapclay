---
id: 7
title: XYZ validation checks `value.includes('z')` instead of `'{z}'`
state: closed
labels: [bug]
assignee: pham
created: 2026-08-11
closed: 2026-08-11
---

## Description

XYZ tile-URL validation checks `value.includes('z')` instead of `'{z}'`
(`src/BaseRenderer.mjs:170`), so any URL containing the letter `z` passes.

## Tasks

- [x] Check for the `{z}` placeholder (and likely `{x}`/`{y}`).
- [x] Add a test with a URL that contains `z` but no `{z}`.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Correctness bugs.

**pham (2026-08-11):** Fixed — validation now checks for the `{z}` placeholder
(`{x}`/`{y}` were already correct). Added regression test in
`test/validate.test.mjs`.
