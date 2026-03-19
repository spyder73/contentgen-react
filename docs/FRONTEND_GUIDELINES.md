# Frontend Coding Guidelines

Cross-cutting rules: see `/docs/CODING_GUIDELINES.md`.

## File Size Discipline
- Target: Max **100-200 lines of code per source file**.
- For React components/hooks that exceed this, split by concern (UI, state, API mapping) before adding new behavior.

## React Rules
- Reuse `src/components/ui/` primitives before creating new buttons, badges, inputs, cards.
- State flows through hooks. Avoid prop drilling beyond 2 levels.
- Derive UI state from backend responses - don't maintain parallel local state.

## Type Parity
- Frontend types must match backend Go structs exactly.
- If mismatch found: fix code to match contract, note in `docs/results.md`.
- When backend adds/renames a field, frontend types update in the same wave.

## Tests
- `npm run build` must compile with zero TS errors.
- `npm test` when Jest harness is stable. Mock API calls, never hit real backend.