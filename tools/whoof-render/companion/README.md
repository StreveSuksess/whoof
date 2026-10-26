# Companion source

The base is **Labrador Dog**, kenchoo, based on **Dog**, all of life (CC BY 4.0). See `src/public/whoof/companion/CREDITS.txt`. Downloaded through the official Sketchfab account flow. The source archive is local in Downloads; extracted source/master files are under `../tmp/companion/`, not shipped with the website.

Run with the project's Blender 4.5.9 binary, from the workspace:

1. `inspect.py` imports the source GLB and saves `original.blend` and inventory.
2. `parts.py` inventories UV-seam-connected anatomical islands.
3. `pose.py` authors a seated pose, folded hind legs, tail and relaxed jaw.
4. `prepare.py` rebases the rig and all morph targets, relaxes seated soft tissue, adjusts neck ruff and builds 65,000 short weighted guard hairs. Exports Draco GLB.
5. `lighting.py` renders the studio HDR and contact shadow. `occlusion.py` bakes a local tissue AO map.
6. `poster.py` renders a still fallback with the original collar from the v15 Blender master.

Copy `../tmp/companion/companion.glb` to `src/public/whoof/companion/labrador-v1.glb`; encode `poster.png` to `poster.webp` with the existing sharp dependency. The browser reuses the original collar; only the flexible webbing ellipse adapts to the neck, leaving the tracker geometry rigid.

This is a visual trial. The first browser version was explicitly rejected for realism; source anatomy/facial texture and coat density still limit photorealism. The screenshot is not evidence of acceptance. No paid asset or 2D substitution is used for the interactive dog.
