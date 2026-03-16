# Frontend UI Brief

## Component Tree Overview
- `src/App.tsx`
  - Header + global provider/model selectors + user menu
  - Left panel: ideas/pipeline generation
    - `components/ideas/IdeasList.tsx`
    - `components/ideas/IdeaGeneratorPanel.tsx`
    - `components/ideas/PipelineRunItem.tsx`
    - `components/ideas/pipeline-run/*`
  - Right panel: clip editing/output
    - `components/clips/ClipPromptsList.tsx`
    - `components/modals/EditClipPromptModal.tsx`

## Shared UI Primitives
- Reuse `src/components/ui/*` before introducing new custom controls.
- Common primitives:
  - `Button`, `Input`, `TextArea`, `Select`, `Dropdown`
  - `Badge`, `Card`, `Thumbnail`, `ExpandableSection`

## Key Data Flows
1. Start pipeline run
- `IdeaInputForm` collects input + attachments.
- Calls `PipelineAPI.startPipeline()`.
- Run state updates through `usePipelineRuns` polling + WebSocket-triggered refresh.

2. Pipeline checkpoint progression
- `PipelineRunItem` renders checkpoint progress.
- `CheckpointList` supports continue/regenerate/inject/attach actions.
- Required asset validation is evaluated from normalized checkpoint requirements.
- Run header and checkpoint cards now show effective provider/model context (`pipeline default`, `run default`, `checkpoint-specific`, or `generator config`) for in-UI execution visibility.
- Pipeline editor treats generator checkpoints as media-production steps (not prompt-authoring steps):
  - provider/model overrides are checkpoint-level fields (`checkpoint.provider`, `checkpoint.model`)
  - generator config focuses on media semantics (`media_type`, role/source/state)
- Generator checkpoints with `media_type=image` now expose explicit image mode:
  - `Image-to-Image Generator` (seed/reference required),
  - `Text-to-Image Generator` (no seed/reference).
- Image mode controls seed-compatible model filtering in provider/model selectors (img2img filters to models with seed support from constraints).
- Generator prompt-source UX is explicit:
  - mappings are guided to `initial_input` or prior checkpoint output sources
  - empty mappings are only valid when `requires_confirm` is enabled (manual prompt entry path)
- Pipeline editor save failures now render inline actionable error state instead of silent unsaved status.
- Checkpoint result surfaces render media previews whenever attachments exist, even if attach/edit controls are disabled for that checkpoint.

3. Run-to-clip assembly
- Completed runs enter explicit assembly workspace in `IdeaGeneratorPanel`.
- Scene reference mapping is produced via `sceneReferenceMapping` helpers.
- Clip payloads map references to `metadata.reference_image_url` on prompt rows.

4. Clip prompt editing
- `EditClipPromptModal` loads clipstyle schemas and renders metadata fields dynamically.
- Music binding is edited here (single source of truth in UI).

## Real-Time Events
- WebSocket handling: `src/hooks/useWebSocketEvents.ts`.
- Known pipeline lifecycle events are handled explicitly (no blanket unknown-event refreshes).
- Pipeline lifecycle events are toast-only and do not trigger full idea/clip list refetches.
- Clip list refresh remains scoped to render/run-update events.

## Media Preview UX (Wave 4E4)
- Attachment library preview resolves image/video/audio candidates from backend preview fields and metadata aliases with deterministic fallback order.
- Video browse rows render poster/fallback tiles (avoids browser decode artifacts), while detail panels keep playable video preview with explicit unavailable/open-file fallback.
- Media preview URLs now support both absolute URLs and backend-relative file paths.
- Output gallery video player uses a custom non-emoji play control with clearer progress affordance and failure fallback CTA.
- Output carousel/video navigation ignores transient placeholder URLs and dedupes repeated URLs during rerender cycles.

## Primary File Locations
- Ideas domain: `src/components/ideas/`
- Clips domain: `src/components/clips/`
- Modals: `src/components/modals/`
- Shared UI primitives: `src/components/ui/`
- API clients/contracts: `src/api/`
- Runtime hooks: `src/hooks/`

