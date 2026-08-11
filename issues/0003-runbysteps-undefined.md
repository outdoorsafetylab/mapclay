---
id: 3
title: runBySteps TypeError when dependentResult is undefined
state: closed
labels: [bug]
assignee: pham
created: 2026-08-11
closed: 2026-08-11
---

## Description

In `runBySteps`, `dependentResult` can be `undefined` when no matching result
is found, causing a TypeError on `.match(...)` (`src/mapclay.mjs:211`).

## Tasks

- [x] Guard against `undefined` before `.match(...)`.
- [x] Add a regression test in `test/` for the no-matching-dependency path.

## Comments

**pham (2026-08-11):** Extracted from TODO.md → Correctness bugs.

**pham (2026-08-11):** Fixed — a missing dependency now skips the step instead
of throwing. Added regression test in `test/pipeline.test.mjs`.
