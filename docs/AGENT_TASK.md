# Frontend Agent Task

## Start Here
- Keep this existing repository. Do not create a new repository.
- Work on one task branch at a time: `codex/frontend-<task>`.
- Keep each PR scoped to one theme (UI, contract integration, or test harness).

## Repository Bootstrap
1. `git checkout <default-branch>`
2. `git pull --ff-only`
3. `git checkout -b codex/frontend-<task>`
4. Run baseline checks.
5. Commit only scoped changes.
6. Push branch and open PR.

## Create Branch
- Example: `git checkout -b codex/frontend-schema-clipstyles`

## Run Baseline Checks
- `npm run build`

## Definition of Done for This Repo
1. Implementation complete for scoped task.
2. `npm run build` passes.
3. Frontend API contract usage only through `src/api/*`.
4. Frontend docs updated (`docs/API.md`, `docs/UI.md` when relevant).
5. Cross-repo contract impacts reflected in root `docs/API_CONTRACTS.md`.

## Handoff Format
- Change: `<what changed>`
- Contract impact: `<none|list>`
- Consumer action: `<repo + exact step>`
- Validation: `<commands + result>`
- Rollback: `<revert branch/PR + side effects>`

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
- migration away from current React stack.
- introducing unrelated feature work.

## Risks
- backend contract changes landing out of order.
- style schema lacking UI hint metadata in early iteration.
- websocket event naming differences causing stale refresh behavior.
