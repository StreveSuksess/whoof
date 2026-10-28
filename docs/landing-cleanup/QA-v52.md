# v52 — Interactive kibble ending

Validated 2026-10-28. Previous recovery checkpoint: v51 `169523a`.

## Result

The final action and existing legal links now live in a spacious ending footer. Three custom rounded dry-food shapes form a drifting, rotating 3D ribbon with local cursor repulsion, damped return and contacts. Porous albedo/normal maps, scoped studio lighting, self-shadows and depth-aware blur provide volume. The reference is Oryzo's live ending and local `engine/scenes/footerScene.ts`; source motion was adapted without activating its retired global engine or using coffee assets.

`KibbleScene` is lazy and shares the existing renderer, canvas and Landing RAF. Native footer bounds clip the fixed background; canvas owners release before another acquires it. Ending rendering pauses offscreen/hidden. There are 420 particles on desktop, 168 on phone/coarse input and a static 96-particle reduced-motion composition. Offscreen buffers have capped resolution. Existing product geometry/material/light calibration and main eight sections remain intact; 14 animated accordions remain mounted.

## Checks

- Astro production build: four routes, passed. Targeted TypeScript check and `git diff --check`: passed.
- `check-kibble-ending.mjs --built`: deterministic state, finite/bounded motion, pause, local cursor effects, contact separation, spatial grid, resize, geometry normals/material maps, strict clips, camera-relative cursor projection and built markup all passed.
- Existing landing, Trust and App regression checks: passed.
- Numeric 420-particle simulation measured approximately 0.2 ms per step in Node. This is not a browser GPU FPS measurement.
- Native in-app browser cursor sweep displaced and rotated nearby pieces. Reverse scrolling preserved the footer clip. Expanding the last FAQ moved the clip exactly with the native footer edge (615.195 px).
- Native final CTA returned to live Offer: one shared WebGL canvas in Offer, none in Trust/Ending. Corrected Trust's rounded `offsetHeight` boundary to actual fractional native bounds after this check exposed a 0.39 px stale ownership interval.
- 390×844: heading/CTA fit, no horizontal overflow, particles visible below. Restored normal 761×1194 viewport for delivery.
- Clean final reload produced no new warning/error console entries during validation. Historical development messages were excluded using the reload timestamp.
- Four canvases remain in the document: three existing HeroPlate Canvas2D buffers and one shared WebGL canvas. Source has no extra renderer or RAF.
- Reduced-motion and unavailable-3D/no-JS fallbacks were reviewed in source; OS reduced motion and no-JS were not emulated in the UI.

## Evidence and limits

Native screenshots are saved outside served assets in `../tmp/kibble-v52/qa/`: `before-cursor.png`, `after-cursor.png`, `faq-boundary.png`, `return-offer.png`, `phone.png`, and `final-preview.png`.

Main JS: 88.18 KB; lazy KibbleScene: approximately 12.87 KB; shared Three chunk: 527.27 KB. The existing >500 KB build warning remains. No dependencies or external assets were added. This decorative scene adds no product claims. GPU performance across physical devices remains unmeasured.

Preview: http://localhost:4321/?v=52#finish. Local only; no publication or push.
