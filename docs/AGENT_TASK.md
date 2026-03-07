# Frontend Agent Task

## Status
ACTIVE

## Wave
Wave 4B2-HF1: attachment workspace restructure + injection mode clarity

## Reasoning Level
- Baseline: `HIGH`
- Escalate to `VERY HIGH` equivalent care for:
  - mixed backend contract compatibility (`/media/library/*` vs legacy routes)
  - paused checkpoint inject/regenerate flow correctness
  - state model decisions for regeneration context persistence
- De-escalate to `MEDIUM` for:
  - visual polish and non-contractual layout refinements

## Goal Alignment
Deliver an attachment-first UX that matches product direction: browse reusable media, attach at start or checkpoint, inject guidance while paused, and make regeneration context behavior explicit.

## User Feedback To Implement
1. Upload and attach should be a first-class action, not hidden.
2. File explorer should support grouped browsing (`audio`, `video`, `image`) with clear names/previews.
3. During paused checkpoints, user must clearly choose regeneration behavior:
   - guidance only
   - guidance + prior output context (chat-like continuity)
4. Frontend should support both context behaviors and surface which one is active.

## Required Local Standards
- Follow and maintain `docs/CODING_GUIDELINES.md` for this repo while implementing this wave.

## Priority Tasks
1. Attachment entry-point restructure:
   - add a visible `Attach Files` action in the primary controls area (placement can be finalized in implementation, but must be obvious in both desktop and mobile).
   - keep drag/drop and file picker available.
2. File explorer redesign:
   - implement explorer view with explicit type groups/tabs: `audio`, `video`, `image`.
   - each row/card must show filename, type, and stable `media_id`; include lightweight preview where practical.
   - include quick attach actions for initial run and checkpoint-level attach.
3. API compatibility hardening:
   - list route strategy: prefer `GET /media/library`, fallback to legacy `GET /media`.
   - upload route strategy: prefer `POST /media/library/upload`, fallback to legacy `POST /media/upload`.
   - show actionable inline errors for `405` and `413` (not generic failure text).
4. Checkpoint injection UX and mode controls:
   - inject payload must be backward-compatible during migration (send the field set needed to satisfy both old/new backend parsers).
   - add explicit mode control:
     - `Guidance only`
     - `Guidance + prior output context`
   - preserve paused flow: inject -> regenerate -> continue, with clear status and error states.
5. Regression safety:
   - keep required-asset gating, generated-output reuse, replace-media behavior, and scheduling flows stable.
6. Revalidation directive:
   - explicitly re-check orchestrator-touched docs and classify each as `VALID`, `NEEDS FIX`, or `REVERT` in `docs/results.md`.

## Mandatory Validation Pass
1. Run and record:
- `npm test -- --watchAll=false`
- `npm run build`
2. Add/extend tests for:
- route fallback behavior (`/media/library/*` -> legacy fallback)
- attachment explorer grouping/filtering and stable ID selection
- paused checkpoint injection mode selection and payload mapping
- `405`/`413` user-facing error handling
- regression coverage for schedule platform/caption and replace-media flows

## Required Docs Updates
- Update `docs/API.md` and `docs/UI.md` to document:
  - dual-route compatibility behavior
  - injection mode options and payload semantics
  - final placement/interaction model for `Attach Files`
- Update `docs/results.md` with:
  - behavior matrix for new explorer + checkpoint attach flows
  - compatibility matrix for route fallback outcomes
  - revalidation verdicts (`VALID`/`NEEDS FIX`/`REVERT`)
  - command outcomes
  - manual QA notes for desktop + mobile

## Definition of Done
1. Attachment workspace is clearly discoverable and supports grouped explorer browsing (`audio`, `video`, `image`).
2. Frontend handles both media-library and legacy media routes without breaking uploads/listing.
3. Paused checkpoint injection offers explicit mode choice and works end-to-end.
4. Regressions are covered by tests and required checks pass.
