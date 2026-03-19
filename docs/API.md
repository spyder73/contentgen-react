# Frontend API Layer

## Purpose
`src/api/*` is the only intended backend/registry interaction layer for the UI.
Base URL is currently `http://localhost:81` from `src/api/helpers.ts`.

## Core Modules
- `clip.ts`: clip CRUD, clip ideas, create-from-pipeline-output.
- `media.ts`: media CRUD, media-library list/upload/rename, regenerate, metadata edits.
- `pipeline.ts`: pipeline runs + template CRUD + prompt template CRUD + checkpoint injection.
- `models.ts`: model discovery + constraints retrieval.
- `external.ts`: users, accounts, schedule.

## Key Contracts

### Models and Constraints
- frontend calls backend `GET /models` and `GET /models/:id/constraints`.
- response is mapped into UI field schema used by `ModelSettingsModal`.
- constraints are modality-specific (`image`, `video`, `audio`).

### Pipeline Start
`PipelineAPI.startPipeline(...)` sends:
```json
{
  "template_id": "...",
  "initial_input": "...",
  "auto_mode": true,
  "initial_attachments": [
    {
      "type": "image",
      "source": "media|generated|url|file",
      "media_id": "uuid-or-stable-id",
      "url": "https://...",
      "name": "asset-name",
      "filename": "asset-name",
      "checkpoint_id": "optional-checkpoint-id",
      "checkpoint_index": 1,
      "source_checkpoint_id": "optional-origin-checkpoint-id",
      "source_run_id": "optional-origin-run-id",
      "metadata": {
        "asset_pool_id": "..."
      }
    }
  ],
  "music_media_id": "optional-media-id",
  "provider": "openrouter",
  "model": "...",
  "media_profile": {
    "image": { "provider": "...", "model": "..." },
    "video": { "provider": "...", "model": "..." }
  }
}
```

### Attachment Pool and Checkpoint Binding Mapping
- asset pool entries are normalized into stable attachment payload rows in `PipelineAPI.startPipeline(...)`.
- checkpoint-bound selections are emitted as additive attachment rows with `checkpoint_id`/`checkpoint_index`.
- generated-output reuse bindings preserve origin tracing through additive fields:
  - `source_checkpoint_id`
  - `source_run_id`
- frontend keeps compatibility aliases in payload normalization (`name` + `filename`, `size_bytes` + `size`) to support mixed backend contract versions.

### Requirement-Driven Attach Visibility (Wave 4E4)
- run attach controls are shown only when selected pipeline checkpoints expose attachment intent:
  - `allow_attachments = true`, or
  - non-empty normalized required-asset rules.
- generate action is blocked only when start-time requirements (`source === "initial"`) are missing; UI renders checkpoint-level missing requirement details and opens attach browser directly from warning CTA.
- required-asset parsing preserves backend source semantics (`initial`, `user`, `checkpoint:<id>`) instead of collapsing them into generic media buckets.

### Paused Required-Asset Flow (Wave 4E4)
- paused checkpoints now distinguish:
  - `result.status === "awaiting_confirm"` for confirm/review flow
  - `result.status === "awaiting_asset"` for attach-and-continue flow
- when a checkpoint is asset-gated, the run-detail card:
  - shows backend missing-asset error text when present
  - exposes asset-pool attach UI even if `allow_attachments = false`
  - keeps `POST /pipelines/:id/attachments` and `POST /pipelines/:id/continue` as separate explicit actions
- frontend does not optimistically advance checkpoint state after attach; the run must refresh after continue succeeds.

### Connector Scene Reference Debug View (Wave 4E4)
- connector checkpoint output is parsed when possible.
- if parsed output includes `scene_references`, run detail renders ordered scene rows with resolved reference info instead of raw JSON.
- malformed or non-scene-reference connector output falls back to the raw JSON/debug view.

### Media Library Explorer Contract (Wave 4B2)
- `MediaAPI.listMediaLibrary(...)` calls `GET /media/library` and falls back to legacy `GET /media` on `404`/`405`.
- list responses are normalized into ID-first rows:
  - stable `media_id` (mirrored as `id` for UI selectors)
  - `type`, `name`, `source`, `mime_type`, `size_bytes`, optional `clip_id`
- `MediaAPI.uploadMediaLibraryFile(file, ...)` calls `POST /media/library/upload` (multipart) and falls back to legacy `POST /media/upload` on `404`/`405`.
- attachment workspace renders actionable inline upload/list errors for:
  - `405`: route/method not enabled for media list/upload
  - `413`: upload payload too large

### Media Preview URL Resolution (Wave 4E4)
- library rows and detail preview now resolve media preview candidates deterministically from backend fields (top-level + metadata aliases):
  - image-first keys: `preview_url`, `preview_image_url`, `thumbnail_url`, `thumb_url`, `image_url`
  - video-first keys: `preview_video_url`, `playback_url`, `stream_url`, `video_url`, `video_file_url`
  - audio-first keys: `preview_audio_url`, `audio_url`, `audio_file_url`
  - media URL fallback keys: `url`, `file_url`, `asset_url`, `uri`, `media_url`, `source_url`, `download_url`
- frontend retries alternate preview candidates on element decode/load failure before showing unavailable state.
- for video files with no playable candidate (or browser decode failure), UI renders explicit unavailable copy instead of broken media chrome.
- relative media paths now resolve against backend `BASE_URL` while absolute URLs remain unchanged.

### Output URL Stability (Wave 4E4 follow-up)
- output gallery now normalizes `file_urls[]` before carousel/video navigation:
  - trims and dedupes repeated URLs
  - removes transient placeholder rows (`waiting`, `pending`, `rendering`, `failed`, etc.)
  - clamps active index when output list shrinks during rerender/retry states

### Media Library Manage Contract (Wave 4C4)
- `MediaAPI.renameMediaLibraryItem(mediaId, name)` calls `PUT /media/library/:id/rename` and falls back to legacy `PUT /media/:id/rename` on `404`/`405`.
- rename payload sends additive compatibility fields:
```json
{
  "name": "new-file-name.ext",
  "new_name": "new-file-name.ext"
}
```
- duplicate rename conflicts are surfaced as actionable inline UI copy (`409` and duplicate-name backend messages).
- remove uses `DELETE /media/:id` (no frontend fallback route needed).

### Checkpoint Prompt Injection Contract (Wave 4B2)
- `PipelineAPI.injectCheckpointPrompt(runId, checkpointIndex, text, options)` calls:
  - `POST /pipelines/:id/checkpoints/:index/inject`
- request payload sends migration-safe compatibility fields for both parser generations:
```json
{
  "text": "Additive prompt guidance",
  "guidance": "Additive prompt guidance",
  "prompt": "Additive prompt guidance",
  "auto_regenerate": true,
  "source": "frontend_pause_checkpoint",
  "context_mode": "guidance_only|with_prior_output_context",
  "injection_mode": "guidance_only|with_prior_output_context",
  "include_prior_output_context": false,
  "include_context": false,
  "use_prior_output_context": false
}
```
- mode semantics in paused UI:
  - `guidance_only`: regenerate with additive prompt only
  - `with_prior_output_context`: regenerate with additive prompt plus prior output context
- response payload (normalized passthrough): `{ status, checkpoint_index, injection_count?, regenerated? }`
- UI flow uses inject + regenerate while paused and keeps explicit inline errors on failures.

### Checkpoint Type + Generator Semantics (Wave 4E2)
- checkpoint type union in frontend: `prompt`, `distributor`, `connector`, `generator`.
- generator checkpoint config is serialized under `checkpoint.generator` with:
  - `media_type`
  - `generator`
  - `role`
  - `source`
  - `state`

### Generator Image Mode Mapping (Wave 4E4-hotfix-2)
- for `generator` checkpoints where `generator.media_type = "image"`, editor mode is explicit:
  - `Image-to-Image Generator` => seed/reference mode
  - `Text-to-Image Generator` => no-seed mode
- payload remains backward-compatible (no new field); mode is expressed via existing `generator.role`:
  - img2img mode persists as seed/reference roles (default `reference_image`)
  - text2img mode persists as `generated_image`
- seed-compatibility model filtering is enabled only for img2img mode and uses registry constraints (`capabilities.supports_seed_image`) via existing model constraints API.

### Checkpoint Provider/Model Payload Normalization (Wave 4E5)
- template create/update payloads normalize checkpoint overrides before API write:
  - trims `checkpoint.id`, `name`, `prompt_template_id`, `provider`, `model`
  - removes empty string overrides (sends `provider`/`model` only when non-empty)
  - normalizes `input_mapping` to non-empty trimmed key/value pairs only
  - normalizes `required_assets[]` to non-empty rows only
- type-scoped config write rules:
  - `distributor` checkpoints write only normalized `checkpoint.distributor`
  - `connector` checkpoints write only normalized `checkpoint.connector`
  - `generator` checkpoints write normalized `checkpoint.generator` without mirroring model IDs into `generator.generator`
  - model IDs are canonicalized to `checkpoint.model`; if `generator.generator` matches the model ID it is stripped from outbound payload

### Generator Prompt Source Validation (Wave 4E5)
- generator checkpoints now treat prompt sourcing as explicit mapping:
  - allowed source values are `initial_input` and `checkpoint:<prior_checkpoint_id>[.field]`
  - mappings to non-prior checkpoints or unknown source prefixes are blocked at save-time
- manual prompt-entry path is restricted to confirmable generators:
  - if `requires_confirm=false`, at least one valid prompt source mapping is required
  - if `requires_confirm=true`, empty mapping is allowed and manual prompt guidance can be provided during checkpoint confirmation

### Pipeline Template Save Error Surface (Wave 4E5)
- pipeline editor save path now renders inline actionable error copy when template update fails.
- validation failures (generator prompt source rules) are surfaced before API write and keep unsaved state visible.

### Pipeline Default Model Serialization (Wave 4E4-hotfix)
- `output_format` defaults are now normalized on template create/update:
  - trims `image_provider`, `image_model`, `video_provider`, `video_model`, `audio_provider`, `audio_model`
  - empty strings are removed before API write
- these defaults apply only to final clip prompt rows; generator checkpoints use their own checkpoint config.

### Edit Media Modal Provider/Model Mapping (Wave 4E4-hotfix)
- edit-media save path (`PUT /media/:id`) now supports explicit provider/model override selection in UI:
  - sends `output_spec` with selected provider/model when set
  - sends `output_spec: undefined` when cleared to inherit clip/pipeline defaults
- metadata replacement contract (`PUT /media/:id/metadata/replace`) is unchanged.

### Run Pricing Display Contract (Wave 4C4)
- run payloads may include backend `cost_summary` with mixed provider schemas.
- frontend parser reads provider run/per-clip costs for `runware` and `openrouter` from:
  - top-level provider keys,
  - nested provider maps (`providers`, `per_run`, `per_clip`, `provider_costs`/`costs`/`pricing`),
  - optional `clips[]` aggregates when explicit per-clip fields are missing.
- estimated status is surfaced when backend flags estimated costs (`estimated`, `is_estimated`, and related aliases).
- fallback: if `cost_summary` is absent and run payload includes `cost.total_usd`, frontend renders a simple total USD line.

### Clip Create From Pipeline Output
`ClipAPI.createClipPromptFromJson(json, mediaProfile?)`:
- parses pipeline output JSON.
- injects fallback `outputSpec` from run-level `mediaProfile` into each media prompt where missing.
- normalizes prompt-level reference contract before `POST /clips`:
  - ensures `imagePrompts[*].metadata.reference_image_url` and `aiVideoPrompts[*].metadata.reference_image_url` are set when references are present
  - strips legacy `outputSpec.referenceImages`/`output_spec.reference_images` from prompt rows
  - uses `metadata.reference_assets[]` fallback when prompt rows do not already include a reference URL
- calls `POST /clips`.

### Run-Complete Clip Assembly Staging + Provenance (Wave 4D2)
- when a run reaches `completed`, frontend loads and stages clip-prompt output for explicit user-triggered assembly.
- automatic clip creation on run completion is disabled in this wave.
- staged clip prompt payloads are still enriched with additive continuity metadata:
  - `metadata.attachment_provenance[]`
  - `metadata.inherited_attachments[]`
  - `metadata.generated_reference_assets[]`
  - `metadata.pipeline_run_id`
- attachment provenance rows are additive and can include:
```json
{
  "id": "stable-id-or-url",
  "media_id": "optional-media-id",
  "type": "image|video|audio|...",
  "name": "asset-name",
  "url": "https://...",
  "mime_type": "image/png",
  "source": "media|generated|...",
  "role": "reference|audio|music",
  "source_run_id": "run-id",
  "source_checkpoint_id": "optional-checkpoint-id",
  "source_checkpoint_name": "optional-checkpoint-name",
  "source_checkpoint_index": 1
}
```
- if run payload includes `music_media_id`, frontend forwards it into clip creation request and metadata (`music_media_id`) when missing from output JSON.

### Scene Reference Mapping Contract (Wave 4D2)
- staged prompts may include scene rows from additive scene metadata keys:
  - `metadata.scene_reference_mapping[]`
  - `metadata.scene_reference_bindings[]`
  - `metadata.scene_references[]`
  - `metadata.scene_reference_map[]`
  - fallback scene lists: `scenes[]`, `scene_list[]`, `scene_prompts[]` (top-level or inside metadata)
- frontend normalizes scene rows to ordered bindings with required/optional state:
  - `scene_id`
  - `order`
  - `required_reference`
- scene rows render selected reference previews inline when selected assets include image URLs.
- frontend scene-reference overrides serialize back into metadata on assembly:
```json
{
  "scene_id": "scene-a",
  "order": 1,
  "required_reference": true,
  "status": "resolved",
  "reference_media_id": "library-image-1",
  "reference_id": "library-image-1",
  "reference_name": "Library Hero",
  "reference_type": "image",
  "reference_url": "https://...",
  "reference_source": "media",
  "source_checkpoint_id": "draft",
  "source_checkpoint_name": "Draft",
  "source_checkpoint_index": 0
}
```
- metadata writeback keys on save:
  - `metadata.scene_reference_mapping[]`
  - `metadata.scene_reference_bindings[]`
- top-level additive reference index is preserved:
  - existing `metadata.reference_assets[]` are retained
  - manually bound scene selections are merged into `reference_assets[]` (deduped)

### Prompt-Level Reference + Music Serialization (Wave 4E3)
- assembly writes scene-selected references into prompt-row metadata:
  - `imagePrompts[*].metadata.reference_image_url`: first ordered resolved scene reference
  - `aiVideoPrompts[*].metadata.reference_image_url`: per-row ordered scene reference
- compatibility aliases are also normalized when present:
  - `image_prompts[*].metadata.reference_image_url`
  - `ai_video_prompts[*].metadata.reference_image_url`
- legacy prompt-level `outputSpec.referenceImages` is removed during assembly/create normalization.
- selected pre-assembly music binding is serialized to:
  - top-level `music_media_id`
  - `metadata.music_media_id`
- music selection UI uses the same media browser modal used for attachments (library + upload).

### Explicit Assembly Validation + Blocking (Wave 4D2)
- assemble action entrypoint is explicit user click (`Assemble Clip Prompt`) per staged prompt.
- required scene rows with unresolved bindings block assemble in frontend.
- backend validation responses can additionally enforce blocking.
- frontend consumes additive validation fields when present:
  - `missing_required_references[]`
  - `missing_required_scene_references[]`
  - `missing_references[]`
  - `unresolved_scenes[]`
  - `unresolved_count`
- when backend flags missing required references, frontend:
  - clears impacted scene selection(s),
  - renders per-scene actionable errors,
  - keeps assemble action blocked until reassigned.

### Mid-Run Required-Reference Block Prompt (Wave 4E1)
- paused-run `Continue`/`Regenerate` actions now parse backend required-reference block responses.
- supported additive response cues include:
  - `missing_required_references[]`
  - `missing_required_scene_references[]`
  - `missing_references[]`
  - `unresolved_scenes[]`
- when detected, frontend shows explicit inline attach prompt in checkpoint panel and blocks continue until recovery attach succeeds.

### Clip Prompt Provenance + Reference Asset Editing (Wave 4D1)
- clip edit modal reads additive provenance metadata keys:
  - `attachment_provenance`
  - `inherited_attachments`
  - `reference_assets`
  - `generated_reference_assets`
- generated inherited assets can be toggled into `metadata.reference_assets[]` from UI for prompt assembly.
- save normalization keeps `reference_assets` as a clean additive array and does not mutate unrelated metadata keys.

### Music Binding Visibility Contract (Wave 4D1)
- music selector options in clip edit modal are now merged from:
  - `GET /clips/available-media`
  - inherited attachment provenance metadata
  - existing clip audio rows
- if selected `music_media_id` is missing from media API list, frontend keeps a fallback option (`Current selection (...)`) so selection remains visible and removable.

### Generated Asset Reuse In Attach Browser (Wave 4D1)
- generated pool assets without a backend-native `media_id` are now retained in frontend media-library merge as synthetic IDs for selection continuity.
- payload safety:
  - if generated asset is synthetic-only, frontend omits `media_id` in `initial_attachments[]` and sends `url` + metadata instead.
- origin labeling metadata is carried on generated rows:
  - `source_run_id`
  - `source_checkpoint_id`
  - `source_checkpoint_name`
  - `source_checkpoint_index`

### Media Settings Conversion
UI settings allow `dimensions` enum values.
Before send, `settingsToOutputSpec` converts dimensions -> `width` + `height`.

### Replace-Media Metadata
- media edit flow (`EditMediaModal`) now supports additive stable media-item replacement references.
- on save, metadata replacement payload can include:
  - `replacement_media_id`
  - `replacementMediaId`
  - `media_item_ref: { media_id }`
- clearing replacement removes those additive keys without mutating unrelated metadata fields (including music metadata keys).

## WebSocket
- endpoint: `/webhook`.
- handler currently expects event envelope `{ event, data }`.
- unknown events trigger conservative list refresh.

## Known Drift
1. websocket event names in frontend are partially legacy compared to backend emit set.
2. style schema shape can vary by backend/registry version.
   - frontend now normalizes common payload variants from `/clipstyles` + `/clipstyles/:style/schema`.
3. `/media/library` rollout is additive.
- frontend now prefers media-library endpoints and falls back to legacy `/media` routes for compatibility.

## Recommended API Cleanup Sequence
1. standardize websocket event type map with backend emitted events.
2. align clipstyle schema response shape to a single canonical format.

## Test and CI Notes
Current test status:
- `npm test -- --watchAll=false` passes.
- `npm run build` passes.

Queued stabilization options:
- react-dom test-utils deprecation warning appears in the test console with current tooling versions.

## File References
- API base/helper: `src/api/helpers.ts`
- model constraints client: `src/api/models.ts`
- clip API: `src/api/clip.ts`
- media API: `src/api/media.ts`
- pipeline API: `src/api/pipeline.ts`
- settings modal: `src/components/selectors/ModelSettingsModal.tsx`

## Contract Rule
All UI components must use `src/api/*` abstractions.
Do not hardcode direct fetch calls in component files for backend routes.
