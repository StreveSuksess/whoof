# v38 — active source special effects

Restored the source five-level non-convolution Bloom and raw pointer paint input, while eased input still drives card/product movement. Source blue-noise and slow sketch breathing restored. High-pass/Gaussian strings copied; composite adapted to ivory ink/opaque graphite backdrop and generated edge gain calibrated to avoid blown highlights. Original product profile has distortion0, so that pass stays inactive. Physical product is drawn afterward through its existing light/color pipeline, on the same renderer.

Source profile:6amount,.25radius,.3threshold,.75smoothwidth,0luma,4selective,2saturation; kernels3/5/7/9/11. Max1600longedge decorative layer,5progressively halved levels, half-float withbytefallback. Phone/coarse/reduced bypass Bloom/painting; hidden/offscreen eligibility retained. Desktop visible offer animates continuously for source breathing/decay. No new images, dependencies, layout, prices or terms.

Final build4pages2.74s; targetedTS passes withdom.iterable. check-offer now covers source profile/weights, levelbounds, rawvsfilteredbrushresponse, breathing and quiet state. Story/owner/landing/gallery checks and diff check pass. Browser1020×1194native drag/decay and2-year selection without scroll jump;390×844quiet/nooverflow; canvas returns to first screen and re-enters offer; logs empty. No physical-device FPS or OS reduced preference toggle measured. Existing Threechunk size warning persists.

Proof: /Users/s.gavrilin/development/whoof/tmp/offer-fx-v38/qa/active.png, settled.png, decayed.png, phone.png.
Preview: http://localhost:4321/?v=38#order
