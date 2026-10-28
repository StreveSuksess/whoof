# v54 — One Trust → Offer product passage

Validated 2026-10-29. Previous checkpoint: v53 `e85d45a`.

## Change

Trust and price now retain the same canvas and physical collar throughout their combined range. The old incoming baked collar and CSS ghost pictures are hidden during enhancement; they no longer switch abruptly into the live model/pencil shader at the native section edge.

`ProductPassageStage` measures fractional native Trust/Offer product bounds, clips one fixed host and releases it before other scenes acquire the canvas. `ProductPassageMotion` supplies a reversible quintic bridge from −0.45 to +0.45 Offer viewport units. OpeningScene evaluates the unchanged original Trust/Offer transforms, interpolates product position/scale/quaternion, camera and sensor crop, then draws one collar. Existing light strengths and environment intensity interpolate with the backdrop; navigation tone follows that same blend. Prepared GPU sketches fade through premultiplied output; no new model, renderer, dependency or RAF was added.

Outgoing Trust copy fades before the native boundary can cut its paragraph. Incoming price UI starts after +0.05 and is readable by +0.30; hidden controls are inert. A price anchor lands at +0.50, the settled composition. The collar follows the sticky stage upward before conditions enter. Reduced/static/failure paths retain the previous native fallback; those paths were reviewed in source, not UI-emulated in this task.

## Verification

- Four-route Astro build, targeted Landing TypeScript, whitespace, new passage math, and existing Trust/Offer/App/landing guards pass. Main JS93.42KB; source sketch chunk17.75KB; shared Three527.27KB. Existing >500KB warning remains.
- Pure checks cover finite/bounded/monotonic blend, zero endpoint blend velocity, exact reverse state, UI/native-boundary guards, outgoing text clearance and strict fractional combined clips.
- Isolated native-browser fixture loads the actual collar, source animation tracks, camera and OpeningScene evaluator. On1440×900,761×1194,390×844,844×390: exact outgoing/incoming poses match original render methods;921samples per viewport and their reverse match. Maximum normalized projection step0.005268 and quaternion step0.010093radians at0.001viewport scroll intervals. These are geometry continuity measurements, not FPS. A0.3viewport sticky exit moves the projected model up0.6NDC on every viewport.
- Native1440×900 before/middle/after/reverse: one canvas remains in passage; zero in old Trust/Offer hosts; native posters and CSS ghosts are hidden. Approximate backdrop blend0→0.5→1, same middle state on reverse. No full-photo/GPU substitution or white section strip crosses the model.
- Native390×844 middle/after: one model, no horizontal overflow. Two-year selection shows19 990₽ and retains the same canvas. At the conditions edge the combined clip shrinks with the native product boundary; a later ending anchor fully releases passage and activates the existing kibble canvas. Returning through the real header price link restores one passage canvas. Original one-year plan restored after testing.
- Final native761×1194: eight main sections,14accordions, four canvases total (three existing HeroPlate Canvas2D buffers plus one shared WebGL canvas), no horizontal overflow and no warning/error console entries in the validation tab. Temporary viewport override reset.

Proofs outside served assets: `../tmp/product-passage-v54/qa/` contains `pose-checks.json/png`, desktop before/middle/after/reverse, phone middle/after, conditions, native states and final preview. Fixture generator: `tools/whoof-render/prepare-product-passage-check.mjs`; pure checks: `check-product-passage.mjs`.

Preview: http://localhost:4321/?v=54#order . No publication, push or commercial action. Product facts/prices/material assets and other sections remain unchanged. Physical-device GPU FPS is unmeasured.
