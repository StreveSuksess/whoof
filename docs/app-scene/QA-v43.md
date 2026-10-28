# v43 — app entry and physical pair

User reports an early flat-phone preview and clock bleeding over owners/app boundary, and rejects both phone and collar lighting as toy-like. Baseline v42 remains95293e2/tagwhoof-v42-2026-10-28.

## Changes
- Removed normal-sticky flatphone poster from startup. Native charts/text remain for no-JS/reduced motion; renderer/preparation failures now explicitly switch to native reading and remeasure page sections.
- Fixedworld/background entrytop and exitbottom clip use actual document scroll, rather than smoothed scene time. Captions retain documentsticky flow; fixedclock cannot cross previoussection boundary.
- Phone casing uses one smooth rounded sidewall with manufactured bevel profile, dark glass/seal, embedded antenna breaks, ports and buttons. Physical display aperture follows the same projection as CSS3DnativeSVG.
- CSS3Dscreen is below the same alphaWebGLcanvas. A NoBlending zeroRGBA aperture clears opaque body pixels; dielectricglass above supplies actual environmentreflection andFresnel. Reflectedenergy is already premultiplied: ONE/ONE_MINUS_SRC_ALPHA blending, with the generic extra premultiply shader step bypassed. This avoids clamping unpremultipliedHDR before blending. Frontglass ARstrength/F0.0032 keeps content legible.
- Both objects use the same bounded feathered-panel PMREMenvironment and firstheroOCIO display transform. Collar gets a shadowedkey, without the former unshadowedStoryLighting3.4/12additions. Shadowmaps1024mobile/2048desktop; update whenpose/viewportchanges, reuse for phonepointer-only updates. Environment/intensity/lightvisibility/shadowenabled/type restore after eachpass, including errors. Hero/otherstage calibration and collarCAD/materials/pose tracks retained.
- Disabled Astrodevelopmenttoolbar in localpreview.

## Validation
- Astro4routes productionbuild, targetedTypeScript anddiffchecks pass. Existing>500KBThreechunkwarning retained.
- App tests: phases/reverse/C1motion/reducedpose, actual-boundary entry/exitclips, nativevectorbounds/readouts/IDs/markup. Sidewall bounds and everyunitnormal checked. Render-state restoration checked through a thrown draw callback. Earlyflatposter absence asserted in build.
- Prior story/offer/landing checks pass.
- NativeIAB1280×720: partialentry atlocal−.322 hassectiontop231.797px andmatchingclip231.797px; no clockaboveedge, no poster ordevtoolbar. Both phonebanks checked with actual movingreflection aboveSVG. Pair/Howcarry andreturn tohero checked; hiddenapphost/canvasrelease verified.
- NativeIAB390×844: macro and pairfit/nohorizontaloverflow, shadowmap/render working, error/warnlogempty. Firsthero returned normally. Temporaryviewportoverride reset.
- Screenshotproof: projectroot tmp/app-materials-v43/qa/ (partialentry, phoneleft/right, desktop/mobilepair andfinal). Localpreview4321/?v=43#app or#how. No publication/push/purchase/messages.

## Limits
Aesthetic acceptance remains user review. This is live PBR with a shadowmap, not the firsthero's offlinepathtracing; multiplebounce light transport and arbitrary-view texture fidelity still differ. PhysicaldeviceFPS/non100%browserzoom/OSreducedvisualmode not benchmarked. Smartphone/UI are genericconcept/demodata, not verified app/hardware specifications.
