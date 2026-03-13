# Pipeline Editor Contract Cleanup And Selector Refactor

## Goal
Clean up and refactor the `contentgen-react` pipeline editor and pipeline-facing API/types layer so it matches the backend as it exists now.

This work is specifically focused on:
- per-checkpoint provider/model selection
- generator `mode`
- pipeline output format editing inside the pipeline editor
- removing duplicated code, stale contract branches, and unnecessary frontend validation

Do not change backend code as part of this work.

## Backend Source Of Truth
Use the backend as it exists now, especially:
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-go-backend/docs/PIPELINE.md`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-go-backend/docs/API.md`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-go-backend/internal/pipeline/types.go`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-go-backend/internal/pipeline/validation.go`

Frontend must match the current backend contract:
- prompt checkpoints use `promptGate.provider` / `promptGate.model`
- distributor checkpoints use `distributor.provider` / `distributor.model`
- generator checkpoints use `generator.provider` / `generator.model` / `generator.mode`
- connector strategy is `collect_all`
- pipeline output format uses one canonical `long_edge`
- final clip payload compatibility still uses `reference_image_url`

## In Scope
1. Refactor frontend pipeline structs to match the backend checkpoint and output-format structs exactly.
2. Refactor the pipeline API normalization/serialization layer to emit backend-valid payloads only.
3. Refactor the pipeline editor so each checkpoint type edits the correct nested config object.
4. Add a persistent `Final Clip Generation Settings` section inside the pipeline editor.
5. Ensure checkpoint model/provider selectors and model-settings UI fit cleanly inside the modal/editor width without horizontal overflow or awkward nested scrolling.
6. Remove duplicate code and unnecessary validation in touched pipeline-facing frontend files.
7. Keep final clip reference-image assembly canonical and deduplicated.

## Out Of Scope
1. Backend implementation changes.
2. Broad app-wide dedupe outside pipeline-facing code.
3. Unrelated visual redesigns.
4. Scheduler, auth, or non-pipeline frontend work.
5. Changing the current backend contract to match older root docs.

## Required Frontend Contract Changes
Update `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/api/structs/pipeline.ts` so it matches backend reality.

### PipelineOutputFormat
Canonical fields:
- `aspect_ratio`
- `long_edge`
- `image_provider`
- `image_model`
- `image_settings`
- `video_provider`
- `video_model`
- `video_settings`
- `audio_provider`
- `audio_model`
- `audio_settings`

Remove stale frontend-only fields:
- `enabled`
- `image_long_edge`
- `video_long_edge`
- `fps`
- `video_duration`
- `chat_provider`
- `chat_model`

### CheckpointConfig
Canonical nested ownership:
- prompt checkpoint provider/model live under `promptGate`
- distributor checkpoint provider/model live under `distributor`
- generator checkpoint provider/model/mode live under `generator`
- connector strategy lives under `connector`

Remove root-level checkpoint selector ownership from the canonical shape:
- do not use `checkpoint.provider`
- do not use `checkpoint.model`

### GeneratorConfig
Must include:
- `media_type`
- `role`
- `mode`
- `provider`
- `model`

### ConnectorConfig
Only supported strategy:
- `collect_all`

### Attachment Types
Include backend-used fields where missing or inconsistently normalized:
- `role`
- `scene_id`
- `frame_order`
- `size`
- `generated_from_checkpoint_id`

## Implementation Plan

### 1. Refactor pipeline API normalization
Primary file:
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/api/pipeline.ts`

Actions:
- split transport code from normalization/sanitization code
- keep one canonical serializer/deserializer path
- normalize old frontend payloads only as migration input on read
- emit backend shape only on save/update/create
- remove stale outgoing aliases where backend already has one canonical field

Specific cleanup:
- remove stale output-format fallback logic for `image_long_edge` / `video_long_edge`
- remove stale root-level checkpoint provider/model write paths
- reduce duplicated normalization helpers by extracting shared pipeline-boundary helpers

### 2. Refactor checkpoint config editing
Primary files:
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/pipeline/PipelineEditor.tsx`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/pipeline/CheckpointPanel.tsx`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/pipeline/utils.ts`

Actions:
- build one checkpoint factory per checkpoint type
- centralize default checkpoint creation
- centralize nested config updates
- remove duplicate per-type default logic spread across editor and panel

Checkpoint editing rules:
- prompt checkpoint selector writes to `promptGate.provider/model`
- distributor checkpoint selector writes to `distributor.provider/model`
- generator checkpoint selector writes to `generator.provider/model`
- generator mode selector writes to `generator.mode`
- connector strategy is fixed to `collect_all`

### 3. Add Final Clip Generation Settings to the editor
Primary file:
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/pipeline/PipelineEditor.tsx`

Actions:
- render a dedicated section named `Final Clip Generation Settings` inside the pipeline editor
- keep this section visible within the main editor pane, not hidden behind the “no checkpoint selected” state
- allow editing:
  - `aspect_ratio`
  - `long_edge`
  - image default provider/model/settings
  - video default provider/model/settings
  - audio default provider/model/settings

Behavior:
- this section should remain accessible while editing checkpoints
- selected checkpoint details should render below it or alongside it without making the editor awkward to use
- the section replaces the current pipeline-output-format handling that is tied to the empty-selection state

### 4. Simplify and split CheckpointPanel
Primary file:
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/pipeline/CheckpointPanel.tsx`

Split into focused pieces:
- checkpoint basics
- input mapping editor
- prompt settings
- distributor settings
- connector settings
- generator settings
- required assets editor
- flags section

Rules:
- no duplicate string/number coercion helpers inside the sections
- no duplicate nested update logic
- no unsupported connector branches
- generator UI must explicitly expose `mode`

### 5. Make selector UI fit the modal/editor width
Primary files:
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/selectors/CheckpointProviderSelector.tsx`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/ui/Dropdown.tsx`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/modals/Modal.tsx`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/selectors/ModelSettingsModal.tsx`

Actions:
- remove width behavior that allows dropdowns to expand to `w-max` past the editor/modal width
- keep selector controls bounded to the available container width
- use truncation and stacked layout where necessary
- allow only the options list to scroll, not the whole selector row horizontally
- increase model settings modal size responsively when needed, but keep it vertically manageable

Acceptance for layout:
- no horizontal scrolling needed to use provider/model selectors
- no nested modal flow introduced for checkpoint selection
- model settings inputs stay readable within the modal width

### 6. Remove unnecessary frontend validation
Primary files:
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/pipeline/PipelineEditor.tsx`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/api/pipeline.ts`

Actions:
- remove stale validation that duplicates backend contract checks without adding useful UX
- keep only minimal editor-side validation that prevents obviously broken local state

Safe to remove or reduce:
- stale connector strategy validation for unsupported values
- stale root-level provider/model consistency checks
- output-format toggle validation tied to nonexistent backend fields
- redundant generator pre-save checks if the UI already constrains available values and backend save errors are surfaced clearly

Keep:
- required checkpoint id/name on create
- basic input-mapping edit sanity when needed for usability
- clear display of backend save errors

### 7. Deduplicate final clip reference assembly
Primary files:
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/api/clip.ts`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/ideas/idea-generator/assemblyPayload.ts`

Actions:
- extract one shared helper for canonical reference-image payload cleanup
- strip legacy `outputSpec.referenceImages` and `output_spec.reference_images`
- write `metadata.reference_image_url`
- preserve scene ordering for `aiVideoPrompts`
- preserve first-image fallback for `imagePrompts`

Do not maintain multiple parallel reference-image cleanup implementations.

## Files To Audit Closely For Redundant Code
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/api/pipeline.ts`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/api/clip.ts`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/pipeline/PipelineEditor.tsx`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/pipeline/CheckpointPanel.tsx`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/pipeline/PipelineOutputFormatPanel.tsx`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/pipeline/utils.ts`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/selectors/CheckpointProviderSelector.tsx`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/ui/Dropdown.tsx`
- `/Users/dorian/Generator/contentgen-docker-master/contentgen-react/src/components/selectors/ModelSettingsModal.tsx`

## Tests
Update or add tests for:

### API tests
- pipeline template save emits `long_edge` only
- generator checkpoints emit `generator.provider/model/mode`
- prompt checkpoints emit `promptGate.provider/model`
- distributor checkpoints emit `distributor.provider/model`
- connector checkpoints emit only `collect_all`

### Editor tests
- `Final Clip Generation Settings` renders in the pipeline editor
- final generation settings remain accessible while a checkpoint is selected
- generator mode persists correctly
- checkpoint selectors write to the correct nested config objects

### Layout tests
- dropdown selector width stays bounded within the modal/editor
- unsupported model/provider states do not overflow the container

### Clip assembly tests
- `reference_image_url` remains canonical
- legacy reference image arrays are stripped
- scene ordering is preserved for video prompts

## Acceptance Criteria
1. Frontend pipeline structs match current backend structs.
2. Every checkpoint type edits its provider/model in the correct backend-owned location.
3. Generator checkpoints support explicit `mode` editing.
4. `Final Clip Generation Settings` exists inside the pipeline editor.
5. Selectors fit cleanly inside the modal/editor without forcing horizontal scrolling.
6. Redundant code and unnecessary validation are removed from touched pipeline-facing files.
7. Final clip payload assembly remains compatible and uses `reference_image_url`.

## Notes For A Fresh Context
- Do not implement against the older root docs if they conflict with backend code.
- Treat backend code and backend repo docs as the real contract.
- Focus on cleanup and refactor, not feature expansion.
- If a duplicated helper is unrelated to the pipeline/editor/API surface, leave it alone.
