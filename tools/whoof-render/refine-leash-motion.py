"""Render65grounded lead poses; reuse all other approved v23 assets."""
import bpy,sys,json,shutil,argparse,math
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[2];TMP=ROOT.parent/'tmp/whoof-render'
sys.path.insert(0,str(Path(__file__).parent));from leash_motion import LeashPose
OUT=ROOT/'src/public/whoof/hero-v24';MASTER=TMP/'masters-v24';OUT.mkdir(exist_ok=True);MASTER.mkdir(exist_ok=True)
p=argparse.ArgumentParser();p.add_argument('--portrait',action='store_true');p.add_argument('--preview',action='store_true');p.add_argument('--validate',action='store_true');args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
fmt='portrait' if args.portrait else 'landscape'
bpy.ops.wm.open_mainfile(filepath=str(TMP/f'hero-v22-{fmt}.blend'))
scene=bpy.context.scene;lead=LeashPose(bpy.data.collections['Walking lead']);lead.validate();print('LEASH_GEOMETRY_VALID',fmt,flush=True)
meta=json.loads((ROOT/f'src/public/whoof/hero-v23/{fmt}.json').read_text())
asset=meta['motion']['leash'];old_rect=asset['rect'].copy()
def project(point):
 p=world_to_camera_view(scene,scene.camera,lead.world@point);return [p.x,1-p.y]
contact_poses=[];all_points=[]
for q in (-1,0,1):
 lead.apply(q);bpy.context.view_layer.update()
 contact_poses.append([[project(a),project(b)] for a,b in lead.contacts()])
 # Rope evaluated thickness + shadow margin fit the previous crop; enlarge if needed.
 all_points.extend(project(v) for v in lead.points)
 for a,b in lead.contacts():all_points.extend([project(a),project(b)])
lead.apply(0);bpy.context.view_layer.update()
x,y,w,h=old_rect;W,H=meta['width'],meta['height']
x0=max(0,min(x,min(p[0] for p in all_points)-.035));y0=max(0,min(y,min(p[1] for p in all_points)-.04))
x1=min(1,max(x+w,max(p[0] for p in all_points)+.05));y1=min(1,max(y+h,max(p[1] for p in all_points)+.05))
x0=math.floor(x0*W)/W;y0=math.floor(y0*H)/H;x1=math.ceil(x1*W)/W;y1=math.ceil(y1*H)/H
asset['rect']=[x0,y0,x1-x0,y1-y0]
asset['contacts']=[{'negative':a,'rest':b,'positive':c} for a,b,c in zip(*contact_poses)]
asset['segments']=[];asset['frames']=[f'{fmt}-leash-{i:02d}.webp' for i in range(65)]
meta['motionSampling']['leash']=65;meta['walkProps']='Grounded hinges/rolling; inextensible lead bend and rigid terminal swivel'
if args.validate:print('LEASH_CONTACTS_VALID',fmt,len(asset['contacts']),flush=True);sys.exit(0)
for file in (ROOT/'src/public/whoof/hero-v23').glob(f'{fmt}*.webp'):
 if '-leash-' not in file.name:shutil.copy2(file,OUT/file.name)
shutil.copy2(TMP/f'masters-v22/{fmt}-catcher-empty.png',MASTER/f'{fmt}-catcher-empty.png')
(OUT/f'{fmt}.json').write_text(json.dumps(meta,indent=2))
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
scene.cycles.device='GPU';scene.cycles.samples=64;scene.cycles.adaptive_threshold=.015;scene.cycles.seed=0;scene.cycles.use_animated_seed=False
scene.render.resolution_percentage=75;scene.render.film_transparent=True;scene.render.image_settings.color_mode='RGBA'
for role in ['collar','House keys','Play ball']:bpy.data.collections[role].hide_render=True
for o in bpy.data.collections['surface'].objects:o.is_shadow_catcher=True
scene.render.use_border=True;scene.render.use_crop_to_border=True
x,y,w,h=asset['rect'];scene.render.border_min_x=x;scene.render.border_max_x=x+w;scene.render.border_min_y=1-y-h;scene.render.border_max_y=1-y
for i in ([0,32,64] if args.preview else range(65)):
 target=MASTER/f'{fmt}-leash-{i:02d}.png'
 if target.exists():continue
 if i==32 and asset['rect']==old_rect:shutil.copy2(TMP/f'masters-v22/{fmt}-leash-08.png',target);continue
 lead.apply((i-32)/32);bpy.context.view_layer.update();scene.render.filepath=str(target);bpy.ops.render.render(write_still=True)
print('LEASH_RENDER_COMPLETE',fmt,'preview' if args.preview else '65poses',flush=True)
