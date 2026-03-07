# Results Log

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
