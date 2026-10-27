# v40 — one day in Whoof

Block4now uses a seven-viewport scroll passage: circular day marks assemble, camera withdraws to reveal a beveled physical phone, its attached app screen switches to a14day trend, existing real footage enters beside it, and the original collar enters from the right. The phone/collar pair continues into block5with a controlled title reveal and is occluded by the following content. Old numbered tabs and white editorial card are removed.

## Source and implementation

AppData contains65point centres/colors reconstructed from supplied app-day.webp; trend values follow supplied app-dynamics.webp. UI is an illustrative reconstruction, not a verified application build. Macro view hides interface chrome until the camera withdraws. Labels explicitly state example/demonstration/after synchronization; no GPS, diagnosis, live remote data or shipping promises added. Context uses existing outside.mp4: source frames222–313from supplied drop_without offer.mp4, documented by prepare.py. No new raster generation, dependency or external service.

The phone uses rounded Shape/ExtrudeGeometry with thin bevels, physical frame/glass/buttons/port and1024×2208CanvasTexture. RoundedBox radius clamping was unsuitable for thin bodies. OpeningScene lazily loads AppPhoneScene near or inside the stage (including late direct entry), shares one renderer, and draws the established collar through its unchanged calibrated light/material path. Inactive hosts detach before another host attaches. Canvas state remains compatible with hero/wearing/offer.

Captions use source-style masked characters. Fixed scene/atmosphere span the Howintro; clipping follows its lower boundary, so later prose occludes the objects. How title carries above the pair; kicker/demo labels yield during the handoff. App stages use cached measurement/pure scroll state/no second RAF; held screen frames skip texture uploads; offscreen/hidden DOM/media work pauses. Existing DPRcaps remain. Reduced motion expands native screenshots/copy/manual video and skips phone-scene preparation; no-JS keeps semantic content/screenshots/native film controls.

## Validation

- Final Astro build:4pages2.12s. Targeted TypeScript and diff checks pass. Existing Threechunk size warning remains. Phone scene is a deferred13.51KBchunk(5.32KBgzip).
- check-app-scene: bounded/finite/reversible desktop/portrait/landscape states; continuous framing, holds, carry and reduced pose. Every screen phase executes through a2D drawing sink; alpha restores and held texture upload is skipped. Built native captions/demo labels/real media/no tabs checked.
- Offer/story/owners/landing/seven-video gallery checks pass. Nine semantic blocks and original prior assets remain.
- Browser1440×900: day macro, real beveled phone, comparison, contextual film, pair/handoff, direct#how entry and content occlusion checked. At7.9Hthe world clips below its visible intro boundary; no ghost models over prose.
- Browser390×844: macro/device/context/pair and reverse checked, no horizontal overflow. Video readyState4/currentTime advances and pauses onexit.
- Native app→offer→hero navigation restores the same canvas to offer-model-host and opening-canvas; app atmosphere hides. Final normal viewport restored at#app. Console warnings/errors empty.
- Reduced/no-JS fallback code and pure reduced states checked; OS preference switching, JS-disabled browser rendering and physical-device FPS were not measured.

Proof directory: /Users/s.gavrilin/development/whoof/tmp/app-scene-v40/qa/ (wide-macro,wide-phone,wide-comparison,wide-context,wide-handoff,wide-how-transition,wide-how-occlusion; phone-macro,phone-device,phone-context,phone-handoff). Early screenshots can show historical geometry/focus outlines; final phone/context/handoff/How proofs are the review views.
Preview: http://localhost:4321/?v=40#app
