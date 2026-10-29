# v57 — Native phone scroll stability

Baseline6a0666a/v56. User reported jumps/missing content near the lift, phone and price. Device/browser were not specified.

## Fixes

- SceneViewport shares one authored pixel height between CSS, controller travel and camera. Height-only resizes on narrow/coarse screens do not change section lengths, re-split text, resize GPU targets or reset hero decodes. Width/orientation and desktop resizing still remeasure. Backgrounds cover the visible window; authored canvas/sticky dimensions remain stable.
- Phone/narrow scroll follows actual native position. Desktop keeps ordinary easing and snaps fast jumps/reversals in the same frame. Touchstart/touchmove cancel late initial hash reconciliation. Automatic browser fragment scroll is deliberately not treated as user intent; #order still reconciles after measured layout. Structural permanent fallback retains the current reading section/progress.
- A uniquely prefixed native AppScreen displays the same vector data/time/compare state until live3D is ready. Readiness does not change document height. Shader warmup for App then Trust starts after world loading. Existing owner768 images are selected responsively; complete owner/How sequences and clips warm before visible entry. Offer retains its existing fallback before the shared world is attached.
- On phones/narrow screens, leaving the hero releases its decoded static layers, bitmap cache and prop canvas buffers; the original full beauty remains available during re-entry decode. Original65pose sources/model/materials/lighting are retained. One renderer/RAF remains.

## Verification

- Four-route production build and targeted Landing TypeScript pass.13affected source/math/asset guards pass: mobile-scroll, landing, performance, hero-assets, app-scene, app-comparison, owner-posters, how-story, trust-sequence, product-passage, offer, opening-transition, header-motion. Whitespace check passes. Existing large Three chunk warning remains.
- Native390px responsive test: baseline700→780 height changed scroll4900→5140 and total height22632→24500. With the fix,700→760→780→700 retains scroll6321, total22632, AppTop4885.796875 and7px scene unit exactly. No horizontal overflow. Width844×390 accepts a3.9px unit and responsive composition.
- Fast forward/reverse App/price entries render the correct shared canvas, with uniqueDOMIDs. #order direct entry lands at17521 for top17170.796875 plus350px. Repeat height changes leave the price position stable. Expanded visible background does not expose a paper strip below the dark price.
- A separate native HTTP fixture delays the actual deferred OpeningScene module8seconds. At scroll4900 the new vector preview is visible at00:00, then liveApp appears at the same scroll4900/time00:00, without relayout. Away from hero, all three prop buffers are1×1 and none of the static layer images retains src. Fast reverse shows the original beauty while layers decode.
- Actual App controller fallback/reduced/resize/dispose/remount fixture passes. Native desktop1280×720 preserves the collar scene; no broken loaded images, horizontal overflow or console warning/error entries observed.

These are native browser checks on a Mac with narrow/resized windows, not actual Safari/Android hardware certification or a guarantee against every mobile tab reload. Total browser/GPU memory was not measured.

Workspace proofs: tmp/mobile-v57/proof/{height-checks.json,cold-app.png,mobile-price.png,mobile-app-reverse.png}. Cold fixture: `node tools/whoof-render/serve-mobile-check.mjs`, localhost4341; no fixture hooks are served in production.

Viewport background: [Apple's viewport unit explanation](https://developer.apple.com/videos/play/wwdc2022/10048/) and [MDN VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport).
