# v48 — fixed-header overlap

The transparent fixed header could draw directly over outgoing headings. Navigation now hides during downward reading and returns on deliberate upward movement only when the current section leaves its lane clear. The returned compact header has a neutral covered surface; keyboard focus makes it immediately accessible.

## Implementation

- HeaderMotion runs in Landing's existing RAF, with 12px down / 18px up hysteresis, native overscroll clamping and resize direction reset.
- Header obstacle lists and section ranges are cached. Geometry is checked only in the section crossing the header, only when a reveal is possible, and reused while scroll/motion is idle. Distant inactive fixed stages cannot hold navigation hidden.
- Keyboard focus uses `:focus-visible`, so a mouse click does not leave the navigation permanently pinned. Hidden links do not intercept pointer input. The compact logo's real hitbox matches its visible width.
- Original hero logo scale/composition remains, no surface at the top. Reduced-motion CSS removes transitions. No-JS retains the existing absolute header.
- No scene pose/material/light, media, copy, section order or shared-canvas handoff changes.

## Verification

- Astro build: four routes. Targeted Landing TypeScript and diff checks pass. Existing Three 524KB warning unchanged; main landing JS 82.81KB.
- Header regression: supplied headline intersection, clear/departed/offscreen geometry, hero, forward/reverse, idle, trackpad jitter, focus, resize, overscroll and far anchors pass.
- Existing landing, Trust sequence, App scene and How regressions pass.
- CUA native desktop 1296×1194: heading at y20.52px on downward scroll, header hidden. Upward at y48px remained hidden, then returned with clear space; no double text. No horizontal overflow.
- CUA phone 390×844: heading at y19.5px on upward travel, header hidden; at y87px header returned. Actual logo hitbox99px, preorder nav separate. App and Offer downward/upward checks pass, no overflow.
- Keyboard Tab reaches hidden logo and reveals header immediately (focus-visible true, opacity1). Hero returned to y0 with original logo and surface opacity0. Final preview console has no warnings/errors.

Screenshots: workspace `tmp/header-v48/qa/desktop-down.png`, `desktop-return.png`, `keyboard-access.png`, `phone-clear.png`, `phone-return.png`, `phone-app.png`. Preview: http://localhost:4321/?v=48#situations .

Static/reduced layout and all existing section restrictions remain; no new product claims or publication.
