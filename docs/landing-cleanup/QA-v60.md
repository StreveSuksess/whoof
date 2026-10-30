# Whoof v60 — mobile frame budget

30 October2026. User reports site cannot keep up with scroll on phones and says it occurs on all. Existing v59 product content, filling mark without numbers and source choreography retained.

## Changed behavior

- Native phone scroll remains immediate; no smoothing, scroll lock, FPS cap or delayed position introduced.
- Settled StoryText/App caption states skip redundant per-glyph styles. App caches invalidate on resize/static reset/inactive transition so reverse reentry restores visible captions.
- Header collision geometry reads precede scene/style writes; document height is measured with layout changes, not read after every animated frame. Frequent DOM nodes cached.
- Narrow/coarse devices start with quality1 and respond after.65seconds of sustained overload (plus EMA convergence), recovering with existing7second sustained headroom. High-DPR startup color-buffer area is1.25²/1.5²=69.4% of previous. SVG screen/text remain native resolution.
- Adaptive yarns use8×5sampling below420projectedpixels with12%hysteresis, then existing16×6/24×7/40×9tiers. All5760instances, transforms, materials, silhouette, lighting and existing12×5shadow proxies retained.
- Already-invisible hero layers release at1.05H instead of2.1H; reverse decoding retains original beauty fallback.
- Mobile entry prepares App/Trust/Offer and exercises real first Opening/App/Trust/Passage draws while loader still owns entry. compileAsync/idle loading alone left first-use spikes. Temporary CSS3D vector is detached, offer intro reset and actual destination frame invalidated. Skip/timeout prevents hidden warm draws from overwriting already-visible content. Existing bounded3secondcontinue/8secondescape remains.
- Desktop keeps original high initial quality and source effects, with idle Offer preparation after Trust. Same shared renderer/RAF, no extra runtime dependency.

## Evidence

Temporary localhost4341 tools/whoof-render/serve-scroll-trace.mjs serves frozen v59/current compiled HTML with a native scroll-trace button, RAF/style/longtask metrics and optional fixture-only publicGL/method timing. No diagnostic hook or controls enter production. Frozen baseline tmp/mobile-v60/baseline, JSON/proofs same parent directory. Three programmatic native scroll passes: opening, App pair and price. This is a Mac390×700viewport test, not actual mobile inertia/hardware.

| Callback cost in trace | v59 maximum | Warm v60 maximum |
|---|---:|---:|
| Opening |12.8ms|1.2ms|
| App pair |6.3ms|1.0ms|
| Price |48.9ms|4.6ms|

Baseline price had a50ms longtask/41.6ms longest frame. Warm v60 trace had no recorded longtask and price longest frame10.1ms. Median frame interval~8.3ms on this fastMac in both versions; this is not proof of universal phone FPS. Initial intermediate idle/compile-only patch still showed46–56ms price spikes; replaced with guarded real first-draw warmup before shipping.

Separate actualsource App benchmark at390×700:1,910,330→1,265,210triangles (34%less),49drawcalls unchanged. NativeMacDPR1 had equal390×700buffers;31%pixel reduction is high-DPR budgetmath. GPU timer distributions fluctuated on AppleM4Pro, so no GPU-time speedup claimed. Fullscreen/state screenshots in tmp/mobile-v60/proof; exactJSON app-before/app-after-isolated/warm-trace files.

## Validation

- Final four-route build, targeted Landing TypeScript and whitespace pass. Existing Three527KB chunk warning unchanged.
-13affected guards passed before final warmup;7directly affected guards repeated after warmup/catch: entry-loader/mobile-scroll/header-motion/app-scene/offer/performance/product-passage. Rest cover landing/app-comparison/trust-sequence/opening-transition/owner-posters/how-story. New meaningful quality/LOD thresholds, hysteresis, normals and recovery assertions pass.
- Native normal production390px: initial#app at -0.2px, one Appcanvas/onevector, no horizontaloverflow. At App pair exact same livepose/text/light read correctly; proof app.png.
-390×700→780 retains scroll8386 and documentheight22632 exactly. New#order at780height lands -390.2px (authored halfviewport), one Passagecanvas and no warm Appvector ghost.
- Fast reverse price→App restores pair caption and sharedcanvas; reverse→hero returns scroll0 with has-layers and4loadedimages.
- Skip with12second world delay releases inert/scroll. Failed world503 gives no-webgl/done/native content. Reduced fixture gives Appstatic/done. Existing early guard stays bounded.

Actual iOS/Android devices and independent BFCache remain unverified. User did not identify specific model/browser. Public-origin visuals remain corporateblocked from thisMac; server HTTP/byte checks are separate. No claim that every memory/FPS cause on every phone has been resolved.
