# Frontend Agent Task

## Status
ACTIVE

## Wave
Wave 2A: visual redesign pass (no IA reset).

## Start Here
- Keep this existing repository. Do not create a new repository.
- Work on one task branch at a time: `codex/frontend-<task>`.
- Keep each PR scoped to one theme (visual redesign + light UX polish).

## Repository Bootstrap
1. `git checkout <default-branch>`
2. `git pull --ff-only`
3. `git checkout -b codex/frontend-<task>`
4. Run baseline checks.
5. Implement scoped changes.
6. Update `docs/results.md`.
7. Commit, push, and open PR.

## Create Branch
- Example: `git checkout -b codex/frontend-visual-redesign`

## Run Baseline Checks
- `npm run build`
- `npm test -- --watchAll=false`

## Feature Tests (Required)
- For every new feature/behavior change, add or update automated tests.
- Prefer component/API helper tests; avoid snapshot-only coverage.
- If test coverage is blocked by harness/tooling, document blocker + mitigation in `docs/results.md`.

## Results Log (Required)
- Keep `docs/results.md` updated on every iteration and commit.
- Record: summary, changed files, checks run (with pass/fail), current blockers, next fix step.
- Do not mark task complete until `docs/results.md` shows all required checks green.

## GitHub Completion Rule (Required)
- When scoped work is complete and checks are green, commit final changes on the `codex/...` branch.
- Push the branch to GitHub and open a PR.
- Include branch name and PR link in `docs/results.md`.

## Definition of Done for This Repo
1. Implementation complete for scoped task.
2. `npm run build` passes.
3. `npm test -- --watchAll=false` passes (or blocker documented in `docs/results.md`).
4. Frontend API usage remains through `src/api/*`.
5. `docs/results.md` is up to date.
6. New/changed behavior is covered by automated tests.
7. Branch is pushed and PR is opened.

## Handoff Format
- Change: `<what changed>`
- Contract impact: `<none|list>`
- Consumer action: `<repo + exact step>`
- Validation: `<commands + result>`
- Rollback: `<revert branch/PR + side effects>`
- GitHub: `<branch + PR link>`

## Objective
Deliver a clean black/white typewriter-style visual redesign with subtle animations while keeping current information architecture and functionality.

## Current State Facts
- Core flow and component structure already work.
- Clipstyle schemas and options are API-driven.
- Frontend must remain contract-compatible with backend/registry responses.

## Priority Tasks
1. Visual system:
   - Introduce a coherent black/white minimal look.
   - Use typewriter-style typography.
   - Remove emoji usage from core UI labels/icons.
2. Layout and hierarchy polish (without IA reset):
   - Keep existing panels/workflow.
   - Improve spacing, contrast, and readability.
3. Motion:
   - Add subtle, meaningful animations (entry/stagger/hover/modal transitions).
   - Keep motion lightweight and non-distracting.
4. API-driven UI consistency:
   - Keep clipstyle rendering API-driven (no local schema/style fallback reintroduction).
5. Quality:
   - Verify desktop + mobile behavior.
   - Add/update tests for changed interaction behavior.

## Non-Goals
- Full component architecture rewrite.
- Backend contract changes.
- New business features (auth, telegram, lora, credits, etc.).

## Risks
- Introducing visual changes that reduce readability/accessibility.
- Accidental reintroduction of hardcoded clipstyle behavior.
