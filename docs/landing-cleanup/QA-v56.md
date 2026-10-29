# v56 — Render and memory budgets

Baseline: v55 `57a2ae1`, retained as tag `whoof-v55-2026-10-29`. User authorized performance fixes while preserving the approved appearance.

## Changes

- Same shared renderer/collar/RAF, original HDR/LUT/materials/light strengths and choreography.5760yarn instances now select16×6/24×7/original40×9sampling by projected size with12%hysteresis; large macros keep the original geometry. Separate12×5loops cast shadows without appearing in the color pass. `/model` boolean detail API unchanged.
- Original65full-resolution prop views remain. One64MiB/two-decode cache pins neutral/current interpolation pairs and predicts neighbors, closes stale/evicted bitmaps and releases optional views offscreen/hidden. Original prop contact/friction and premultiplied adjacent-frame blending unchanged.
- Active frame-time feedback adjusts 3D/FX pixels after sustained overload and restores quality more slowly. Highest DPRcaps remain1.8desktop/1.5phone; pixel-area ceiling8.3M. Lower budgets reduce drawing buffer and Bloom/ending targets; native text/vector screen stays sharp. Quality resize happens before drawing to avoid an empty transition frame.
- Nearby stage preparation compiles shaders with synchronously restored shared renderer state. App/Ending reuse one light-tent probe; unmount waits for pending allocations before disposal.3D import is deferred; settled HeroCard style writes are skipped.

## Measured comparison

Actual native browser1440×900,ANGLE Metal AppleM4Pro,120Hz. Each scene:30warmup+180samples; disjoint GPUtimer queries. Both versions already held approximately120FPS in the controlled repeat, with no>25msframes. These changes provide headroom rather than a claim of increased FPS on this Mac.

| Scene | Maximum triangles before → after | GPU median ms before → after |
|---|---:|---:|
| Rotating collar |4,196,702 →1,155,422|3.23 →2.37|
| App pair, including shadows |8,407,610 →1,910,330|4.39 →2.90|
| Trust, including shadows |8,393,404 →1,896,124|5.46 →2.99|
| Offer with full effects |4,196,738 →1,155,458|5.05 →3.66|
| Food ending |705,604 →705,604|1.98 →1.84|

GPUmedian improves27–45% for the four collar scenes in this repeat. Ending geometry/motion stays the same; no substantial ending speed gain claimed. CPUsubmission stats include timer-query polling overhead. One earlier contended afterpass had long frames; all raw runs remain in workspace proofs. Timings vary with background load, power and GPU. Preparation may take longer because compilation moves before visible entry (App29.3→48ms in this repeat).

Full real-asset sweep covers195unique bitmaps: decoded-cache peak63.19MiB, max2decodes; all current pairs retained,195closures, offscreen2.73MiB, disposed0. Previous full sequenceRGBA estimate177.31MiBlandscape/123.57MiBportrait. These are decoded-source cache figures, not total browser memory. Native HeroPlate contact replay produced180/150/111distinctinterpolatedposes for keys/leash/ball with CPU95th.4ms. Cold optional frames can temporarily retain the last complete view while adjacent frames load.

Initial landing JS93.69→71.51KBuncompressed; Three is loaded through deferred OpeningScene. Existing527.27KBThreechunk warning remains.

## Verification

- Final4-route Astro production build, targeted Landing TypeScript, whitespace and11affected guard scripts pass, including LOD normals/hysteresis, quality recovery/pixel bounds and cache eviction/stale completion/disposal. App/choreography/title/clip/math, physical shader-state restoration, Trust/passage, owner rail, offerFX, propcontact and original65poseassets pass.
- Matched fixed frames preserve silhouette/light calibration. ChannelMAE on0–255scale outside fixtureheader: product.502,App.264,Trust.058,Offer.58; Ending0. Source device proportions/textures and reference lights untouched.
- Native production1280×720: hero/lift, App phone/comparison/pair/How boundary, reverse scrolling, continuous product passage, one/two-year prices+direct checkout href, FAQopen/close and food ending checked. No warning/error entries.390×844has no horizontaloverflow/brokenimages; still oneWebGL+threeprop canvases. This is responsive QA on a Mac, not real-phone FPS evidence.
- Actual App fallback/reduced/resize/dispose/remount fixture passes. Lowbudget native Offer1440×900uses1224×765buffer with existing five Bloom levels and180frames without errors. Dispose during pending App/Trust/Offer/Ending preparation ends with renderer geometries0/textures0 and no errors.
- No runtime dependencies, content/prices/checkout changes, deployment, push, payment, analytics or external messages.

Machine-readable controlled results: `performance-v56.json`. Workspace raw data/screenshots: `../tmp/performance-v56/proof/`. Reproduce with `prepare-performance-check.mjs baseline` **before source edits**, then `current` after edits; serve parent output on4342 and use native scene/run controls. Hero cache regression: `prepare-hero-cache-check.mjs`. Temporary fixtures stay outside production assets.

Preview: http://localhost:4321/?v=56 . Real device, cold-network and power-mode verification remains necessary before promising a universal frame rate.
