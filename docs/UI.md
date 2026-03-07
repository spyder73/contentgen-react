# Frontend UI Brief

## Objective
Improve usability while preserving current generation workflow.
Shift from hardcoded configuration forms to schema-driven rendering where possible.

## Current UI Architecture
Main layout in `App.tsx`:
- left: ideas/pipeline generation
- right: clips/media editing and render outputs
- top header: provider/model selectors + user/account controls

Key component domains:
- `components/ideas/*`
- `components/clips/*`
- `components/pipeline/*`
- `components/selectors/*`

## What Already Works
- dynamic model settings modal built from backend constraints fields.
- provider/model selection with constraints prefetch.
- pipeline run controls with pause/continue/regenerate flow.
- real-time refresh via websocket.

## UX Debt
1. Event feedback is generic; action-level progress context is thin.
2. Large cards can feel cluttered during multi-clip runs.
3. Clipstyle schema payloads are not yet fully standardized across backend versions.

## Redesign Direction (Current Phase)
- keep existing IA and component boundaries.
- improve clarity with explicit sections and progressive disclosure.
- avoid full visual rewrite before contract cleanup lands.

## Schema-Driven Form Strategy
Priority: clipstyle metadata forms.

Target flow:
1. frontend fetches clipstyle schema from backend passthrough routes.
2. style selector renders available styles from API, not hardcoded list.
3. edit modal renders clip metadata fields from schema metadata.
4. only style-specific presentation rules remain local.

Model settings path is already schema-driven and should remain the pattern.

## Component Priorities
1. `EditClipPromptModal`
   - consume normalized schema from `/clipstyles/:style/schema`.
2. `ClipStyleSelector`
   - consume options from `/clipstyles`.
3. pipeline editor
   - replace prompt-based add flow with explicit modal form.
4. websocket notifications
   - map event names to precise, user-readable progress messages.

## Accessibility and Clarity Rules
- keep labels explicit and tied to API field names where relevant.
- show defaults and ranges for constrained numeric fields.
- show validation errors inline before submission.
- avoid hidden auto-mutations of user text except normalized array fields.

## Non-Goals
- new design system migration.
- animation-heavy redesign.
- introducing deep routing/state framework changes.

## Acceptance Criteria
- no hardcoded clipstyle field definitions required for standard flow.
- user can create/edit clips using API-provided style schemas.
- pipeline and clip actions remain at most two clicks from current cards.
- build passes (`npm run build`) and behavior parity is preserved.

## Follow-up
After contract cleanup and schema-driven forms are stable, evaluate full UX redesign pass.
