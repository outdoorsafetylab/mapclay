---
id: 23
title: Add a test script and suite (jsdom + Playwright)
state: closed
labels: [tests]
assignee: pham
created: 2026-08-11
closed: 2026-08-10
---

## Description

The `data-render` attribute and per-step `results` array make rendering
observable; add automated coverage.

## Tasks

- [x] Add a test script and jsdom-based suite (`pnpm test` — Vitest + jsdom in `test/`).
- [x] Add real-browser e2e (`pnpm test:e2e` — Playwright in `e2e/`).
- [x] Cover alias resolution, `apply` merge, step `skip`/`depends`/`stop` logic,
      and one happy-path render per engine (Leaflet / MapLibre / OpenLayers).

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Tests (already done).
Landed in commit `28577d2` ("test: add Vitest (jsdom) and Playwright test suites").
