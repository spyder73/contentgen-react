# Frontend API Layer

## Purpose
`src/api/*` is the only intended backend/registry interaction layer for the UI.
Base URL is currently `http://localhost:81` from `src/api/helpers.ts`.

## Core Modules
- `clip.ts`: clip CRUD, clip ideas, create-from-pipeline-output.
- `media.ts`: media CRUD, regenerate, metadata edits.
- `pipeline.ts`: pipeline runs + template CRUD + prompt template CRUD.
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
  "provider": "openrouter",
  "model": "...",
  "media_profile": {
    "image": { "provider": "...", "model": "..." },
    "video": { "provider": "...", "model": "..." }
  }
}
```

### Clip Create From Pipeline Output
`ClipAPI.createClipPromptFromJson(json, mediaProfile?)`:
- parses pipeline output JSON.
- injects fallback `outputSpec` from run-level `mediaProfile` into each media prompt where missing.
- calls `POST /clips`.

### Media Settings Conversion
UI settings allow `dimensions` enum values.
Before send, `settingsToOutputSpec` converts dimensions -> `width` + `height`.

## WebSocket
- endpoint: `/webhook`.
- handler currently expects event envelope `{ event, data }`.
- unknown events trigger conservative list refresh.

## Known Drift
1. websocket event names in frontend are partially legacy compared to backend emit set.
2. style schema shape can vary by backend/registry version.
   - frontend now normalizes common payload variants from `/clipstyles` + `/clipstyles/:style/schema`.

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
