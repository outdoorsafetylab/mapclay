---
id: 22
title: Typo `config.aply` in thrown error
state: closed
labels: [bug]
assignee: pham
created: 2026-08-11
closed: 2026-08-10
---

## Description

Thrown error referenced `config.aply` instead of `config.apply`
(`src/mapclay.mjs:142`).

## Tasks

- [x] Fix the typo.

## Comments

**pham (2026-08-11):** Migrated from TODO.md → Correctness bugs (already done).
Fixed in commit `8e4f6dc` ("fix: correct config.aply typo in remote config error message").
