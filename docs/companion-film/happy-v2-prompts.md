# Happy expression v2 — 2026-10-11

User requested a smiling, happier dog. Built-in imagegen edit mode; no Runway credits used. Both images visually inspected. They remain stills, not animation. Previous v1 files retained.

## Neutral anchor

Input: `src/public/whoof/companion-film/anchor-v1.png`.
Output: `src/public/whoof/companion-film/anchor-happy-v2.png` (1672×941).
Web encoding: `poster-happy-v2.webp`, quality94. Review route now uses this version.

Exact prompt:

```text
Edit this exact photograph. Change ONLY the seated dog's facial expression from solemn to naturally happy and warmly engaged. A real relaxed canine smile: the mouth is slightly open, jaw gently relaxed, mouth corners softly drawn back, a small natural glimpse of pink tongue inside the mouth, warm softly attentive eyes, relaxed ears. Happy to see its owner, calm and affectionate, not laughing, not cartoonish, no human teeth or human smile, no exaggerated grin and no long hanging tongue. Preserve the exact individual dog, same head direction straight toward camera, same facial anatomy, golden fur detail and color. Absolutely preserve the entire scene and all other elements: unchanged seated body, shoulders, paws, tail, black woven Whoof collar and integrated black capsule, their dimensions and placement, camera framing, wide 16:9 composition with blank left side, soft studio window light, background, floor and shadows. Photorealistic premium pet-product campaign still, subtle credible expression. No letters, graphics, new objects or watermark.
```

## Left start frame

Input: `anchor-happy-v2.png`.
Output: `src/public/whoof/companion-film/start-left-happy-v2.png` (1672×941).
The resulting yaw is still larger than requested15degrees; a usable motion segment will need inspection/trimming.

Exact prompt:

```text
Edit this exact photographic frame into the START FRAME for a small dog head turn. Change ONLY head yaw: the dog's muzzle and eyes look slightly toward the LEFT side of the picture, about 15 degrees from straight ahead, a SMALL subtle turn, not a profile and not 30 degrees. Keep the same naturally happy relaxed canine smile, mouth slightly open, modest visible tongue, warm eyes, relaxed ears, exactly the same individual dog. Keep pitch and roll level. Preserve everything below the jaw and outside the head: seated body, paws, fur, tail, black woven Whoof collar and capsule, camera, wide 16:9 framing, empty left side, studio background, lighting and shadows in exactly the same positions. This is a physically natural neck/head yaw with consistent facial anatomy and unchanged photographic optical detail, never image distortion or cartoon expression. No new objects, text or graphics. Return a single full photographic frame.
```

## Motion prompt for v2

This supersedes the closed-mouth requirement in the v1 motion prompt:

```text
Locked camera. The seated dog slowly turns only its head from its initial leftward gaze through forward-facing neutral to a small rightward gaze, at a steady speed over 5 seconds. Preserve the naturally happy relaxed canine smile from the first frame throughout: the jaw and small visible tongue hold their positions relative to the head. Eyes stay open and warm. The body, paws, tail, shoulders and black collar with its tracker remain stationary. Only a subtle natural neck deformation accompanies the head turn. Head pitch and roll stay level. Framing, focus, exposure, soft studio lighting, background and shadows remain constant. Sharp individual frames with minimal motion blur. One continuous shot suitable for smooth bidirectional frame scrubbing. No panting, licking, blinking, ear flicking, head bobbing, extra mouth motion, camera movement, cuts, zoom, morphing, text or new objects. End looking slightly right; do not return automatically.
```

Runway web and plugin both currently gate video on this Free account. No video submission/upload performed.
