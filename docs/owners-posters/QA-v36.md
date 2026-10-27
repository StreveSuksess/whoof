# v36 — continuous collar tumble

The prior story renderer blended two main poses and added only0.28radians of yaw. Its timing continued through the handoff, but the trajectory still appeared nearly static.

The renderer now applies Oryzo StackScene's normalized(1,1,1) diagonal axis-angle method as an additive quaternion. A pure scroll curve covers1.25turns(450degrees), with short acceleration/deceleration shoulders and constant cruise between them. Full turns are applied directly instead of quaternion endpoint slerp. The final slowdown occurs behind the arriving poster; stopping scroll holds the exact orientation, and reverse scroll restores it. Reduced motion has zero spin. Grounded hero pose and captured light/materials remain unchanged; a conservative uniform scale clearance keeps the rotating silhouette between text/media columns.

Validation:
- Added full-turn, five distinct intermediate orientations, continuous-speed joins, monotonic angle, reversal and reduced0 checks; they fail before implementation and pass with it.
- Production build4pages2.68s; targeted TypeScript, story, owner posters, landing and diff checks pass.
- Browser1440×900: intro and day/rhythm/history/context anchors show distinct front/profile/back/tilted views, without crossing the copy columns. v35poster overlap remains intact; no document horizontal overflow.
- Phone390×844: intro product and copy remain separated; normal viewport restored after review. Browser error/warn log empty.
- Proof directory: /Users/s.gavrilin/development/whoof/tmp/collar-rotation-v36/qa/.
- Physical-phone FPS and OS reduced-motion preference were not exercised. Pure reduced state is covered.

Preview: http://localhost:4321/?v=36#situations
