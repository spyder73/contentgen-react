# Results Log

## Wave 4C4 (2026-03-08)

### Achieved
- Replaced upload panel with a square black `+` attach tile supporting both click picker and drag/drop.
- Added preview-first media browsing: row/detail previews for image/video/audio and selected-file previews in run attachment summary.
- Cleaned run-attach select mode: hidden context/remove editing controls and added guidance text to use manage mode for edits/removal.
- Made run attachments requirement-driven: attach UI shows only when pipeline/checkpoints require it; missing required assets are highlighted with direct `Open Attach Browser` CTA.
- Added `chain` checkpoint support and visuals (distinct treatment + sub-checkpoint count + requirement indicator continuity).
- Removed clip-edit `Attach music from URL` flow for this wave; music is media-library audio picker only.
- Added media rename flow in browse/manage mode with actionable duplicate-name error messaging.
- Added per-run/per-clip pricing summary display from mixed `cost_summary` payloads (Runware/OpenRouter) with estimated markers.
- Preserved fallback compatibility for `/media/library*` routes and kept scheduling/replace-media flows stable.

### Revalidation Verdicts
- `docs/AGENT_TASK.md`: `VALID`
- `docs/API.md`: `VALID` (updated for requirement-driven attach behavior, rename fallback, chain semantics, pricing semantics)
- `docs/UI.md`: `VALID` (updated for attach tile, select-mode cleanup, previews, chain visuals, pricing summary)
- `docs/results.md`: `VALID` (current-wave concise record)

### Validation Commands
- `npm test -- --watchAll=false`: `pass` (16 suites, 66 tests)
- `npm run build`: `pass`

### Keep Working On
- Manual desktop/mobile interaction QA for attach tile and preview ergonomics.
- Live backend verification for rename conflict copy and mixed `cost_summary` variants.
- Test-tooling cleanup for recurring React `act` warnings.
