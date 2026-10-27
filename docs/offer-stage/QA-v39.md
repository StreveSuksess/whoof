# v39 — cursor trail direction fix

Transparent clearing on the shared premultiplied renderer multiplied velocity RGB by zero alpha. The intended neutral(.5,.5,0,0) became(0,0,0,0), introducing a constant two-axis feedback offset. Replaced this with a NoBlending shader clear, matching the source fboHelper strategy. All RGBA8velocity encode/decode now shares the representable neutral128/255. Resize also resets CPU velocity and stroke endpoints. Bloom, palette, layout and calibrated product render are unchanged.

Validation: actual WebGL regression reproduced legacy transparent-clear failure and passed67checks: every reset texel, stationary neutrality, signed velocity and stroke position in8directions,3secondlightdecay and reduced-motion no-paint. Prepare with `node tools/whoof-render/prepare-offer-paint-check.mjs`, serve printed directory onlocalhost4340and open with CUA. This uses the actual runtime class/shaders; no additional production route or runtime diagnostic was added.

Final Astro4pages2.67s; targetedTS, check-offer and git diff checks pass. Native page drags vertical/down and horizontal/left show the trail following pointer travel. Browser warnings/errors empty. No physical-device FPS measurement.

Proof: /Users/s.gavrilin/development/whoof/tmp/offer-direction-v39/qa/gpu-results.json, vertical.png, horizontal.png.
Preview: http://localhost:4321/?v=39#order
