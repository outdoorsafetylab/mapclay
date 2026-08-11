---
id: 14
title: Reconcile README vs. code (default `use`, alias relative paths)
state: closed
labels: [docs]
assignee: pham
created: 2026-08-11
closed: 2026-08-11
---

## Description

README and code disagree: the default `use` fallback is `'Leaflet'`, and aliases
use `./renderers/*.mjs` relative paths that only resolve in the bundled `dist`,
not for npm consumers importing `src`.

## Tasks

- [x] Align README with actual defaults.
- [x] Document (or fix) the alias path resolution for `src` consumers vs `dist`.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Docs.

**claude (2026-08-11):** Documented in README: `use` defaults to the `Leaflet`
alias; fixed the `use` alias example (valid YAML, `./renderers/*.mjs` paths matching
`defaultAliases` in `src/mapclay.mjs`); added a "How the alias paths resolve" note
covering npm/`dist`, CDN, and unbundled `src/` consumers.
