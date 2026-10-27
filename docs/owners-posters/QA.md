# v33 validation — 2026-10-27

Block3 replaces the former three-column owner-motive grid with five source-style poster panels: three interview motives and two typographic interludes. Three generated scenes are illustrations of expectations before use. They are not customer portraits, product results or testimonials.

## Automated checks

- Astro production build: four pages, successful.
- Targeted TypeScript check for Landing.ts and its dependencies: successful.
- check-owner-posters.mjs: bounded source rail/parallax, reverse symmetry, mobile final-panel hold, reduced-motion state, five panels / three motives and active generated assets.
- Existing check-story.mjs, check-landing.mjs and life-gallery/check.mjs: successful.
- git diff --check: successful.

## Browser review

- 1020×1194, 1440×900 and 390×844: all main scenes and graphic interludes inspected; all images loaded; no document horizontal overflow.
- Wide panels follow source proportions; panels are capped at the viewport width when tall viewport proportions would obscure the subject.
- Mobile panels use an inset, bounded crossfade/translation passage; all three dog faces and body copy fit.
- Internal app/device navigation works after measured rail height; direct reload at #app lands beneath the header (70px), and the world remains hidden there.
- Browser errors/warnings: none observed during final review.
- Reduced-motion math and static markup verified; OS preference toggle and physical-phone FPS not exercised.

## Proof

Local screenshots: /Users/s.gavrilin/development/whoof/tmp/owner-posters/qa/preview.png, wide-first.png, wide-shared.png, wide-history.png, mobile-first.png, mobile-shared.png and mobile-history.png.
Preview: http://localhost:4321/?v=33#owners

The hero, collar geometry/materials, captured lighting, grounded prop interaction and seven-film wearing gallery were preserved. The initial-hash reconciliation is the only navigation change; it compensates for JS-measured section height while yielding to user input.

## v34 — independent images for all five posters

User feedback: v33 repeated puppy-v2 and shared-care backgrounds in its narrow interludes. Replaced them with two independent built-in imagegen scenes: chocolate spaniel on a first walk, and black-and-tan dog resting on its owner's knee. Three interview summaries and rail motion are unchanged. Sources and exact prompts are in PROMPTS-v34.md.

Build4pages2.74s and updated owner-poster check pass. The check now rejects duplicate active image sources. Desktop shows5unique loaded scenes with no horizontal overflow; both new phone frames inspected at390×844, with clear faces/type. No browser errors/warnings observed. Proofs: /Users/s.gavrilin/development/whoof/tmp/owner-posters-v34/qa/.
