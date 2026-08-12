---
id: 25
title: Fix `pnpm lint` — standard is not a devDependency and repo is not standard-clean
state: open
labels: [bug, size-S]
assignee: pham
created: 2026-08-12
---

## Description

`pnpm lint` runs `standard --fix` (`package.json` scripts), but `standard` is not
in `devDependencies`, so a fresh checkout fails with `standard: command not found`.
DEVELOPMENT.md lists `pnpm lint` as part of the working-an-issue flow, so the flow
is currently unfollowable as documented.

On top of that, the committed code is not standard-clean: a one-off
`pnpm dlx standard` run reports ~43 violations — mostly `comma-dangle` (the
codebase consistently *uses* trailing commas, which standard forbids) plus an
unused `beforeEach` import in `test/pipeline.test.mjs:1`. So simply installing
standard and running `--fix` would rewrite style across the repo.

Decide deliberately:

- either adopt standard for real (add it to `devDependencies`, run `--fix` once
  in a dedicated style-only commit, accept losing trailing commas),
- or switch the `lint` script to a linter/config that matches the existing style
  (e.g. eslint with `comma-dangle: always-multiline`) and drop the standard claim.

## Tasks

- [ ] Make `pnpm lint` work on a fresh checkout.
- [ ] Make the repo pass its own lint (style-only commit if rules change
      formatting), including the unused `beforeEach` import.
- [ ] Update DEVELOPMENT.md if the tool or its behavior changes.

## Comments

**pham (2026-08-12):** Found while working #19 — lint step of the documented
workflow could not be run.
