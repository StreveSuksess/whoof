# Whoof adaptation of Oryzo

Local prototype on branch `whoof-adaptation`. The runnable app is `src/`.

```sh
npm --prefix src run dev -- --host 127.0.0.1 --port 4321
# or
npm --prefix src run build
npm --prefix src run preview -- --host 127.0.0.1 --port 4321
```

The original 12-section composition, Three.js scene controllers, camera keyframes, smooth scroll, gallery choreography, GSAP text reveals and postprocessing remain the foundation. This is a direct modification of this repository, not the separate `../whoof-landing` design.

Whoof changes: Russian copy and navigation, official supplied branding/media, native video dialog, app screenshots, factual specifications, one product with three informational tabs, FAQ, and preorder links to whoof.ru. No newsletter/checkout/data collection. Source Mailchimp code removed.

`src/src/engine/scenes/whoofProduct.ts` loads the supplied STL into the shared animated product. Coordinates are uniformly scaled for the source stage; proportions are preserved. Creased normals preserve hard edges; a black housing shader participates in the source TAA pipeline. This is the supplied housing, not a new engineering model of a finished strapped product. `whoofLettering.ts` generates Whoof lettering for the existing fill/outline animation. Source Rive numerical claims were replaced with Whoof specifications. Source cup rendering and imaginary Pro/Max product stacks are disabled.

Local prototype limitations: the source desk, hand, cork/peel scenery, some baked images and microtexture graphics remain. These are reference environments, not product properties. Some source shadows still assume the round coaster. Original source is a reconstruction of Lusion's Oryzo; keep its attribution and original README. Source README limits mirrored assets to personal study; public commercial use requires permission or replacement of those assets.

Validation: Astro production build, finite STL attributes/triangle count/proportions, internal anchors and local Whoof media URLs checked. Desktop Chrome rendered the hero and camera transition and features scene; no JavaScript errors in the inspected console, six source texture initialization warnings. Full mobile and all interaction verification are tracked in project memory rather than assumed from the build.
