# v47 — remove superseded Wearing screens

User explicitly requested removing the two old visual blocks after the new Trust scene. Landing now renders intro/situations/owners/app/how/trust/order/faq. The old specifications, wearing notes and Life video gallery are unmounted as their combined Wearing component. Sources/assets remain recoverable; no media files deleted. Device navigation now targets Trust.

Removed unconditional DetailsText/LifeGallery setup, measurements, listeners, rendering and lifecycle calls. Trust no longer queries #wearing or #details; its model and text end at its own actual section boundary. Trust gets exclusive canvas ownership until that boundary, then Offer acquires the same renderer. Strict viewport-intersection clipping prevents the Trust model or text covering the entering Offer. The text layer holds its screen composition within the same strict clip, so departing copy no longer scrolls over the product. Authored Trust copy/poses/materials and the other sections are preserved.

Checks: Astro four-route build, targeted Landing TypeScript and diff check passed. Updated landing/trust structural/clip checks and existing physical pose, app and How checks passed. Remaining semantic IDs are [1,2,3,4,5,6,8,9]; all internal anchors resolve; no legacy Wearing/Details/Life IDs/cards/controls in output. Main JS bundle fell from92.83KB to81.51KB before the small text-clip adjustment; no new dependency/context/RAF.

Native761×1194: Trust bottom equals Offer top477.48px atTrust4.0001H, clipbottom716.11px, Trust owns canvas while Offer does not. At4.7003H ownership transfers to Offer; reverse restores Trust. Phone390×844: same ownership at4.7004H and4.0001H, full exit clip844px, no horizontal overflow. Old screens absent in both DOM checks. Final browser warning/error checks recorded on the working preview; viewport override reset. Physical FPS/OSreduced toggle not measured.

Proof: workspace tmp/legacy-removal-v47/qa/direct-transition.png and phone-offer.png. Preview http://localhost:4321/?v=47#trust. Priorv46ca9c4e0/tag retained, local only. No publication, purchases, external messages or new media generation.
