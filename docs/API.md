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
1. `ClipAPI.editClipMetadata` calls `PUT /clips/:id/metadata`.
   - backend route is not currently registered.
2. frontend clipstyle choices are still hardcoded in `src/clipStyles/*`.
   - model constraints are dynamic, but clipstyle field forms are not fully registry-driven yet.
3. websocket event names in frontend are partially legacy compared to backend emit set.

## Recommended API Cleanup Sequence
1. consume backend clipstyle passthrough endpoints once added.
2. generate clip metadata forms from clipstyle schema.
3. resolve `/clips/:id/metadata` mismatch.
4. standardize websocket event type map with backend emitted events.

## Test and CI Notes
Current test status:
- `npm test -- --watchAll=false` fails due to Jest + axios ESM parsing.
- use `npm run build` as first required CI gate.

Queued stabilization options:
- configure Jest transform strategy for axios ESM, or
- move to Vitest and port suites incrementally.

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
