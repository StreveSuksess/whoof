# Companion photographic prototype prompts

Mode: built-in imagegen. Image edit guided by local extracted reference-frame-7.png (dog identity/anatomy/coat) and reference-macro.png (Whoof collar). No reference child retained. Output will be saved in public/whoof/companion-film/ after inspection.

## Anchor intent
Wide16:9 photographic seated golden retriever at68% horizontal position,82% image height, left42% negative space. Natural closed mouth/eyes, heterogeneous guard hairs/undercoat, neutral head yaw, body nearly frontal. Quiet pale gray studio with soft window light, restrained fill/contact shadow. Snug black woven25mm-style Whoof band, black low-profile capsule in same-black bezel within strap width; no invented logo or hanging tag. No humans, props or raster text.

## Exact anchor prompt

```text
Use case: identity-preserve / photographic campaign frame.
Edit the dog in the first reference into a single exceptional photorealistic campaign photograph for Whoof. First input: identity, real coat quality and natural anatomy reference. Second input: precise Whoof collar construction/detail reference. This is the neutral anchor frame for a later small head-turn film, not a layout mockup.
Composition: wide landscape 16:9 frame, dog seated naturally on the right at x=68%, body facing almost straight toward the camera with only a subtle 10-degree turn. Entire head, ears, chest, forelegs and front paws visible. Dog fills about 82% of frame height with head in upper-right-middle. Keep left 42% quiet empty space for real HTML typography; do NOT put any text in the photograph.
Dog: preserve the golden retriever appearance of the reference, extremely natural anatomy, soft expressive brown eyes with realistic wet corneal highlights and subtle eyelid rims, closed relaxed mouth, no tongue, no anthropomorphic smile. Head facing directly toward camera, neutral yaw, level and alert but calm. Luxurious REALISTIC golden coat: heterogeneous layered undercoat and guard hairs, fine strands around silhouette, long softly flowing chest/ear fur, shorter muzzle hair, subtle natural asymmetry and tonal variation. Must look photographed, never a game asset, wax, plastic, plush toy or excessively sharpened CGI.
Collar: the same refined black woven Whoof collar as the detail reference, believable narrow dog-collar proportion roughly 25mm wide, snugly nestled into fur, front centered low-profile horizontal black capsule inset in a black rounded bezel, all components same near-black color. Capsule is integrated within strap width, not a large separate box, screen, hanging tag or contrasting badge. Fine textile weave, black keepers and accurate subdued reflections; no readable branding invented.
Scene: quiet premium architectural studio, warm neutral pale gray plaster backdrop flowing into a matte stone-gray floor, soft distant tonal falloff. No furniture or props, no human, no window visible. Natural broad window light from upper left, restrained soft fill, natural dark-to-light modeling in fur, delicate contact shadow beneath paws and body. Modest depth of field; both eyes, nose and collar sharp, rear fur slightly softer. Sophisticated restrained photographic color, rich dimensional golden fur without orange cast, neutral background, fine optical detail, no artificial bloom or heavy vignette.
Constraints: one dog only. Locked eye-level medium-telephoto camera, no dramatic perspective, no motion blur. No letters, UI, captions, watermark, collage or split image. This should stand beside the photographic video reference as a credible real photograph.
```

Output: `src/public/whoof/companion-film/anchor-v1.png`; web copy `poster.webp`. Generated using built-in imagegen, inspected visually. This is a still, not a completed motion clip. Collar appearance is reference-guided, not a CAD-verified reproduction.

## Motion prompt (provider-independent)

Left start keyframe: `src/public/whoof/companion-film/start-left-v1.png`. This is a separate image edit, not a motion sequence. Generated yaw is visibly larger than the requested15degrees; judge usable clip range after motion generation.

Exact built-in imagegen edit prompt:

```text
Edit this exact photographic frame into the START KEYFRAME of a subtle dog head-turn film. Change ONLY the head yaw: the seated dog's muzzle and gaze point about 15 degrees toward the LEFT side of the image, as if looking at a person just left of camera. This must be a natural volumetric turn at the upper neck, not tilting or translating the head. Keep head pitch and roll level, closed mouth, eyes open, neutral relaxed expression. Preserve the exact same dog identity, head proportions, optical detail and coat. Absolutely preserve the entire image outside the head/uppermost neck: same camera, framing, resolution/aspect, background, lighting, shadows, body, paws, tail, chest fur, collar and black Whoof capsule unchanged in exactly the same pixel positions. Preserve the full wide composition and empty left space. No text, camera move, zoom, cropping, new objects or style change. Photorealistic photographic result.
```

One continuous locked-camera shot. The exact seated dog from the supplied image holds its body, shoulders, forelegs, paws, tail and collar stationary. Only the head gently and monotonically turns from approximately15degrees toward camera-left through forward-facing neutral to15degrees toward camera-right. Slow uniform angular speed over4seconds. Keep pitch and roll almost constant. Mouth remains gently closed; eyes stay open with steady calm expression. No blink, pant, tongue, head bob, ear flick or breathing cycle. Preserve exact dog identity, fur patterns and all collar/tracker proportions. Physically natural subtle neck deformation. Camera, focal length, framing, background, illumination, exposure and shadows completely fixed. Sharp individual frames, minimal motion blur. No cuts, zoom, pan, dolly, morphing, new objects or text. End on the rightward pose; do not automatically return. This footage will be scrubbed bidirectionally, so all motion must remain convincing reversed and when paused.

Use an actual leftward starting keyframe or a provider with explicit first/last constraints; neutral anchor alone may yield an extra initial move that must be trimmed. Duration/model/cost depend on verified provider capabilities, not assumed.
