# Coding Guidelines

## Intent
Use consistent, senior-level engineering style across backend, frontend, registry, and revideo.
Priorities:
- readable and maintainable code
- explicit contracts
- low redundancy
- small, focused files and functions

## Core Rules
1. Keep files compact.
   - target: 100-200 lines for code files where practical
   - exceptions allowed for schema definitions, and files where you really think it is more beneficial for a human to have a bit more code in here than to split it into multiple files
2. Use meaningful names.
   - avoid single-letter variables except local loop counters
   - name functions by behavior, not implementation detail
3. Keep functions focused.
   - one clear responsibility per function
   - split large orchestration into small private helpers
4. Avoid duplication.
   - pull shared parsing/validation into utility layers
   - do not duplicate schema contracts across services
5. Comment sparingly.
   - comment non-obvious behavior and invariants
   - avoid obvious line-by-line commentary

## Contract-First Rules
1. Any public route change requires explicit request/response contract update.
2. Registry is source of truth for:
   - model constraints
   - clipstyle field requirements
3. Frontend must render model settings from constraints schema, not hardcoded per-model fields.
4. ReVideo payload shape must be stable and documented before style handler changes.

## Error Handling
- Prefer explicit validation errors over silent fallback when user action is required.
- Allow permissive fallbacks only where network dependency is optional and behavior is documented.
- Keep error messages user-actionable.

## Testing Expectations
- Every bug fix needs a regression test where feasible.
- Do not call external AI services in unit tests.
- Keep test suites deterministic and fast.
- Required baseline checks per repo are defined in `docs/CI_CD_SETUP.md`.

## Repository Addenda

### Backend (Go)
- Keep handler layer thin; business logic belongs in domain/service packages.
- Keep request parsing and validation explicit in handlers.
- Preserve clear separation:
  - `internal/api/*` for transport
  - `internal/pipeline/*` for orchestration
  - `pkg/*` for integrations
- Prefer typed structs over `map[string]interface{}` except intentionally dynamic metadata paths.

### Frontend (React + TS)
- Keep API access centralized under `src/api`.
- Keep UI components mostly presentational; put processing logic in helpers/hooks.
- Use strict TS interfaces for payloads and schema field handling.
- Avoid style-specific hardcoding where schema-driven rendering is possible.

### Registry (FastAPI)
- Keep routers thin and deterministic.
- Keep catalog and constraint builders pure and testable.
- Validate shape changes with tests in `tests/test_models.py` and `tests/test_clipstyles.py`.
- Avoid speculative providers; document only implemented endpoints.

### ReVideo (TS)
- Keep style handlers isolated per style.
- Validate required metadata fields before rendering.
- Keep render output contract stable (`{ clip_id, files[] }`).
- Avoid hidden side effects in handler registration.

## Documentation Rules
- Keep docs compact and operational.
- Prefer source-of-truth references over duplicated long sections.
- Mark known drift explicitly; do not hide inconsistencies.
- No speculative “planned” statements for already implemented behavior.

## Branch and PR Rules
- Use service-local branches: `codex/<repo>-<task>`.
- One task theme per PR.
- Include test/check output summary in PR description.
- Update docs in same PR when contracts change.

## External References
Workflow inspiration used for concise, implementation-oriented docs:
- Peter Steinberger: [Just Talk To It](https://steipete.me/posts/2025/just-talk-to-it)
- Peter Steinberger: [Shipping At Inference-Speed](https://steipete.me/posts/2025/shipping-at-inference-speed)
