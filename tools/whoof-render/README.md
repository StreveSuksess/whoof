# Whoof hero source

The first frame is rendered from the same `ProductCollar.ts` geometry as the live product; the supplied STL is not regenerated. Source dimensions remain a visual reconstruction, not verified manufacturing CAD.

1. `node tools/whoof-render/export-scene.mjs`
2. `Blender -b -t 8 --python tools/whoof-render/render.py -- --draft`
3. Inspect `../tmp/whoof-render/landscape.png`.
4. Render final layers: `Blender -b -t 8 --python tools/whoof-render/render.py -- --layers`; repeat with `--portrait --layers`.
5. `Blender -b -t 8 --python tools/whoof-render/product-layers.py` separates collar color from its contact shadow for the live handoff.
6. `node tools/whoof-render/encode.mjs` writes WebP assets to `src/public/whoof/hero-v14/`; PNG masters stay outside the served directory.

Blender 4.5.9 LTS was downloaded from https://download.blender.org/release/Blender4.5/ and runs from the local mounted image under `../tmp/render-tools/`. No global installation or system settings changed. Rendered `.blend` files are in `../tmp/whoof-render/`. Texture provenance is in `textures/SOURCES.md`.

Color, perspective, reflections and contact shadows are computed together. Product, lead, keys and ball are separate transparent layers over the background, analogous to the reference's layered first screen. Metadata records the camera and projected prop bounds for responsive framing and interaction.

## v15 — walk keys

`walk_keys.py` replaces the original flat-key/fob collection with thin machined key profiles, boolean-cut grooves, a double split ring and an unbranded dog-walk bag dispenser. `keys-v15.py` loads the saved v14 scenes and preserves all existing cameras/lights/collar geometry:

```
Blender -b -t 8 --python tools/whoof-render/keys-v15.py -- --draft
Blender -b -t 8 --python tools/whoof-render/keys-v15.py --
Blender -b -t 8 --python tools/whoof-render/keys-v15.py -- --portrait
node tools/whoof-render/encode.mjs v15
```

Only keys+complete fallback are re-rendered; unchanged layers are copied into `public/whoof/hero-v15/`. Updated projected bounds are saved alongside them. Full PNGs and the new .blend files remain in `../tmp/whoof-render/masters-v15/` and `../tmp/whoof-render/`.
Accessory use reference: https://www.earthrated.com/products/leash-dispenser-with-bags (compact dispenser with a loop for dog walks; no brand geometry or popularity claim).

## v16 — continuous live lighting

The live second block now uses the hero's light field instead of a separate animated light rig. Regenerate after changing the saved hero lights/materials:

```
Blender -b -t 8 --python tools/whoof-render/light-probe.py
../tmp/color-tools/bin/python tools/whoof-render/color-look.py
```

`light-probe.py` loads `hero-v15-landscape.blend`, removes product/props and captures the scene's four area emitters plus surface bounce to scene-linear `public/whoof/lighting/hero.hdr`. Camera-only emissive proxies do not double-illuminate the surface. Panorama center is Three +X, up is +Y. `color-look.py` uses PyOpenColorIO 2.6 (isolated local venv) with Blender's bundled config to bake AgX Medium High Contrast into `hero-look.bin` (33³ RGBA half-float, log2 input range -12.47393…4.026069, sRGB display output).

`OpeningLighting.ts` prefilters the HDR once, matches linear material values and applies the display LUT in each existing material pass. Lights/exposure remain constant while the original Oryzo animation rotates the collar. Landing uses the same detailed yarn as the offline export; /model/ keeps previous defaults. PMREM and contact attenuation approximate spatial Cycles shadows; they are not full runtime path tracing. Runtime additions: about1.16MiB before HTTP compression. No continuous idle WebGL render.

Crossfade is source-over: leave the lower collar plate opaque until live alpha reaches1. Fading both complementary alphas incorrectly shows the tabletop through the product.
