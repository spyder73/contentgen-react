# Frontend Agent Task

## Objective
Reduce UI/API drift and move configuration surfaces to schema-driven rendering.

## Current State Facts
- Model settings modal is already dynamic from constraints fields.
- Clipstyle editing is still hardcoded via `src/clipStyles/*`.
- Base API URL is fixed at `http://localhost:81`.
- WebSocket event handling works but event taxonomy is partly legacy.

## Priority Tasks
1. Replace hardcoded clipstyle field rendering with API-driven schemas.
2. Replace static style option list with backend-provided style list.
3. Resolve clip metadata route mismatch (`/clips/:id/metadata`) with backend contract.
4. Improve checkpoint editor UX by replacing prompt-based inputs.
5. Stabilize test harness for CI-required frontend tests.

## Non-Goals
- full visual redesign in this task wave.
- migration away from current React stack.
- introducing unrelated feature work.

## Acceptance Checks
- `npm run build` passes.
- schema-driven clipstyle form path works for `standard`, `genericCarousel`, and `medieval` policy.
- no direct component-level fetch calls bypassing `src/api/*`.
- API docs updated for any request/response changes.

## Risks
- backend contract changes landing out of order.
- style schema lacking UI hint metadata in early iteration.
- websocket event naming differences causing stale refresh behavior.

## Handoff Requirements
If frontend introduces or depends on contract changes:
1. update `docs/API.md`
2. update root `docs/API_CONTRACTS.md`
3. list expected backend/registry changes in PR notes
