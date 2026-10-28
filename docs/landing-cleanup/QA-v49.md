# v49 — transparent Oryzo-style navigation

User rejected v48's opaque header bar. Inspected live Oryzo tab3 and original SiteHeader.ts/main.css: transparent fixed header, no background/backdrop/border/shadow, full-viewport translucent blocker on desktop nav hover (.18s), separate mobile menu.

## Change

Removed the header pseudo surface and obsolete `is-covered` state. The fixed header remains transparent over the scene. A decorative pointerless viewport scrim below it dims the scene during fine-pointer desktop nav hover or keyboard focus-visible. Links receive source-style opacity emphasis. Leaving the menu removes attenuation; mouse focus alone does not retain it. Light-section navigation becomes ivory while the scene is dimmed.

The v48 directional/clearance guard, compact hitbox, keyboard access, reduced-motion transition rules and all existing scenes/section handoffs remain. Touch-size layouts have no hover-triggered scrim. No new RAF/render context/assets/dependencies.

## Checks

- Astro four-route build, targeted Landing TypeScript, existing HeaderMotion regression, landing eight-section/anchors/assets regression and diff check passed.
- Main JS82.77KB; existing524KBThree warning unchanged.
- CUA1296×1194: computed header background rgba(0,0,0,0), pseudo content none, ordinary scrim opacity0. Native down heading20.52px→header hidden; up heading104.02px→visible separately.
- Desktop nav gap hover: scrim opacity1, pointer-events:none, same scroll position; leaving to scene→opacity0. No persistent header strip.
- After reload, Tab→logo gives actual focus-visible=true and whole-scene scrim1. Pointer click outside releases it.
- CUA390×844: heading20px→hidden, reverse104.5px→clear transparent header; scrim0, no horizontal overflow. No sticky hover attenuation.

Proofs: workspace tmp/header-v49/qa/desktop-transparent.png, desktop-menu.png, keyboard-menu.png, phone-transparent.png. Preview http://localhost:4321/?v=49#situations .

v48 remains recoverable; no publication or changes to product claims, geometry, lighting, media or motion.
