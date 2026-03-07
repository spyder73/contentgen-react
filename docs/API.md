# Frontend API Layer

## Purpose
`src/api/*` is the only intended backend/registry interaction layer for the UI.
Base URL is currently `http://localhost:81` from `src/api/helpers.ts`.

## Core Modules
- `clip.ts`: clip CRUD, clip ideas, create-from-pipeline-output.
- `media.ts`: media CRUD, media-library list/upload, regenerate, metadata edits.
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

### Media Library Explorer Contract (Wave 4B2)
- `MediaAPI.listMediaLibrary(...)` calls `GET /media/library` and falls back to legacy `GET /media` on `404`/`405`.
- list responses are normalized into ID-first rows:
  - stable `media_id` (mirrored as `id` for UI selectors)
  - `type`, `name`, `source`, `mime_type`, `size_bytes`, optional `clip_id`
- `MediaAPI.uploadMediaLibraryFile(file, ...)` calls `POST /media/library/upload` (multipart) and falls back to legacy `POST /media/upload` on `404`/`405`.
- attachment workspace renders actionable inline upload/list errors for:
  - `405`: route/method not enabled for media list/upload
  - `413`: upload payload too large

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

### Clip Create From Pipeline Output
`ClipAPI.createClipPromptFromJson(json, mediaProfile?)`:
- parses pipeline output JSON.
- injects fallback `outputSpec` from run-level `mediaProfile` into each media prompt where missing.
- calls `POST /clips`.

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
