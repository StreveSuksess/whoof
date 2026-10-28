# v51 — animated FAQ and offer disclosures

All14 active accordions share native details/summary markup and one motion controller:12FAQ and2offer conditions. Opening animates measured height and a small opacity/vertical content reveal; closing retains native open content until exit finishes. Rapid clicks reverse from current rendered height/opacity. Plus becomes minus through a rotating/fading stroke.

Closed panels are inert, expanded state is synchronized, keyboard Enter/Space retains native activation, and completed open panels return to auto height. Content resize retargets active motion; reduced motion settles immediately. Native/no-JS fallbacks remain in markup/CSS (reviewed in source; no OS preference was changed for testing).

One existing Landing RAF refreshes reveal/section bounds only during layout changes; SectionMotion can measure without resplitting. OfferStage's toggle-only callback is removed. No new RAF, dependency or renderer. A temporary document scroll-anchor opt-out prevents the browser keeping a lower row in place while moving the clicked summary; it clears when motion finishes.

## Validation

- Astro four routes, targeted Landing TypeScript, diff check and existing landing/header/App/Trust guards pass. Main JS85.97KB; existing524KBThree warning unchanged.
- CUA761×1194 firstFAQ: closed74.75px; opening165.70px while active; settled177.14px with empty inline height. Closing78.83px while native open=true and target expanded=false, then closed. Inert follows target state.
- Rapid open/close/open: expanded states true/false/true, rendered heights165.52/77.55/166.68px; final177.14px auto height, no stale close callback.
- Native Enter closes; Space reopens. First and second questions remain independently open. Screenshot confirms full text and plus/minus states.
- Resize to390×844 while question3 is opening:226.98px during retarget to275.28px; settled exactly275.28px with auto height, no overflow or clipped answer.
- Offer subscription: closed72.59px, intermediate276.25px, settled301.24px auto; checkout-information link retained; closing retains native open content while panel becomes inert.
- Native coordinate click after anchor correction: scrollY32155 and summary top70.78px unchanged through full open and close. Root overflow-anchor returns to auto at settlement.
- Console has no warnings/errors. Temporary viewport override reset. Product geometry, lights, choreography, copy and v50 removed captions remain unchanged.

Proofs in workspace tmp/accordion-v51/qa/: faq-open.png, phone-open.png, conditions-open.png and final-preview.png. Preview http://localhost:4321/?v=51#faq .
