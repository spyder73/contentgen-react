# Results Log

## Wave 4B1 Delivery (2026-03-07)

## UI Behavior Matrix (Asset Pool / Checkpoint / Reuse / Replace)
| Flow | Target Behavior | Status | Evidence |
|---|---|---|---|
| Asset pool as stable source of truth | Pool uses stable media-item IDs and explicit pool entries (media catalog, URL/file, generated outputs) instead of filename-only heuristics | `FIXED` | `IdeaInputForm` now stores/selects `AssetPoolItem` entries and uses `media_id`/pool IDs (`src/components/ideas/IdeaInputForm.tsx`, `src/components/ideas/assetPool.ts`). |
| Attachment pool collapse + drag/drop regression parity | Keep Wave 4C3 collapse/expand and drag-drop behavior intact | `VALID` | Existing controls retained and covered by updated `IdeaInputForm.test.tsx`. |
| Checkpoint-bound attachments + required-asset gating | Bind pool assets per checkpoint, show required-asset status, and block run submit on unmet requirements | `FIXED` | Checkpoint binding matrix + requirement evaluation added in `IdeaInputForm`; generate blocked when required assets are missing (`src/components/ideas/IdeaInputForm.tsx`, `src/components/ideas/assetPool.ts`, `src/components/ideas/IdeaInputForm.test.tsx`). |
| Generated-output reuse for later checkpoints | Expose generated outputs as selectable references and allow attaching to later checkpoints with editable selected state | `FIXED` | Generated assets collected in `IdeaGeneratorPanel` and attach-from-pool controls added in `PipelineRunItem` (`src/components/ideas/IdeaGeneratorPanel.tsx`, `src/components/ideas/PipelineRunItem.tsx`, `src/components/ideas/PipelineRunItem.test.tsx`). |
| Replace-media via stable media-item references | Replace generated media with selected media-item refs while keeping music replacement compatibility | `FIXED` | `EditMediaModal` replacement selector saves additive media-item reference keys; music flow in `EditClipPromptModal` remains unchanged (`src/components/modals/EditMediaModal.tsx`, `src/components/modals/EditMediaModal.test.tsx`). |
| Schedule platform/caption regression guard | Ensure scheduling platform selection + caption persistence behavior remains covered | `VALID` | Added regression test for no-platform block; existing platform/caption tests remain passing (`src/components/clips/sections/ScheduleSection.test.tsx`). |

## Payload/Contract Deltas
| Area | Previous Behavior | Wave 4B1 Behavior |
|---|---|---|
| Pipeline start attachment payload | Sent basic attachment shape with loose fields | Normalization now emits stable media/binding fields (`media_id`, `filename`, `size`, `checkpoint_id/index`, `source_checkpoint_id`, `source_run_id`) with compatibility aliases (`src/api/pipeline.ts`, `src/api/pipeline.test.ts`). |
| Idea flow checkpoint binding | Attachments were global-only | Idea submit now emits checkpoint-bound attachment rows derived from explicit binding selections (`src/components/ideas/IdeaInputForm.tsx`, `src/components/ideas/assetPool.ts`). |
| Generated-output reuse mapping | No explicit reuse mapping to start payload/run attach controls | Generated items are carried as explicit selectable references and mapped with origin checkpoint/run metadata fields (`src/components/ideas/IdeaGeneratorPanel.tsx`, `src/components/ideas/PipelineRunItem.tsx`). |
| Replace-media metadata | No dedicated stable replacement media selector in media edit modal | Media edit now writes additive replacement keys (`replacement_media_id`, `replacementMediaId`, `media_item_ref`) and supports clear/remove (`src/components/modals/EditMediaModal.tsx`). |

## Revalidation Verdicts (Orchestrator-Touched Docs)
| File | Verdict | Notes |
|---|---|---|
| `docs/AGENT_TASK.md` | `VALID` | Wave 4B1 scope matches implemented frontend changes in this delivery. |
| `docs/CODING_GUIDELINES.md` | `VALID` | API-layer usage and focused component/helper split remain aligned with repo guidelines. |
| `docs/API.md` | `NEEDS FIX` -> `VALID` | Pipeline attachment/replacement details were stale; updated in this wave to match current frontend payload behavior. |
| `docs/UI.md` | `VALID` | Changes are incremental UX additions within existing IA/component boundaries. |

## Validation Commands
| Command | Result | Notes |
|---|---|---|
| `npm test -- --watchAll=false` | `pass` | 14 suites, 48 tests passing; includes new required-asset gating, generated-output reuse mapping, replace-media, and schedule regression tests. Existing React `act` deprecation warning remains from tooling versions. |
| `npm run build` | `pass` | Production build compiled successfully after Wave 4B1 changes. |

## Manual QA Notes (Desktop + Mobile)
| Area | Desktop | Mobile | Notes |
|---|---|---|---|
| Asset pool selection + checkpoint binding | Not run | Not run | Implemented and test-backed; live interaction pass pending. |
| Generated-output reuse attach controls | Not run | Not run | Implemented in run cards with test coverage for payload mapping and attach action. |
| Replace-media selector + save/clear behavior | Not run | Not run | Implemented and unit-tested in `EditMediaModal.test.tsx`. |
| Schedule platform/caption regression | Not run | Not run | Existing and new schedule regression tests pass; live scheduler integration QA pending. |

## Wave 4C3 Delivery (2026-03-07)

## Scheduling UX Parity Matrix
| Flow | Target Behavior | Status | Evidence |
|---|---|---|---|
| Platform selection per run | Show account platforms as selectable controls, default all selected, allow deselection per schedule action | `FIXED` | `ScheduleSection` now renders per-platform checkboxes and keeps all selected by default (`src/components/clips/sections/ScheduleSection.tsx`). |
| Schedule payload by selected platforms | Submit only user-selected platforms to scheduler route | `FIXED` | `handleSchedule` now calls `API.scheduleClip(clipId, selectedPlatforms)` (`src/components/clips/sections/ScheduleSection.tsx`); covered by `ScheduleSection.test.tsx`. |
| Caption visibility in schedule flow | Show current clip caption in Schedule & Publish panel | `FIXED` | Clip caption is extracted from metadata in `ClipPromptItem` and passed to schedule panel (`src/components/clips/ClipPromptItem.tsx`, `src/components/clips/sections/ScheduleSection.tsx`). |
| Caption edit persistence before scheduling | Persist edited caption to clip metadata before scheduler submit | `FIXED` | Scheduling flow now saves caption via `API.editClipMetadata(..., 'caption', ...)` before calling `API.scheduleClip(...)` (`src/components/clips/sections/ScheduleSection.tsx`); order validated in `ScheduleSection.test.tsx`. |
| Scheduler contract/error behavior | Keep `/v1/schedule` canonical compatibility and actionable error strings | `VALID` | No API route-order changes in Wave 4C3; scheduling still uses existing External API compatibility chain from prior wave (`src/api/external.ts`, `src/api/externalHelpers.ts`). |

## Payload/Contract Deltas
| Area | Previous Behavior | Wave 4C3 Behavior |
|---|---|---|
| Scheduling payload platforms | Always sent `activeAccount.platforms` from panel | Sends only currently selected platform subset from Schedule & Publish UI (`src/components/clips/sections/ScheduleSection.tsx`). |
| Caption update path during schedule | No caption field shown/updated in schedule flow | If edited, caption is persisted to clip metadata via clip edit API before schedule submit (`src/components/clips/sections/ScheduleSection.tsx`). |
| Scheduler API contract | Canonical `/v1/schedule` + compatibility fallback chain | `NO CHANGE` in this wave; behavior preserved (`src/api/external.ts`). |

## Attachment Pool Interaction Matrix
| Interaction | Desktop | Mobile | Status | Evidence |
|---|---|---|---|---|
| Collapse/expand attachment pool | Supported | Supported | `FIXED` | Added attachment pool toggle with explicit expanded/collapsed state + attached count (`src/components/ideas/IdeaInputForm.tsx`, `src/components/ideas/IdeaInputForm.test.tsx`). |
| Drag-and-drop file attach | Supported (drop zone) | Not primary interaction | `FIXED` | Drop zone handles drag enter/over/leave/drop and adds dropped files to attachments (`src/components/ideas/IdeaInputForm.tsx`, `src/components/ideas/IdeaInputForm.test.tsx`). |
| Click-to-upload fallback | Supported | Supported | `VALID` | Existing file input remains active in attachment panel (`src/components/ideas/IdeaInputForm.tsx`). |

## Revalidation Verdicts (Orchestrator-Touched Docs)
| File | Verdict | Notes |
|---|---|---|
| `docs/AGENT_TASK.md` | `VALID` | Wave 4C3 requirements are coherent and implemented in this delivery. |
| `docs/CODING_GUIDELINES.md` | `VALID` | No conflicts with implementation approach; API-layer access and focused UI updates were preserved. |
| `docs/API.md` | `VALID` | API abstraction and contract guidance still matches current frontend architecture. |
| `docs/UI.md` | `VALID` | Current wave changes align with iterative UX improvement direction (no full redesign). |

## Validation Commands
| Command | Result | Notes |
|---|---|---|
| `npm test -- --watchAll=false` | `pass` | 13 suites, 41 tests passing, including new schedule/caption and attachment pool tests. Existing React `act` deprecation warning remains from test tooling. |
| `npm run build` | `pass` | Production build compiled successfully after Wave 4C3 changes. |

## Manual QA Notes (Desktop + Mobile)
| Area | Desktop | Mobile | Notes |
|---|---|---|---|
| Schedule platform toggles + caption edit | Not run | Not run | Implemented and unit-tested; live end-to-end scheduler validation pending. |
| Attachment pool collapse/expand | Not run | Not run | Implemented and unit-tested for visible state transitions. |
| Attachment drag/drop + picker fallback | Not run | Not run | Drag/drop and file picker both wired; manual touch/mobile interaction pass still pending. |

## Wave 4C1 Delivery (2026-03-07)

## Scheduling/Account Parity Matrix
| Flow | Backend Contract | Frontend Status | Evidence |
|---|---|---|---|
| Schedule creation | `POST /v1/schedule` canonical; compatibility aliases still possible | `FIXED` | API now calls `/v1/schedule` first, then `/schedule`, then legacy `/scheduler/runs` only on 404/405 (`src/api/external.ts`, `src/api/externalHelpers.ts`, `src/api/external.test.ts`). |
| Scheduling error UX | scheduler/backend contract returns actionable `error/message` strings | `FIXED` | API errors now extract backend error payloads and throw user-actionable messages consumed by scheduling UI (`src/api/externalHelpers.ts`, `src/components/clips/ScheduleButton.tsx`, `src/components/clips/sections/ScheduleSection.tsx`). |
| List/select active user | `GET /v1/users`, `POST /v1/users/active` | `FIXED` | User responses normalized across `{users|items}` + envelope variants; active-user switch now uses server response and updates local list state via focused hook logic (`src/api/external.ts`, `src/api/externalHelpers.ts`, `src/hooks/useUserAccountState.ts`, `src/api/external.test.ts`). |
| Add user UX + backend validation visibility | `POST /v1/users` with scheduler validation errors (`422 missing_fields...`) | `FIXED` | Add-user modal now stays open on failure and renders inline backend error message; success still closes modal (`src/components/modals/AddUserModal.tsx`, `src/hooks/useUserAccountState.ts`). |
| List/select active account | `GET/POST /v1/accounts/active` | `FIXED` | Active-account payloads normalized for direct and wrapped variants; user action now surfaces backend errors in toast (`src/api/external.ts`, `src/api/externalHelpers.ts`, `src/hooks/useUserAccountState.ts`, `src/api/external.test.ts`). |
| Scheduler event visibility | canonical websocket type `run_update` | `FIXED` | `run_update` parser now recognizes canonical payloads via explicit `type: run_update` and `event_type: run.*` semantics (`src/hooks/useWebSocketEvents.ts`, `src/hooks/useWebSocketEvents.test.ts`). |

## Payload/Contract Deltas
| Area | Previous Behavior | Wave 4C1 Behavior |
|---|---|---|
| External route targeting (`users/accounts/schedule`) | Called unversioned routes directly; scheduling preferred `/scheduler/runs`. | Route order now prefers canonical `/v1/*` endpoints with controlled 404/405 fallback to compatibility aliases (`src/api/external.ts`). |
| Users/accounts response handling | Relied on direct backend payload shape with minimal normalization. | Normalizes envelope variants (`data` wrapper), `users|items` list variants, account `id|_id`, and default account fields required by UI (`src/api/externalHelpers.ts`). |
| Error handling in user/account/schedule actions | Most failures surfaced as generic axios errors or console-only logs. | API extracts backend contract messages (`error/message/detail/reason/code`) and UI displays actionable toast/modal error text (`src/api/externalHelpers.ts`, `src/App.tsx`, `src/components/modals/AddUserModal.tsx`). |
| App user/account orchestration size | User/account side effects and handlers lived in `App.tsx` and pushed file length beyond target range. | User/account flows moved into `useUserAccountState` hook so `App.tsx` remains compact and focused on composition (`src/hooks/useUserAccountState.ts`, `src/App.tsx`). |
| `run_update` compatibility | Required scheduler-like keywords in payload context; canonical event payloads could be ignored. | Explicit canonical detection for `type=run_update` and `event_type=run.*` added before heuristic matching (`src/hooks/useWebSocketEvents.ts`). |

## Validation Commands
| Command | Result | Notes |
|---|---|---|
| `npm test -- --watchAll=false` | `pass` | 11 suites, 37 tests passing; includes new scheduling/user-account/websocket compatibility tests. Existing React `act` deprecation warning remains from current test tooling. |
| `npm run build` | `pass` | Production build compiled successfully after Wave 4C1 updates. |

## Manual QA Notes (Stabilized Flows)
| Area | Desktop | Mobile | Notes |
|---|---|---|---|
| Add user / select user / select account | Not run | Not run | Covered by API normalization + UI error surfacing updates and expanded unit tests; live auth/account environment pass still pending. |
| Schedule action success/failure messaging | Not run | Not run | Contract-level error extraction implemented; schedule response compatibility is unit-tested for `/v1/schedule` and fallback aliases. |
| Canonical `run_update` toasts | Not run | Not run | Parser and unit coverage now include canonical payload shape; live websocket feed validation remains pending. |

## Wave 4A Delivery (2026-03-07)

## API Assumptions and Payload Diffs
| Area | Previous Behavior | Wave 4A Behavior |
|---|---|---|
| Pipeline start payload (`POST /pipelines/start`) | Sent `template_id`, `initial_input`, `auto_mode`, provider/model/media profile only. | Now also sends `initial_attachments` (normalized list) and `music_media_id` when selected (`src/api/pipeline.ts`, `src/components/ideas/IdeaInputForm.tsx`, `src/hooks/usePipelineRuns.ts`). |
| Clip edit payload (`PUT /clips/:id`) | Sent `name`, `clipStyle`, `metadata`. | Now also sends `music_media_id`; metadata normalization persists `music_media_id` and `music.media_id` for backend compatibility (`src/components/modals/EditClipPromptModal.tsx`, `src/api/clip.ts`). |
| Available media list (`GET /clips/available-media`) | Returned raw `media_files` payload shape to UI. | Now normalized in API layer to stable `{ id, type, name, url?, mime_type? }` items for music selectors and attachment UI (`src/api/clip.ts`). |
| Schedule route contract | Only posted to `/schedule`. | Scheduler cutover compatible: tries `/scheduler/runs`, falls back to `/schedule`, and normalizes response to `ScheduleResponse` with `run_id/status/message` support (`src/api/external.ts`, `src/api/structs/user.ts`). |
| Scheduling websocket contract | Toasts depended on legacy `schedule_update` event. | Canonical `run_update` parsing added; scheduler run updates now map to severity-aware toasts (`src/hooks/useWebSocketEvents.ts`). |

## Validation Commands
| Command | Result | Notes |
|---|---|---|
| `npm test -- --watchAll=false` | `pass` | 11 suites, 31 tests passing; existing React `act` deprecation warning remains from current test stack. |
| `npm run build` | `pass` | Compiled successfully after Wave 4A changes. |

## Manual QA Notes (Desktop + Mobile)
| Area | Desktop | Mobile | Notes |
|---|---|---|---|
| Idea flow attachment block (URL/file/music) | Not run | Not run | Implemented below idea generation controls with typed/stateful rows and remove actions. |
| Clip edit music replace/remove flow | Not run | Not run | Modal now supports selecting music media, attaching by URL, and removing selection before save. |
| Scheduling notification contract (`run_update`) | Not run | Not run | Added parser/unit coverage; live websocket contract verification still pending. |

## Unresolved UX/API Gaps
- File attachments in idea flow are represented as attachment metadata only; there is no dedicated file-upload endpoint in current API layer for binary ingestion.
- URL-based music attachment in edit clip currently creates an `audio` media item with URL metadata/prompt because no specialized “ingest URL as media” route is documented.
- `run_update` toast classification uses context/status heuristics (`kind/type/run_type/scope/message`); final backend field names should be locked for fully deterministic mapping.

## Wave 3A Follow-Up Fixes (2026-03-07)

## User Feedback Addressed
| Issue | Resolution |
|---|---|
| Theme toggle should be near user area and behave like a switch | Implemented top-right switch control adjacent to user menu (`src/components/layout/Header.tsx`, `src/index.css`). |
| Warning/failure notifications should use stronger colors | Toast payload now supports severity and renders distinct success/info/warning/error colors (`src/toast.ts`, `src/App.tsx`, `src/hooks/useWebSocketEvents.ts`, `src/components/layout/Toast.tsx`, `src/index.css`). |
| Clip style selector in edit clip modal looked wrong in light/dark themes | Removed hardcoded old slate styling and switched to theme-aware select styling (`src/components/selectors/ClipStyleSelector.tsx`, `src/index.css`). |
| Edit clip modal could not scroll to lower fields (e.g., music URL) | Modal content now allows vertical scrolling in long forms (`src/components/modals/Modal.tsx`). |
| Edit media modal did not show text/position metadata fields | Media metadata editor now merges schema fields with actual item metadata keys (including fallback for `text`/`position`) so fields remain editable (`src/components/modals/EditMediaModal.tsx`). |

## Validation Commands
| Command | Result | Notes |
|---|---|---|
| `npm test -- --watchAll=false` | `pass` | 8 suites, 23 tests passing. Existing React `act` deprecation warning remains in test output. |
| `npm run build` | `pass` | Compiled successfully with follow-up fixes. |

## Wave 3A Delivery (2026-03-07)

## Re-Check Summary
| Area | Status | Evidence |
|---|---|---|
| Notification layering | `FIXED` | Toast now renders via portal (`document.body`) at top-layer z-index (`src/components/layout/Toast.tsx`) and stays above modal overlays (`src/components/modals/Modal.tsx`, `src/components/pipeline/PipelineManager.tsx`). |
| Theme toggle + persistence | `FIXED` | Header toggle added (`src/components/layout/Header.tsx`), theme persisted in local storage and applied from app state (`src/App.tsx`, `src/theme.ts`), and pre-hydration boot script prevents flash (`public/index.html`). |
| Attachment preflight UI | `FIXED` | API-layer attachment normalization added (`src/api/pipeline.ts`), typed attachment metadata support added (`src/api/structs/pipeline.ts`), and run detail UI now renders loading/empty/unavailable/error + metadata states (`src/components/ideas/PipelineRunItem.tsx`). |
| Clipstyle metadata editing reliability | `VALID` | Existing schema normalization and editor rendering paths remain intact; regression coverage still green in `src/api/clipstyleSchema.test.ts` and related UI tests. |

## Changed Files
| File | Why |
|---|---|
| `src/components/layout/Toast.tsx` | Fixed layering bug by moving toast rendering to portal and introducing accessibility attributes. |
| `src/components/layout/Header.tsx` | Added persistent, discoverable theme toggle control in header actions. |
| `src/App.tsx` | Wired theme persistence + apply-on-change and passed toggle state/actions to header. |
| `src/theme.ts` | Added shared theme helpers/types (`applyTheme`, storage key, mode guards). |
| `public/index.html` | Added pre-React boot script to apply saved theme before paint (no flash). |
| `src/index.css` | Added dark/light theme tokens and surface/form/notification styles for readability in both modes. |
| `src/components/modals/Modal.tsx` | Switched to shared modal classes to inherit theme-safe surfaces. |
| `src/components/pipeline/PipelineManager.tsx` | Aligned manager overlay shell with shared modal layering/surface classes. |
| `src/api/structs/pipeline.ts` | Extended `MediaAttachment` typing for metadata/source/size preflight payloads. |
| `src/api/pipeline.ts` | Added attachment normalization in API layer for run/list responses. |
| `src/components/ideas/PipelineRunItem.tsx` | Added attachment rendering surfaces + metadata display + loading/empty/error/unavailable states. |
| `src/api/pipeline.test.ts` | Added tests for attachment normalization with mixed backend payload shapes. |
| `src/components/ideas/PipelineRunItem.test.tsx` | Added tests for attachment rendering states and metadata display. |
| `src/hooks/useLocalStorage.ts` | Updated setter typing to support state-updater callbacks used by theme toggle flow. |

## Validation Commands
| Command | Result | Notes |
|---|---|---|
| `npm test -- --watchAll=false` | `pass` | 8 suites, 23 tests passing. Existing React `act` deprecation warning remains from current test stack. |
| `npm run build` | `pass` | Compiled successfully after TypeScript cast tightening in `src/api/pipeline.ts`. |

## Manual QA Matrix (Desktop + Mobile)
| Area | Desktop | Mobile | Evidence |
|---|---|---|---|
| Notifications during overlay states | Not run | Not run | Implementation updated to portal + top z-index; manual interaction pass still required. |
| Dark/light mode toggle + persistence | Not run | Not run | Theme boot script + persisted toggle implemented; manual visual pass still required. |
| Attachment rendering states | Not run | Not run | Unit coverage now includes loading/empty/metadata attachment states in run cards. |
| Clipstyle metadata edit forms | Not run | Not run | Existing schema normalization tests pass; live payload/manual editing pass pending. |

## Open Questions for Dorian (UX/Product)
1. Theme toggle placement: keep in current top-left header actions row, or move near user menu for global preferences grouping?
2. Notification priority: should websocket toasts always remain green success style, or should failures/warnings use severity-specific colors and ordering?
3. Attachment affordances: should attachment rows include explicit actions beyond URL open (copy URL, quick preview, or remove/replace when backend supports it)?

## Unresolved Risks / Blockers
- Manual desktop/mobile UI verification is still pending for overlay+toast behavior and theme contrast across all screens.
- Light-theme support currently relies on tokenized components plus targeted utility overrides; additional visual QA may surface edge classes that need explicit tuning.
- Clipstyle metadata rendering still depends on backend/registry schema consistency for uncommon field contracts.

## GitHub
- Branch: `codex/frontend-distributor-connector`
- PR: pending (no link available yet)

## Wave 2C Revalidation (2026-03-07)

## Re-Audit Classification (Orchestrator Edits)
| File | Classification | Evidence | Action |
|---|---|---|---|
| `src/api/clipstyleSchema.ts` | `VALID` | Uses shared `createEmptyClipStyleSchema` fallback model and merges descriptor + JSON-schema fields safely. | No change required. |
| `src/api/clipstyleSchema.test.ts` | `VALID` | Covers style list normalization, descriptor fields, JSON-schema `properties/required`, field merge behavior, empty fallback helper. | No change required. |
| `src/api/structs/pipeline.ts` | `VALID` | Explicit checkpoint typing and connector/distributor config shapes match editor usage. | No change required. |
| `src/components/modals/EditClipPromptModal.tsx` | `VALID` | Schema fetch fallback uses shared helper; metadata fields are schema-driven. | No change required. |
| `src/components/clips/sections/MediaEditorSection.tsx` | `VALID` | Schema fetch fallback uses shared helper; media metadata fields passed by media type. | No change required. |
| `src/components/pipeline/CheckpointPanel.tsx` | `NEEDS FIX` | Connector source id could serialize as empty string and default source selection favored earliest distributor. | Fixed: source now uses latest prior distributor by default and empty selection is normalized to `undefined` for API round-trip safety. |
| `src/components/pipeline/PipelineEditor.tsx` | `VALID` | Explicit add-checkpoint type modal supports `prompt`/`distributor`/`connector`; config defaults are present. | No change required. |
| `src/components/pipeline/PipelineEditor.test.tsx` | `VALID` | Covers modal add flow, duplicate ID validation, distributor/connector defaults. | No change required. |
| `src/components/pipeline/PipelineFlow.tsx` | `NEEDS FIX` | Non-connector checkpoints could be visually labeled as connector when referencing distributor outputs. | Fixed: connector badge/fan-in now only render for true connector checkpoints. |
| `src/components/pipeline/PipelineFlow.test.tsx` | `VALID` | Updated to assert single connector badge and distributor-output mapping text for non-connectors. | Expanded assertions for false-label regression coverage. |
| `src/components/ideas/PipelineRunItem.tsx` | `NEEDS FIX` | Non-connector checkpoints could show connector badge/fan-in cues. | Fixed: connector cues now only render for connector checkpoints. |
| `src/components/selectors/modelSettingsHelpers.ts` | `NEEDS FIX` | Multiplier snapping rounded integer values up at midpoint, conflicting with expected constraint snapping behavior. | Fixed: integer snapping now floors to nearest valid multiple, still bounded by min/max. |
| `src/components/selectors/modelSettingsHelpers.test.ts` | `VALID` | Test expectations correctly enforce integer snapping + dimensions conversion behavior. | No change required after helper fix. |
| `src/components/pipeline/PipelineOutputFormatPanel.tsx` | `VALID` | Default state explicit; controls are gated by `enabled`. | Added precedence hint: enabled pipeline format overrides model width/height defaults; disabled defers to model settings. |
| `src/components/pipeline/PipelineManager.tsx` | `VALID` | New pipeline creation initializes explicit output format defaults and update path persists `output_format`. | No change required. |

## Priority Task Verification
1. Connector/distributor editor correctness: validated via `PipelineEditor`/`CheckpointPanel` behavior and tests; connector source round-trip normalization fixed.
2. Fan-out/fan-in runtime UX verification: flow and run cards now show connector cues only for connectors; distributor fan-out copy retained.
3. Idea creation contract verification: `IdeaGeneratorPanel` routes single output to `createIdea` and multi-output payloads to `createIdeas`; parsing behavior covered by `ideaOutput` tests.
4. Schema fallback de-duplication: shared `createEmptyClipStyleSchema` helper is used in both clip prompt and media editor flows; no duplicated local empty schema shape found.
5. Output format/control clarity: precedence note added in output format panel to clarify interaction with model settings.

## Validation Commands
| Command | Result | Notes |
|---|---|---|
| `npm test -- --watchAll=false` | `pass` | 7 suites, 19 tests passing. Existing `ReactDOMTestUtils.act` deprecation warning remains in test output. |
| `npm run build` | `pass` | Compiled successfully after fixes. |
| `rg -n "\\bfetch\\(" src/components src/hooks src/App.tsx` | `pass` | No direct `fetch` usage in components/hooks; API access remains centralized under `src/api/*`. |

## Manual QA Matrix (Desktop + Mobile)
| Area | Desktop | Mobile | Notes |
|---|---|---|---|
| Pipeline editor checkpoint type flow (`prompt`/`distributor`/`connector`) | Not run | Not run | Requires interactive UI pass against live backend. |
| Run card fan-out/fan-in cues | Not run | Not run | Unit coverage added for connector-label regressions. |
| Clipstyle schema-driven edit modal (`properties/required`, `clip_metadata_fields`) | Not run | Not run | Unit schema normalization coverage present; live payload pass pending. |
| Output format controls and precedence clarity | Not run | Not run | UI text updated; manual confirm pending. |

## Unresolved Risks / Blockers
- Manual desktop/mobile UI verification is still pending in a live runtime session.
- End-to-end distributor/connector idea count behavior still depends on backend output aggregation contract (`/pipelines/:id/output` and websocket events). If backend collapses fan-out outputs, frontend cannot recover missing ideas from a single flattened payload.
- Test console still emits `ReactDOMTestUtils.act` deprecation warnings from current React/testing-library version pairing.

## GitHub
- Branch: `codex/frontend-distributor-connector`
- PR: pending (no link available yet)
