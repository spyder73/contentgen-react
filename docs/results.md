# Results Log

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
