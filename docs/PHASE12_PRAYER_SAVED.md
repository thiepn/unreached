# Phase 12 — Prayer / My Lists simplification

## Goal

Reduce cognitive and interface overhead without weakening the existing private prayer rotation, focused-prayer, or guided-session capabilities.

## Changes

### Focused prayer

- Replaced the previous `2 / 5 / 10 min` UI with explicit guide lengths:
  - **Short** — 3 prompts
  - **Standard** — 5 prompts
  - **Extended** — 7 prompts
- The interface states that no timer runs and that there is no completion target.
- Internal prompt-selection compatibility remains unchanged so existing certified prayer template behavior is preserved.

### Prayer library

- Removed the permanent 60-record display ceiling.
- Render 24 matches initially, then expose additional records in 24-record batches.
- The UI always states `Showing X of Y` and can reach every matching prayer subject.
- Query and country-scope changes reset the visible batch to the first 24 records.

### My lists

- Standardized the destination name as **My lists**.
- Shortened the page introduction.
- Kept prayer rotation and guided prayer sessions directly available.
- Moved detailed local-storage explanations into optional native disclosures.
- Collapsed Recent by default so it remains a secondary return aid rather than competing with saved people and the prayer list.
- Prayer-session return links now consistently use My lists naming.

## Privacy and behavioral invariants retained

- No prayer score, streak, leaderboard, urgency rank, mission-priority score, session history, or completion metric is added.
- Existing latest-only prayer timestamps remain the only optional prayer-practice activity datum.
- Rotation remains derived from the current local prayer list.
- Guided prayer-session plans remain temporary page state.
- Saved people and prayer-list persistence behavior is unchanged by this phase.

## Certification

### Production build gate

`scripts/prayer/phase12-release-check.ts` verifies:

- Prayer library progressive disclosure exists and the old 60-record ceiling is absent.
- Focused prayer exposes Short / Standard / Extended with 3 / 5 / 7 prompts.
- Pseudo-time labels and seconds-per-prompt wording are absent from the focused-prayer UI.
- My lists policy notes and Recent are disclosure-based.
- Prayer-session naming is consistent.
- The Phase 12 stylesheet is loaded.

The gate is part of `npm run prayer:check`, therefore part of the blocking production build.

### Browser certification

`tests/e2e/phase12-prayer-saved.spec.ts` verifies:

1. Focused prayer changes the rendered prompt flow from 5 to 3 to 7 prompts through Standard / Short / Extended controls and exposes no minute-mode UI.
2. A synthetic 55-record eligible Prayer corpus initially renders 24, then 48, then all 55 records with explicit progress.
3. My lists keeps storage-policy disclosures and Recent closed by default and allows Recent to be opened normally.

## Exit criterion

Phase 12 is complete when production CI and browser certification pass on the PR head and the branch is merged to `main`.
