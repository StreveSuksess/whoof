# v53 — App block repair

Validated 2026-10-29. Recovery checkpoint: v52 `1e7db06`.

## Cause and repair

The fourth block had entered its fallback after the lazy CSS3DRenderer dependency returned HTTP504. A build had replaced the running dev server's dependency optimizer cache: its in-memory imports still referenced files that were no longer on disk. App fallback then cleared SplitText character `cssText`, removing `display:inline-block` from generated divs and stacking individual letters vertically. A clean native reload reproduced both the warning and the malformed headings.

Static/reduced/fallback resize now reverts SplitText to original heading markup and measures afterward. Animated mode alone creates line/word/character wrappers. Returning from reduced mode reuses the same instance correctly; dispose/remount restores source text. The next How heading also stays native in static mode. There is no blanket clearing of glyph styles.

Astro config-setup isolates the dev/build Vite cache directories under `node_modules/.vite-whoof/{command}`. An unchanged live CSS3D dependency URL returned200 after a concurrent production build, and the dev metadata SHA remained byte-identical. No production dependency, renderer or ticker was added.

Responsive QA also exposed compare/context captions crossfading over each other in the same text frame. Their fades now run sequentially in both scroll directions. The narrow portrait caption column leaves clearance for the existing phone pose. Product material/light/poses, copy, other blocks and the ending remain intact.

## Verification

- Four-route Astro build, targeted Landing TypeScript, diff whitespace and App regression suite pass. Existing landing and kibble guards pass.
- New isolated browser fixture bundles the actual AppExample/GSAP. Before repair it fails at `native heading 0` with block-level glyph divs. After repair all40 checks pass at1280×720 and390×844: native fallback text/line breaks, bounded heading height, repeated resize, reduced→animated on the same instance, dispose and remount. The reduced query is stubbed only inside this fixture; OS settings were not changed.
- Native real scene: day, comparison, context and phone appear again with one App canvas and one CSS vector layer, without app-static. At390×844 context heading stays73.90px high; no horizontal overflow. Forward phase3.670 shows only the incoming context caption; reverse phase3.450 shows only comparison. Numeric checks assert at most one nonzero caption across all sampled phases/viewports.
- Fresh ending load followed by keyboard activation of the real header App link restores the shared canvas to App, detaches Ending and loads the vector phone. No new warning/error console messages in this validation tab.
- Final restored761×1194 view: context title131.18px high, paragraph ends at308.20px clear of the phone; one visible caption. Temporary viewport override reset. Final tab retained for user review.

Proofs outside served assets: `../tmp/app-fix-v53/qa/{fallback-desktop,fallback-phone}.{json,png}`, `phone-context.png`, `final-preview.png`; cache before/after manifests in `../tmp/app-fix-v53/`.

Main JS88.27KB; shared Three527.27KB; existing >500KB warning remains. No device GPU FPS claim. Local preview: http://localhost:4321/?v=53#app . No publication or push.
