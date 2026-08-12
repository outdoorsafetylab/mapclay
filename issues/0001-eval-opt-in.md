---
id: 1
title: Make `eval` opt-in (or provide a way to disable it)
state: open
labels: [security, size-M]
assignee: pham
created: 2026-08-11
---

## Description

`eval:` options and bare-string YAML docs run via `new Function(...)` bound to
the renderer (`src/BaseRenderer.mjs:355`). Rendering untrusted YAML currently
means running untrusted JS in the page context.

## Tasks

- [ ] Gate `new Function(...)` behind an explicit opt-in flag (default off).
- [ ] Document the security model in the README (what `eval`, `apply`, `use` can run).

## Comments

**pham (2026-08-11):** Extracted from TODO.md → Security.
