# v41 — spatial object choreography

User28October rejected the frontal/static pair as toy-like. Phone and collar now follow normalized, nonuniform cubic Hermite pose tracks. The phone banks through opposite three-quarter views, crosses the frame, becomes substantially larger in portrait and recedes beneath the following title. The collar enters with a bank and continues a diagonal-axis roll through the Howintro, rather than stopping at handoff=1. No elapsed-time bobbing or independent RAF.

Desktop handoff copy moves to the upper-right and appears after the phone clears that lane. Mobile keeps the upper caption and bounded lower pair. Low-height landscape hides the redundant handoff subtitle and reduces heading sizes. Phone ambient fill/clearcoat reduced with narrower soft strip reflections; captured collar environment/materials/lighting/exposure and all prior sections remain unchanged. Same one renderer and attached screen. No new assets/dependencies/productclaims.

Validation: final Astro4pages2.39s; targetedTS/appscreen/motion/markup/diff checks pass. New tests cover exact pose keys, first-derivative continuity, continued phone turn/collar roll after5.8H, frame deltas, foreground scale and reverse/reduced state. Existing story/offer/landing checks pass. Existing Threechunk size warning remains.

Browser1020×1194,1440×900and390×844: multiple pair/carry frames show changed silhouettes/banking, attached legible UI, no horizontal overflow or text/device collision. Native reverse checked; consolewarnings/errors empty.844×390checked with reduced headings. Viewport emulation may restore a prior scroll position; checks used settled DOM bounds/native navigation. Normal viewport restored and current transition retained. Physical-device FPS and OS reduced toggle not measured.

Proof: /Users/s.gavrilin/development/whoof/tmp/app-choreography-v41/qa/{portrait-reveal,wide-opposite-bank,wide-reveal,phone-reveal,short-carry,return-carry}.png.
Preview: http://localhost:4321/?v=41#app
