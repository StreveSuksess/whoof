# v50 — selected caption removal

Removed the six caption types selected by the user: hero category/tagline, situations synchronization footnote, owner research/generated-illustration footer, App concept/demo footer, story interface figcaptions and How illustration footer.

Removed their dedicated styles and controller writes. The empty hero-ui layer is unmounted and no longer queried; StoryText no longer accesses the removed sync node. Matching visible concept/demo labels inside AppArtwork and all four generated SVG derivatives are removed. Existing accessible image metadata, source provenance, main owner motives, actual charts and substantive synchronization explanations remain.

Validation: Astro four-route build, targeted Landing TypeScript, landing, App scene/artwork/physical rendering, owner rail and How motion/content checks pass; diff check passes. Main JS82.44KB; existingThreechunkwarning unchanged. No new tests/dependencies/rendering changes.

CUA: seven retired selectors (six types plus empty hero-ui) all have zero DOM matches. Five owner posters and four How scenes remain; owner rail inspected without footer or empty footer strip. App note and matching visible SVG text absent; console no warnings/errors. Native761×1194 and phone390×844 have no horizontal overflow; phone full reload at y0 confirms no tagline. Main hero headline/copy/CTA/price remain. Temporary viewport reset before handoff.

Proofs: workspace tmp/caption-v50/qa/hero.png, owners.png, phone.png, final-preview.png. Local preview http://localhost:4321/?v=50#intro . No publication or new product claims.
