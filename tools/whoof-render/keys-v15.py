"""Render only revised walk keys + fallback beauty, preserving v14 camera/light/collar."""
import bpy,sys,json,shutil,argparse
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(Path(__file__).parent))
from walk_keys import replace_walk_keys
TMP=ROOT.parent/'tmp/whoof-render';OUT=ROOT/'src/public/whoof/hero-v15';MASTERS=TMP/'masters-v15'
OUT.mkdir(exist_ok=True);MASTERS.mkdir(exist_ok=True)
a=argparse.ArgumentParser();a.add_argument('--draft',action='store_true');a.add_argument('--portrait',action='store_true');args=a.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
suffix='portrait' if args.portrait else 'landscape'
for f in (ROOT/'src/public/whoof/hero-v14').iterdir():
 if not (OUT/f.name).exists():shutil.copy2(f,OUT/f.name)
bpy.ops.wm.open_mainfile(filepath=str(TMP/f'hero-{suffix}.blend'))
scene=bpy.context.scene;prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
scene.cycles.device='GPU';scene.cycles.samples=32 if args.draft else 128
replace_walk_keys(bpy.data.collections['House keys'],args.portrait)
scene.render.resolution_percentage=50 if args.draft else 100
scene.render.film_transparent=False
for c in bpy.data.collections:c.hide_render=False
for o in bpy.data.collections['surface'].objects:o.is_shadow_catcher=False;o.visible_camera=True
if not args.draft:bpy.ops.wm.save_as_mainfile(filepath=str(TMP/f'hero-v15-{suffix}.blend'))
# Draft uses the complete image so scale, composition and shared light can be judged together.
scene.render.filepath=str(MASTERS/f'{suffix}{"-draft" if args.draft else ""}.png');bpy.ops.render.render(write_still=True)
if not args.draft:
 for role in ['collar','Walking lead','Play ball']:bpy.data.collections[role].hide_render=True
 for o in bpy.data.collections['surface'].objects:o.is_shadow_catcher=True
 scene.render.film_transparent=True;scene.render.filepath=str(MASTERS/f'{suffix}-keys.png');bpy.ops.render.render(write_still=True)
 points=[world_to_camera_view(scene,scene.camera,o.matrix_world@Vector(c)) for o in bpy.data.collections['House keys'].objects if o.type in {'MESH','CURVE','FONT'} for c in o.bound_box]
 xs=[v.x for v in points];ys=[1-v.y for v in points]
 meta=json.loads((OUT/f'{suffix}.json').read_text());meta['layers']['keys']={'x':(min(xs)+max(xs))/2,'y':(min(ys)+max(ys))/2,'width':max(xs)-min(xs),'height':max(ys)-min(ys)}
 meta['walkProps']='Detailed machined keys, split ring and dog-walk bag dispenser';(OUT/f'{suffix}.json').write_text(json.dumps(meta,indent=2))
print('KEYS_V15_COMPLETE',suffix)
