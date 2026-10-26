"""Densify the approved v22 key/ball paths without changing scene or geometry."""
import bpy, sys, json, argparse, shutil
from pathlib import Path
from mathutils import Matrix, Vector
ROOT=Path(__file__).resolve().parents[2];TMP=ROOT.parent/'tmp/whoof-render'
OUT=ROOT/'src/public/whoof/hero-v23';MASTERS=TMP/'masters-v23'
OUT.mkdir(exist_ok=True);MASTERS.mkdir(exist_ok=True)
p=argparse.ArgumentParser();p.add_argument('--portrait',action='store_true');args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
fmt='portrait' if args.portrait else 'landscape'
bpy.ops.wm.open_mainfile(filepath=str(TMP/f'hero-v22-{fmt}.blend'))
scene=bpy.context.scene;prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
scene.cycles.device='GPU';scene.cycles.samples=64;scene.cycles.adaptive_threshold=.015
# Correlated sampling suppresses frame-to-frame denoising sparkle on static parts.
scene.cycles.seed=0;scene.cycles.use_animated_seed=False
scene.render.resolution_percentage=75;scene.render.film_transparent=True
scene.render.image_settings.color_mode='RGBA';scene.render.use_border=True;scene.render.use_crop_to_border=True
meta=json.loads((ROOT/f'src/public/whoof/hero-v22/{fmt}.json').read_text())
for name in ['background','shadow','collar','']:
 filename=f'{fmt}{"-"+name if name else ""}.webp'
 shutil.copy2(ROOT/'src/public/whoof/hero-v22'/filename,OUT/filename)
for frame in meta['motion']['leash']['frames']:shutil.copy2(ROOT/'src/public/whoof/hero-v22'/frame,OUT/frame)
shutil.copy2(TMP/f'masters-v22/{fmt}-catcher-empty.png',MASTERS/f'{fmt}-catcher-empty.png')
for role in ['collar','Walking lead','House keys','Play ball']:bpy.data.collections[role].hide_render=True
for o in bpy.data.collections['surface'].objects:o.is_shadow_catcher=True
key_groups=[o for o in bpy.data.collections['House keys'].objects if 'hole_anchor' in o]
ball_objects=list(bpy.data.collections['Play ball'].objects)
bpy.context.view_layer.update()
ball_rest={o.name:o.matrix_world.copy() for o in ball_objects}
ball_centre=next(o for o in ball_objects if o.name=='Soft rubber ball').matrix_world.translation.copy()
def keys(q):
 for i,g in enumerate(key_groups):
  g.rotation_euler=(g['rest_tilt'],0,g['rest_angle']+q*(.15 if i==0 else .075))
  g.location=Vector(g['hole_anchor'])-g.rotation_euler.to_matrix()@Vector((0,.020,0))
def ball(q):
 theta=q*.42
 transform=Matrix.Translation((theta*.32,0,0))@Matrix.Translation(ball_centre)@Matrix.Rotation(theta,4,'Y')@Matrix.Translation(-ball_centre)
 for o in ball_objects:o.matrix_world=transform@ball_rest[o.name]
for name,role,pose in [('keys','House keys',keys),('ball','Play ball',ball)]:
 asset=meta['motion'][name];asset['frames']=[f'{fmt}-{name}-{i:02d}.webp' for i in range(65)]
 x,y,w,h=asset['rect'];scene.render.border_min_x=x;scene.render.border_max_x=x+w;scene.render.border_min_y=1-y-h;scene.render.border_max_y=1-y
 bpy.data.collections[role].hide_render=False
 for i in range(65):
  target=MASTERS/f'{fmt}-{name}-{i:02d}.png'
  if target.exists():continue
  # Existing exact poses (including neutral) remain pixel-identical to v22.
  if i%4==0:
   shutil.copy2(TMP/f'masters-v22/{fmt}-{name}-{i//4:02d}.png',target);continue
  pose((i-32)/32);bpy.context.view_layer.update()
  scene.render.filepath=str(target);bpy.ops.render.render(write_still=True)
 pose(0);bpy.data.collections[role].hide_render=True
meta['motionSampling']={'keys':65,'ball':65,'leash':17}
(OUT/f'{fmt}.json').write_text(json.dumps(meta,indent=2))
print('DENSE_MOTION_COMPLETE',fmt,flush=True)
