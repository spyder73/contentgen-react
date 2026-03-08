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
- run attachment browser with primary `Add Files To Run` entrypoint, requirement-aware visibility, and stable `media_id` binding.
- media upload intake now uses a square black attach tile with centered plus icon and combined click + drag/drop handling.
- media browse rows/details include lightweight image/video/audio previews plus selected-file preview cues in run attachment summaries.
- paused checkpoint additive prompt-injection controls with explicit mode selection (`Guidance only` vs `Guidance + prior output context`) and inline error messaging.
- pipeline manager flow differentiates `chain` checkpoints visually and displays sub-checkpoint counts.
- run cards show per-run/per-clip pricing summaries from backend `cost_summary`, including estimated-cost labeling.
- real-time refresh via websocket.

## UX Debt
1. Event feedback is generic; action-level progress context is thin.
2. Large cards can feel cluttered during multi-clip runs.
3. Clipstyle schema payloads are not yet fully standardized across backend versions.

## Redesign Direction (Current Phase)
- keep existing IA and component boundaries.
- improve clarity with explicit sections and progressive disclosure.
- avoid full visual rewrite before contract cleanup lands.

## Attachment Interaction Model (Wave 4C4)
1. Primary controls row includes `Attach Files` so upload/attach is first-class on desktop and mobile.
2. Attach browser visibility is requirement-driven:
   - shown when selected pipeline/checkpoints allow attachments or declare required assets
   - hidden when selected pipeline has no attachment requirements
3. Missing required checkpoint assets are highlighted inline with direct `Open Attach Browser` CTA.
4. Upload tab intake is intentional:
   - custom square plus tile (no browser-native file-panel styling)
   - same tile supports click-to-open picker and drag/drop
   - selected file preview is shown immediately
5. Browse tab supports preview-first scanning:
   - row-level preview chips/cards and detail-panel media preview
   - manage mode keeps rename/context/remove controls
   - select mode hides edit/remove controls and shows guidance hint
6. Media list/upload/rename inline errors are actionable:
   - `405`: route/method unavailable
   - `413`: upload size exceeded
   - duplicate rename conflict: explicit “name already exists” guidance
7. Music attachment UX is picker-only in this wave:
   - clip edit modal no longer shows `Attach music from URL`
   - audio is selected from media-library options only

## Run-To-Clip Continuity (Wave 4D1)
1. Completed pipeline runs now transition directly into clip-prompt creation flow.
2. Run workspace state is reset on completion:
   - completed run cards are removed from active run surface
   - run attachment selection modal state is closed/reset
3. Clip panel is refreshed immediately after successful clip-prompt creation from run output.

## Clip Prompt Provenance Panel (Wave 4D1)
1. `EditClipPromptModal` now shows `Inherited Attachments` section with:
   - attachment name/type
   - role label (`reference`/`audio`/`music`)
   - source label (`uploaded`/`generated`/other)
   - origin checkpoint label when available
2. Inherited audio entries can be applied to music binding via inline `Use Music`.
3. Generated inherited entries can be toggled into clip `reference_assets` via `Use as Ref`/`Unmark Ref`.

## Music Binding UX (Wave 4D1)
1. Music selector options now merge:
   - media-library audio options
   - inherited provenance audio
   - existing clip audio rows
2. Auto-bound music from run metadata remains visible even if missing from current media API list.
3. Missing-option fallback row (`Current selection (...)`) keeps binding deterministic and editable.

## Generated Artifact Reuse Labeling (Wave 4D1)
1. Attach browser now keeps generated artifacts visible even when they only have synthetic IDs.
2. Browse rows/details show generated origin context:
   - source checkpoint name/id (when available)
3. Generated synthetic assets stay selectable for new runs; payload generation omits fake `media_id` and uses URL/metadata fallback.

## Chain Sub-Checkpoint MVP Editor (Wave 4D1)
1. Chain checkpoints now expose editable sub-checkpoint rows inside checkpoint panel.
2. Supported per-sub-checkpoint fields:
   - type
   - prompt/config text
   - output role label
   - ordering (Up/Down)
3. Add/remove flow is inline and save serialization keeps ordered `sub_checkpoints` and compatibility `checkpoints` mirrors.

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
